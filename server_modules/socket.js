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

var socket = {};

socket.conn = function () {
    io.on('connection', function (socket) {
        base.console("client: " + socket.id +" init.", "step 1");

        socket.on('disconnect', function (param) {
            var msg = 'user -' + socket.id + '- disconnected: ' + param;
            base.console(msg, 'disconnet');
            if(global.clients){
                for (var i = global.clients.length - 1; i >= 0; i--){
                    if (global.clients[i].id == socket.id) {
                        io.emit('notify', global.clients[i].nickname + "已下线");
                        global.clients.splice(i, 1);
                    }
                }
            }else {
                console.log(global.clients)
            }
        });

        socket.on('someone_conn', function (msg) {
            base.console(socket.id + " " + msg, "step 2");
        });

        socket.on('online', function (info) {
            if (!global.clients) {
                global.clients = [];
            }
            global.clients.push({
                id: socket.id,
                userid: info.user_id,
                nickname: info.nickname
            })
            io.emit('notify', info.nickname + "已经上线");
            base.console(socket.id + " has connected.", "step 3");
        });
    });
};

socket.send = function (to_user_id, msg) {
    //发送消息
    io.emit(to_user_id, msg);
};

module.exports = socket;