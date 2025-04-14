const express = require('express');
const app = express();
const cp = require("cookie-parser");
const jwt = require("jsonwebtoken");
const db = require('./db');

const jwtKey = ';iojth[249ht04jt043j[0gfjq430[pgfjwe[0fjwe';

app.set('view engine', 'ejs');
app.use(cp());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    const userCookie = req.cookies.user;
    if (userCookie) {
        jwt.verify(userCookie, jwtKey, (err, decoded) => {
            if (err) {
                console.log(err);
            } else {
                req.user = {
                    username: decoded.username,
                    isAdmin: decoded.isAdmin
                }
            }
            next();
        });
        return;
    }
    next();
})

function auth(req, res, next) {
    if (req.user) {
        return next();
    }
    res.redirect('/login');
}

app.get('/', auth, (req, res) => {
    return res.render('index', {user: req.user});
})

app.get('/login', (req, res) => {
    res.render('login');
}) 

app.get('/logout', (req, res) => {
    res.clearCookie('user'); 
    res.redirect('/login'); 
});

app.post('/login', async (req, res) => {
    const { username, password, action } = req.body;

    if (action === "Register") {
        const existing = await db.query('SELECT * FROM users WHERE username = $1', [username]);
        if (existing.rows.length > 0) {
            return res.redirect('/login');
        }
        await db.query('INSERT INTO users (username, password, is_admin) VALUES ($1, $2, $3)', [username, password, false]);
        return res.redirect('/');
    } else {
        const result = await db.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
        const user = result.rows[0];
        if (user) {
            const token = jwt.sign({ username: user.username, isAdmin: user.is_admin }, jwtKey);
            res.cookie('user', token);
            return res.redirect('/');
        } else {
            return res.redirect('/login');
        }
    }
});

app.get('/all', auth, async (req, res) => {
    const result = await db.query('SELECT * FROM Nails ORDER BY date, time');
    const nails = result.rows.map(nail => {
        const date = nail.date.toString();
        const output = new Date(Date.parse(date)).toISOString().slice(0, -1).split('T')[0];
        return {
            ...nail,
            output
        };
    })

    res.render('all_nails',{
        nails: nails,
        user: req.user 
    })
});

app.get('/statistic', auth, (req, res) => {
    if (!req.user.isAdmin) return res.redirect('/');
    res.render('statistic', { stats: null });
});

app.post('/statistic', auth, async (req, res) => {
    if (!req.user.isAdmin) return res.redirect('/');

    const { from, to } = req.body;

    if (!from || !to) return res.redirect('/statistic');

    const result = await db.query(
        `SELECT date, COUNT(*) as count 
         FROM Nails 
         WHERE date BETWEEN $1 AND $2 
         GROUP BY date 
         ORDER BY date`,
        [from, to]
    );

    const stats = result.rows.map(row => ({
        date: row.date.toISOString().split('T')[0],
        count: row.count
    }));

    res.render('statistic', { stats });
});


app.post('/add', async (req, res) => {
    const username = req.user.username;
    const date = req.body.date;
    const time = req.body.time;

    if(!username || !date || !time){
        res.redirect('/')
    }
    const existing = await db.query(
        'SELECT * FROM Nails WHERE date = $1 AND time = $2',
        [date, time]
    );

    if (existing.rows.length > 0) return res.redirect('/');

    await db.query(
        'INSERT INTO nails (username, date, time) VALUES ($1, $2, $3)',
        [username, date, time]
    );

    res.redirect('/');
});

app.post('/delete', auth, async (req, res) => {
    const index = Number(req.body.index);
    const result = await db.query('SELECT * FROM Nails ORDER BY date, time');
    const nails = result.rows;

    if (!isNaN(index) && index >= 0 && index < nails.length) {
        const id = nails[index].id;
        await db.query('DELETE FROM Nails WHERE id = $1', [id]);
    }

    res.redirect('/all');
});


app.listen(3000)