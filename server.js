/**
 * Created by maxiaobin on 17/5/2.
 */
'use strict'

var app = require('./server_modules/app');
var server = require('http').createServer(app);

var io = require('socket.io')(server);

// ----  socket  ----
io.on('connection', function(client){
    client.on('chat',function (data) {
        console.log(data);
    });
    console.log('socket connected...')
});
// -------------------------------
var PORT = parseInt(process.env.npm_package_config_port || 8675);
server.listen(PORT,function () {
    console.log('Node app is running, port:', PORT, '\n\n\n\n\n\n');
});