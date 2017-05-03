/**
 * Created by maxiaobin on 17/5/3.
 */
'use strict'

var udp_utils ={};
var server = null;
var users_config = [];

var msg_demo={
    type:0,
    to:[2],
    content:''
}
// type: -1=断开连接 0=连接 1=消息 100=系统消息
// to: user_id数组

udp_utils.set_server=function (udp_server) {
    server = udp_server;
};

// 处理收到的消息
udp_utils.enter_factory=function (msg,rinfo) {
    var q = JSON.parse(msg);
    console.log(q)
    switch (q.type){
        case -1:
            break;
        case 0:
            udp_utils.init_connect_info(rinfo.address,rinfo.port);
            break;
        case 1:
            udp_utils.send_msg({
                type:1,
                from:rinfo.address,
                content:msg.content
            },msg.to,5555);
            break;
    }
};

// 初始化连接信息
udp_utils.init_connect_info=function (address,port) {
    var adds = users_config.map((user)=>{
       return user.address;
    });
    if(adds.indexOf(address) == -1){
        udp_utils.broadcast_msg({
            type:100,
            content:address+'上线了'
        });
    }
    udp_utils.send_msg({
        type:100,
        content:'登录成功'
    },address,port);
};

// 发送消息
udp_utils.send_msg=function (msg,address,port) {
    var str = JSON.stringify(msg);
    server.send(str,port,address);
};

// 广播消息
udp_utils.broadcast_msg=function (msg) {
    for(var u of users_config){
        udp_utils.send_msg(msg,u.address,u.port);
    }
};

module.exports =udp_utils;