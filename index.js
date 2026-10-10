import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import { Client } from "pg";

const app = express();
const port = 7777;

// middleware
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

// interface Post {
//   id: number,
//   date: Date
//   author: string,
//   title: string,
//   content: string
// }

let posts = [
  {
    id: 1,
    date: new Date(),
    author: "root",
    title: "My First Post",
    content: "Hello! This is my first post on this site!",
  },
  {
    id: 2,
    date: new Date(),
    author: "root",
    title: "My Second Post",
    content: "Hello! This is my second post on this site!",
  },
];

// database setup
const PG_HOST     = "127.0.0.1";
const PG_PORT     = 5432;
const PG_DATABASE = process.env.PG_DATABASE;
const PG_USER     = process.env.PG_USER;
const PG_PASSWORD = process.env.PG_PASSWORD;

const db = new Client({
  host: PG_HOST,
  port: PG_PORT,
  database: PG_DATABASE,
  user: PG_USER,
  password: PG_PASSWORD,
});
await db.connect();

// Homepage (posts display)
app.get("/", (req, res) => {
  res.render("index.ejs", { posts: posts });
});

app.get("/edit/:id", (req, res) => {
  let id = 0;  

  if (req.params.id == "new") {
    if (posts.length > 0) {
      id = Number(posts[posts.length - 1].id) + 1;
    } else {
      id = 1;
    }

    res.render("editor.ejs", {
      post: { id: id, title: "New Post", content: "" },
    });
    return;
  }
  
  id = posts.find(post => post.id == Number(req.params.id)).id;
  
  if (id === undefined) {
    res.status(404).send(`Error: Invalid post id '${req.params.id}'`);
    return;
  }

  res.render("editor.ejs", { post: posts.find(post => post.id === id) });
});

app.post("/delete/:id", (req, res) => {
  if (posts.some(post => post.id === Number(req.params.id))) {
    posts = posts.filter(post => post.id != Number(req.params.id))
  }
  res.redirect('/')
});

app.post("/submit-post", (req, res) => {
  const constructed_post = {
    id: Number(req.body.id),
    date: new Date(),
    author: req.body.author,
    title: req.body.title,
    content: req.body.content,
  };

  if (constructed_post.author.length === 0) {
    res.send("Error: Cannot submit with no author");
    return;
  }
  else if (constructed_post.title.length === 0) {
    res.send("Error: Cannot submit with no title");
    return;
  } else if (constructed_post.content.length === 0) {
    res.send("Error: Cannot submit with no post content");
    return;
  }

  if (posts.some(post => post.id == Number(req.body.id))) {
    const index = posts.findIndex(post => post.id == Number(req.body.id))
    
  if (index !== -1)
    posts[index] = constructed_post;
  } else {
    posts.push(constructed_post);
  }

  res.redirect("/");
});

app.listen(port, () => console.log(`Open in browser: http://localhost:7777`));

db.close();
