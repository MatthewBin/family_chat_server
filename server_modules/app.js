/**
 * Created by maxiaobin on 17/5/2.
 */
'use strict';

var bodyParser = require('body-parser');
var app = require('express')();
var socket = require('./socket');

// 各个模块
var apiRouter = require('./app_router');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

socket.conn();

// api
app.use('/', apiRouter);

// 如果任何路由都没匹配到，则认为 404
// 生成一个异常让后面的 err handler 捕获
app.use(function (req, res, next) {
    res.sendStatus(404);
});


module.exports = app;
