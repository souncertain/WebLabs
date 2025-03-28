const express = require('express');
const fs = require("fs");
const app = express();
const cp = require("cookie-parser");
const jwt = require("jsonwebtoken");

const jwtKey = ';iojth[249ht04jt043j[0gfjq430[pgfjwe[0fjwe';

const nailsFile = './nails.json';
const usersFile = './users.json';

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

app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    if (req.body.action === "Register"){
        fs.readFile(usersFile, function(err, data){
            const users = JSON.parse(data);
            console.log(users);
            if (users.some(user => user.username === username)) {
                return res.redirect('/login');
            }
            isAdmin = false;
            console.log(username, password, isAdmin);
            users.push({username, password, isAdmin});
            fs.writeFile(usersFile, JSON.stringify(users), function (err) {
                res.redirect('/');
            });
        })
        return;
    }
    else{
        fs.readFile(usersFile, function(err, data){
            const users = JSON.parse(data);
            console.log(users);
            const user = users.find(user => user.username === username && user.password === password);
            if (user) {
                const token = jwt.sign({username: user.username, isAdmin: user.isAdmin}, jwtKey);
                res.cookie('user', token);
                return res.redirect('/');
            }
            else{
                res.redirect('/login');
            }
        })
    }
})

app.get('/all', auth, function (req, res) {
    fs.readFile(nailsFile, function (err, data) {
        const nails = JSON.parse(data);
        const user = req.user;
        res.render('all_nails', {
            nails,
            user
        });
    });
});

app.post('/add', function (req, res) {
    const name = req.user.username;
    const date = req.body.date;
    const time = req.body.time;

    if (name && date && time) {
        fs.readFile(nailsFile, function (err, data) {
            const nails = JSON.parse(data);
            
            let flag = true;
            
            const dayDate = Number(date.substring(0,2));
            const monthDate = Number(date.substring(3,5));
            const yearDate = Number(date.substring(6));
            
            if(time.length < 5){
                flag = false;
            }

            const hourDate = Number(time.substring(0, 2));
            const minutesDate = Number(time.substring(3, 5));


            const first = (isNaN(dayDate) || isNaN(monthDate) || 
                isNaN(yearDate) || yearDate === 0 ||
                monthDate === 0 || isNaN(hourDate) || isNaN(minutesDate))

            if (first){
                console.error("Неверный формат");
                flag = false;
            }

            nails.forEach(appointment => {
                const dayAppointment = Number(appointment.date.substring(0,2));
                const monthAppointment = Number(appointment.date.substring(3,5));
                const yearAppointment = Number(appointment.date.substring(6));

                const hourAppointment = Number(appointment.time.substring(0,2));
                const minutesAppointment = Number(appointment.time.substring(3,5));
                
                const newAppointmentDate = new Date(yearAppointment, monthAppointment - 1, dayAppointment, hourAppointment, minutesAppointment);
                const newInputDate = new Date(yearDate, monthDate - 1, dayDate, hourDate, minutesDate);


                if(newAppointmentDate.getDate() === newInputDate.getDate() && newAppointmentDate.getTime() === newInputDate.getTime()){
                    flag = false;
                }
            });
            if(flag){
                nails.push({
                    name, date, time
                })
                fs.writeFile(nailsFile, JSON.stringify(nails), function (err) {
                    res.redirect('/');
                });
            }
            else{
                res.redirect('/');
            }
        });
    } else {
        res.redirect("/");
    }

});

app.post('/delete', function(req, res){
    const index = Number(req.body.index);
    fs.readFile(nailsFile, 'utf8', function(err, data){
        if(err){
            console.error(err);
            return res.redirect('/all');
        }
        let nails = JSON.parse(data);
        if(!isNaN(index) && index >= 0 && index < nails.length){
            nails.splice(index, 1);
            fs.writeFile(nailsFile, JSON.stringify(nails, null, 2), function(err){
                if(err){
                    console.error(err);
                }
                res.redirect('/all');
            });
        }
        else{
            res.redirect('/all');
        }
    });
});

app.listen(3000)