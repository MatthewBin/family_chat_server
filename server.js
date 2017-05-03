/**
 * Created by maxiaobin on 17/5/2.
 */
'use strict'

var app = require('./server_modules/app');
var udp_server = require('./server_modules/udp_server');
var server = require('http').createServer(app);

var PORT = 8675;
server.listen(PORT, function () {
    console.log('Node app is running, port:', PORT, '\n\n\n\n\n\n');
});
