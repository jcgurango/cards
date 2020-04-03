var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

if (process.env.PROXY) {
    
} else if (process.env.BUILD_FOLDER) {
    app.use(express.static(process.env.BUILD_FOLDER));

    app.get('/*', (req, res) => {
        res.sendFile(`${process.env.BUILD_FOLDER}/index.html`);
    });
}

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
