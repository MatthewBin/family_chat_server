/**
 * Created by maxiaobin on 17/5/18.
 */
'use strict';

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var moment = require('moment');
var base = require('./base');
server.listen(9521);

var socket={};

socket.conn= function () {
    io.on('connection', function (socket) {
        base.console("server:" + socket.id,'hh');

        socket.on('disconnect', function (param) {
            var msg = 'user -'+socket.id+'- disconnected: '+param;
            base.console(msg,'disconnet');
        });

        socket.on('test',function (msg) {
            base.console(msg,'test');
        });
    });
};

socket.send= function (to_user_id,msg) {
    //发送消息
    io.emit(to_user_id, msg);
};

module.exports = socket;