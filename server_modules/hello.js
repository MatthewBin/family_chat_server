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

                var sql = "SELECT id,nickname,head_img,description FROM user WHERE id <> ? ";
                mysql.query(sql,[userid]).then(function (results) {
                    if(results.length>0){
                        for(var r of results){
                            r.head_img = JSON.parse(r.head_img);
                        }
                        res.send({res_code: 1, msg: results});
                        return;
                    }
                    res.send(base.errors.no_data);
                });
                break;
            default:
                res.send(result);
                break;
        }
    });
};

module.exports = pub;
