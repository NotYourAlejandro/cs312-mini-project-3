drop table blogs;
drop table users;

create table users (
    uid serial primary key,
    password varchar(255) not null,
    name varchar(255) not null unique
);

insert into users (name, password) 
    values ('Geralt',    '$2b$10$DRiDnFr7FsTENmJqadWnZO6kYdmqeR4fgQDzjsEkztDNXh.gaiXn.'),
           ('Yennefer',  '$2b$10$L5u7g354Xqu8ZMxAnt.hR.FUEfN9fR59uYMEWliCZ0NkbhIA5uR8K'),
           ('Ciri',      '$2b$10$9KBqPLMVmXqQ4OScVJhEmO9rYY9VEvj1CjknvwNhVikE76YMqzwzS'),
           ('Dandelion', '$2b$10$mQgn4zTaTQaGspXMtnzJcuC8XobuA0Kx45sSccfMbU/7hemdEBr0m'),
           ('Roach',     '$2b$10$rxYRHaigq1DOX43hjNYpqenVUF2HOF6jMp2AhQ8nX/EU0ebiQyX/a');

create table blogs (
    blog_id serial not null,
    author_uid int not null,
    title varchar(255) not null,
    body text,
    date_created date
);

insert into blogs (author_uid, date_created, title, body)
    values 
        (4, '2026-10-01', 'The White Wolf and the Witcher''s Song', 'The witcher came to town with a sword at his hip and a scowl that could stop a brawl. The bard, naturally, turned that mood into a story worth singing. A lesson in danger, charm, and just enough chaos to keep the tavern awake.'),
        (4, '2026-10-02', 'A Ballad for the Road', 'When the roads are muddy and the moon is high, every traveler has a tale. I call it a ballad of survival, where the monsters are real and the danger is half rumor, half instinct. The best songs are written where the firelight flickers.'),
        (4, '2026-10-03', 'Why Every Tavern Needs a Witcher', 'I have seen kings, sorceresses, and fools in equal measure. But a witcher in a tavern is a different kind of spectacle: a warning, a promise, and often the only reason the room is still standing by closing time.'),
        (1, '2026-10-04', 'Monster Hunt in Vizima', 'A quiet night, a muddy trail, and enough cursed nonsense to ruin a perfectly decent contract. The job was simple: track the beast, kill the beast, collect the coin. The world, of course, insisted on making it complicated.'),
        (2, '2026-10-05', 'Chaos, Magic, and a Very Useful Fireball', 'Every plan is improved by a bit of controlled chaos. I prefer elegance, obviously, but a sorceress knows when to improvise and when to let the battlefield burn a little brighter than expected.'),
        (3, '2026-10-06', 'A Girl, a Horse, and a Future Bigger Than a Kingdom', 'Some stories begin with a rider, some begin with a prophecy, and some begin with the simple fact that destiny is impossible to ignore. The road ahead is long, but the spark in the girl''s eyes is stronger than fear.'),
        (5, '2026-10-07', 'The Stable of Destiny', 'A horse is not just a mount. In a world of monsters and magic, a reliable steed is a companion, a tactical advantage, and sometimes the only thing keeping a weary traveler upright.'),
        (4, '2026-10-08', 'From the Court of the Jester to the Court of the Crown', 'There are songs for kings and songs for kingslayers. The true art lies in knowing which tune to sing when the room is full of danger and the only safe move is to tell the truth with a smile.'),
        (4, '2026-10-09', 'The White Wolf in the Candlelight', 'He never admits it, but even the witcher likes a good story when the candles are low and the wine is strong. Some legends are written by history. Others are written by people who have seen the man behind the legend.'),
        (4, '2026-10-10', 'An Ode to the Unlikely Heroes', 'The world is full of kings with silver tongues and fools with sharp blades. The heroes who matter most are the ones who keep moving when the odds are stacked against them, even if nobody sings their names until long after the battle is over.');
