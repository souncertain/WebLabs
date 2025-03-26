const express = require('express');
const app = express();
const session = require('express-session')
const passport = require('passport');
var LocalStrategy = require('passport-local');

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.set('trust proxy', 1)

passport.use(new LocalStrategy(function verify(username, password, cb) {
    if (username && password == "123"){
        cb(null, {username: username});
    }
    else{
        cb(false, {message: 'Incorrect!'})
    }
  }));


app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: {secure: false}
}));

app.use((req, res, next) => {
    if(req.session.user){
        req.user = req.session.user;
    }
    next();
})

passport.serializeUser(function(user, cb) {
    process.nextTick(function(){
        return cb(null, {
            username: user.username,
          });
    })
})

passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

function auth(req, res, next) {
    if (req.user) {
        next();
    }
    else{
        res.redirect('/login');
    }
}

app.get('/', auth, (req, res) => {
    return res.render('index', req.user);
})

app.get('/login', (req, res) => {
    res.render('login');
}) 

app.post('/login', passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login'
  }));

app.listen(3000, () => {
    console.log("Server started");
})  