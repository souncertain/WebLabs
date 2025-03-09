const express = require('express')
const fs = require('fs')
const ejs = require('ejs')
const app = express()

app.use(express.urlencoded());

app.get('/', function (req, res) {
    const date = new Date();
    const x = [1, 2, 3];
    ejs.renderFile('D:/WEB_LABS/index.ejs',{
        date,
        hello: 'Hello World!',
        xxx: x
        }, {}, function (str) {
            res.send(str);
    });
});


app.post('/add', function(req, res){
    const name = req.body.name;

    if (name){
        fs.readFile()
    }
});


  
app.listen(3000)