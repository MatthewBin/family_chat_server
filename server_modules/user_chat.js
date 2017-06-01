/**
 * Created by maxiaobin on 17/6/1.
 */

'use strict';

var moment = require('moment');

var mysql = require('./mysql');
var base = require('./base');
var logs = require('./logs');

var user_chat = {};

// 获取聊天记录
user_chat.get_chat_list = function (req, res) {
    var token = base.get_token(req);
    var to_uid = req.body.to_uid;
    var page_index = req.body.page_index;
    var page_size = req.body.page_size;

    if (page_index == undefined || !page_size) {
        res.send(base.errors.param_null);
        return;
    }
    if (!to_uid) {
        res.send(base.errors.user_info_err);
        return;
    }

    var limit = page_index * page_size;

    base.checkToken(token).then(function (result) {
        switch (result.res_code) {
            case 1:
                var userid = result.msg.iss;
                var sql = "SELECT * FROM user_chat " +
                    "WHERE (from_uid = ? AND to_uid = ?) OR (from_uid = ? AND to_uid = ?) " +
                    "ORDER BY create_time DESC " +
                    "LIMIT ?,? ";
                mysql.query(sql, [userid, to_uid, to_uid, userid, limit, page_size]).then(function (results) {
                    user_chat.setMsgIsReadFunc(to_uid, userid);
                    res.send({res_code: 1, msg: results});
                });
                break;
            default:
                res.send(result);
                break;
        }
    });
};

// 发送消息
user_chat.send_msg = function (req, res) {
    var token = base.get_token(req);
    var to_uid = req.body.to_uid;
    var content = req.body.content;

    if (!to_uid) {
        res.send(base.errors.user_info_err);
        return;
    }

    if (content == undefined || content == null) {
        content = "";
    }

    base.checkToken(token).then(function (result) {
        switch (result.res_code) {
            case 1:
                var userid = result.msg.iss;
                var sql = "INSERT INTO user_chat (from_uid,to_uid,content) VALUES (?,?,?) ";
                mysql.query(sql, [userid, to_uid, content]).then(function (result) {
                    if (result.affectedRows > 0) {
                        mysql.query("SELECT * FROM user_chat WHERE id = ?", result.insertId).then(function (results) {
                            res.send({res_code: 1, msg: results[0]});
                        });
                    } else {
                        res.send(base.errors.send_msg_err);
                    }
                });
                break;
            default:
                res.send(result);
                break;
        }
    });
};

// 获取最近聊天
user_chat.get_recently_list = function (req, res) {
    var token = base.get_token(req);
console.log('--------------')
    base.checkToken(token).then(function (result) {
        switch (result.res_code) {
            case 1:
                var userid = result.msg.iss;
                var sql = "SELECT a.* FROM user_chat a " +
                    "INNER JOIN (SELECT MAX(id) id,from_uid,to_uid " +
                    "FROM user_chat WHERE from_uid = ? OR to_uid = ? " +
                    "GROUP BY from_uid,to_uid) b " +
                    "ON a.id = b.id ";
                mysql.query(sql, [userid, userid]).then(function (results) {
                    var data = results;
                    for (var i = data.length - 1; i > 0; i--) {
                        if (data[i].from_uid == data[i - 1].to_uid && data[i].to_uid == data[i - 1].from_uid) {
                            data.splice(i - 1, 1);
                        }
                    }
                    res.send({res_code: 1, msg: data});
                });
                break;
            default:
                res.send(result)
                break;
        }
    });
};


// ---- 方法 ----
user_chat.setMsgIsReadFunc = function (from_uid, to_uid) {
    return new Promise(function (resolve, reject) {
        var sql = "UPDATE user_chat SET is_read = 1 WHERE from_uid=? AND to_uid = ? AND is_read<>1";
        mysql.query(sql, [from_uid, to_uid]).then(function (result) {
            resolve(true);
        });
    });
};

module.exports = user_chat;