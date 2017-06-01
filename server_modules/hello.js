/**
 * Created by maxiaobin on 17/5/2.
 */
'use strict';

var base = require('./base');
var mysql = require('./mysql');
var pub = {};

pub.hello = function (req, res) {
    var ip = req.headers["x-real-ip"];
    if (!ip) {
        ip = req.ip;
        if (!ip) {
            ip = "none";
        }
    }
    res.send({
        hello: 'It works.', ip: ip, project: "family_chat_server"
    });
};

// 获取好友列表
pub.get_friend_list = function (req, res) {
    var token = base.get_token(req);
    base.checkToken(token).then(function (result) {
        switch (result.res_code) {
            case 1:
                var userid = result.msg.iss;
                // var ids = global.clients ?
                //     global.clients.map(function (client) {
                //         return client.userid;
                //     }).join(',')
                //     : [0];
                var ids =[0];

                var sql = "SELECT id,nickname,head_img,description FROM user WHERE id IN (?) AND id <> ? ";
                mysql.query(sql,[ids,userid]).then(function (results) {
                    if(results.length>0){
                        res.send({res_code: 1, msg: results});
                        return;
                    }
                    res.send({res_code: 1, msg: [{id:11,nickname:'逗比',head_img:JSON.parse("{}"),description:"我的是奥术大师阿萨德撒"},{id:11,nickname:'Doby',head_img:JSON.parse("{}"),description:"sdsdsdsds"}]});
                });
                break;
            default:
                res.send(result);
                break;
        }
    });
};

module.exports = pub;
