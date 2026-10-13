import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import passport from "passport";
import { Strategy } from "passport-local";
import bcrypt from "bcryptjs";
import { Client, Pool } from "pg";

const app = express();
const port = 7777;

// middleware
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// db vars
const PG_HOST     = "127.0.0.1";
const PG_PORT     = 5432;
const PG_DATABASE = process.env.PG_DATABASE;
const PG_USER     = process.env.PG_USER;
const PG_PASSWORD = process.env.PG_PASSWORD;

// db setup
const db = new Client({
  host: PG_HOST,
  port: PG_PORT,
  database: PG_DATABASE,
  user: PG_USER,
  password: PG_PASSWORD,
});
await db.connect();

// make a pool just to store auth session data
const sessionPool = new Pool({
  host: PG_HOST,
  port: PG_PORT,
  database: PG_DATABASE,
  user: PG_USER,
  password: PG_PASSWORD,
});
const PgSessionStore = connectPgSimple(session);
const sessionSecret = "superSecretSecret";

// prep all the middlewares
app.use(session({
  store: new PgSessionStore({ pool: sessionPool, createTableIfMissing: true }),
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" },
}));
app.use(passport.initialize());
app.use(passport.session());
app.use((req, res, next) => {
  res.locals.user = req.user;
  next();
});

// setup passport's local strategy
passport.use(new Strategy(async (username, password, cb) => {
  try {
    const users = await db.query(
      "SELECT uid, name, password FROM users WHERE name = $1",
      [username]
    );
    const user = users.rows[0];

    // check if user exists and password is right
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return cb(null, false);
    }


    if (bcrypt.getRounds(user.password) !== 10) {
      const passwordHash = await bcrypt.hash(password, 10);
      await db.query("UPDATE users SET password = $1 WHERE uid = $2", [passwordHash, user.uid]);
    }
    return cb(null, { uid: user.uid, name: user.name });
  } catch (error) {
    return cb(error);
  }
}));

passport.serializeUser((user, done) => done(null, user.uid));
passport.deserializeUser(async (uid, done) => {
  try {
    const result = await db.query("SELECT uid, name FROM users WHERE uid = $1", [uid]);
    done(null, result.rows[0] || false);
  } catch (error) {
    done(error);
  }
});

// Upgrade existing plaintext or non-cost-10 passwords without requiring a database reset.
const existingUsers = await db.query("SELECT uid, password FROM users");
for (const user of existingUsers.rows) {
  if (!/^\$2[aby]\$\d{2}\$/.test(user.password)) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await db.query("UPDATE users SET password = $1 WHERE uid = $2", [passwordHash, user.uid]);
  }
}

// handy helper middleware auth-check function
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect("/login");
}

// homepage
app.get("/", async (req, res) => {
  const postsResult = await db.query(
    `SELECT blogs.blog_id, blogs.author_uid, users.name, blogs.date_created, blogs.title, blogs.body
     FROM blogs
     INNER JOIN users
     ON users.uid = blogs.author_uid
     ORDER BY blogs.date_created DESC;`
  );
  res.render("index.ejs", { posts: postsResult.rows });
});

// edit page
app.get("/edit/:id", ensureAuthenticated, async (req, res) => {
  if (req.params.id === "new") {
    res.render("editor.ejs", { post: { id: "", title: "New Post", body: "" } });
    return;
  }

  // fetch from db
  const postResult = await db.query(
    "SELECT blog_id, author_uid, title, body FROM blogs WHERE blog_id = $1",
    [req.params.id]
  );
  const post = postResult.rows[0];

  // sanity checks
  if (!post) {
    res.sendStatus(404);
    return;
  }
  if (Number(post.author_uid) !== Number(req.user.uid)) {
    res.sendStatus(403);
    return;
  }

  res.render("editor.ejs", {
    post: { id: post.blog_id, title: post.title, body: post.body },
  });
});

app.post("/delete/:id", ensureAuthenticated, async (req, res) => {
  await db.query(
    "DELETE FROM blogs WHERE blog_id = $1 AND author_uid = $2",
    [req.params.id, req.user.uid]
  );
  res.redirect("/");
});

app.post("/submit-post", ensureAuthenticated, async (req, res) => {
  const title = req.body.title;
  const body = req.body.content;

  // sanity check
  if (!title || !body) {
    res.status(400).send("Error: Cannot submit with no title or post content");
    return;
  }

  // publish post/edit
  if (req.body.id) {
    const result = await db.query(
      `UPDATE blogs SET title = $1, body = $2
       WHERE blog_id = $3 AND author_uid = $4 RETURNING blog_id`,
      [title, body, req.body.id, req.user.uid]
    );
    if (result.rowCount === 0) {
      res.sendStatus(403);
      return;
    }
  } else {
    await db.query(
      `INSERT INTO blogs (author_uid, date_created, title, body)
       VALUES ($1, CURRENT_DATE, $2, $3)`,
      [req.user.uid, title, body]
    );
  }

  res.redirect("/");
});

app.get("/login", (req, res) => {
  // pass error handling into template
  res.render("login.ejs", { error: req.query.error === "1" });
});

// perform login
app.post("/login", passport.authenticate("local", {
  failureRedirect: "/login?error=1",
}), (req, res) => {
  res.redirect("/");
});

// perform logout
app.post("/logout", (req, res, next) => {
  req.logout((error) => {
    if (error) return next(error);
    req.session.destroy((sessionError) => {

      if (sessionError) {
        return next(sessionError);
      }

      // clear session cookie and redirect to home
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
});

app.listen(port, () => console.log(`Open in browser: http://localhost:${port}`));
