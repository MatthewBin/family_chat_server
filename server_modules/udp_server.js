/**
 * Created by maxiaobin on 17/5/3.
 */
'use strict'

var dgram = require('dgram');
var udp_server = dgram.createSocket('udp4');
var udp_utils = require('./udp_utils');

udp_utils.set_server(udp_server);

// ------  socket  ---------
udp_server.on('error', (err) => {
    console.log(`socket服务器异常：\n${err.stack}`);
    udp_server.close();
});

udp_server.on('message', (msg, rinfo) => {
    // console.log(`服务器收到：${msg} 来自 ${rinfo.address}:${rinfo.port}`);
    console.log(`服务器收到：来自 ${rinfo.address}:${rinfo.port} 的消息`);
    udp_utils.enter_factory(msg,rinfo);
});

udp_server.on('listening', () => {
    var address = udp_server.address();
    console.log(`服务器监听 ${address.address}:${address.port}`);
});

udp_server.bind(8677,function (msg) {
});
module.exports = udp_server;