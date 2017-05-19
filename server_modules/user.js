/**
 * Created by maxiaobin on 17/5/3.
 */
'use strict';

var moment = require('moment');

var mysql = require('./mysql');
var base = require('./base');
var logs = require('./logs');

var user = {};

// 检查身份证合法性
user.check_id_card = function (req,res) {
    var id_code = req.body.id_code;

    base.check_id_card(id_code).then(function (result) {
       res.send(result);
    });
};

// 用户注册
user.regist = function (req, res) {
    var username = req.body.username;
    var pwd = req.body.pwd;
    var email = req.body.email;
    var code = req.body.code;

    if (!username || !pwd || !email) {
        res.send(base.errors.param_null);
        return;
    }

    if (code != "Matthew") {
        res.send(base.errors.cannot);
        return;
    }

    var sql = "SELECT * FROM user WHERE user_name = ? ";
    mysql.query(sql, [username]).then(function (results) {
        if (results.length > 0) {
            res.send(base.errors.has_user);
            return;
        }

        var md5Pwd = base.md5Pwd(pwd);
        var sql = "INSERT INTO user (user_name,user_pwd,email,state) " +
            "VALUES (?,?,?,?,?) ";
        mysql.query(sql, [username, md5Pwd, email, 1]).then(function (result) {
            res.send({res_code: 1, msg: "注册成功"});
        });
    });
};

// 用户登录
user.login = function (req, res) {
    var username = req.body.username;
    var pwd = req.body.pwd;
    var client = req.body.client;

    if (!username || !pwd) {
        res.send(base.errors.param_null);
    }
    var sql = "SELECT id,user_pwd from user WHERE user_name = ? ";
    mysql.query(sql, [username]).then(function (results) {
        if (results === null || results.length == 0) {
            res.send(base.errors.not_found_user);
            return;
        }
        var userid = results[0].id;
        var md5Pwd = base.md5Pwd(pwd);
        if (md5Pwd != results[0].user_pwd) {
            res.send(base.errors.pwd_err);
            return;
        }
        var token = base.createToken(userid);
        if (client == 1) {
            var sql = "UPDATE user SET token_client = ? WHERE id = ? ";
            mysql.query(sql, [token, userid]).then(function (result) {
                res.send({res_code: 1, msg: token});
            });
        } else {
            var sql = "UPDATE user SET token_web = ? WHERE id = ? ";
            mysql.query(sql, [token, userid]).then(function (result) {
                res.cookie('family_id', token, {
                    // domain: '.laoshi123.com',
                    expires: new Date(moment().add(1, 'months'))
                });
                res.send({res_code: 1, msg: "登陆成功"});
            });
        }

    });
};

//获取用户信息
user.user_info = function (req, res) {
    var token = base.get_token(req);
    base.checkToken(token).then(function (result) {
        switch (result.res_code) {
            case 1:
                var userid = result.msg.iss;
                user.getUserInfoFunc(userid).then(function (user_info) {
                    res.send({res_code: 1, msg: user_info});
                });
                break;
            default:
                res.send(result);
                break;
        }
    });
};

// 找回密码 && 重新发送验证码
user.forgot_pwd = function (req, res) {
    var username = req.body.username;
    var email = req.body.email;
    if (!username || !email) {
        res.send(base.errors.param_null);
        return;
    }
    var sql = "SELECT * FROM user WHERE user_name = ? AND email = ? ";
    mysql.query(sql, [username, email]).then(function (results) {
        if (results.length == 0) {
            res.send(base.errors.cannot);
            return;
        }
        var userData = results[0];
        var sql = "SELECT sms_code,update_time FROM user_sms " +
            "WHERE user_id=? ";
        mysql.query(sql, [userData.id]).then(function (results) {
            if (results.length == 0) {
                var sms_code = base.getRandomCode(100000, 999999);
                base.send_mail(email, "【FamilyStorage】密码找回", "您本次的验证码为：" + sms_code + ",30分钟内有效!").then(function (sendMsg) {
                    console.log(sendMsg)
                    if (!sendMsg) {
                        res.send(base.errors.cannot);
                        return;
                    }
                    var sql = "INSERT INTO user_sms (user_id,sms_code) " +
                        "VALUES (?,?) ";
                    mysql.query(sql, [userData.id, sms_code]).then(function (result) {
                        res.send({res_code: 1, msg: sendMsg});
                    });
                });
            } else {
                var time = 30;
                //剩余时间=默认时间-时间差[分钟]
                var tempTime = time - (Math.floor((moment() - results[0].update_time) / (1000 * 60)));
                if (tempTime > 0) {
                    var sms_code = results[0].sms_code;
                    base.send_mail(email, "【FamilyStorage】密码找回", "您本次的验证码为：" + sms_code + ",30分钟内有效!").then(function (result) {
                        if (!result) {
                            res.send(base.errors.cannot);
                            return;
                        }
                        res.send({res_code: 1, msg: "发送成功"});
                    });
                    res.send({res_code: 1, msg: "发送成功"});
                } else {
                    //更新users_sms表
                    var sms_code = base.getRandomCode(100000, 999999);
                    base.send_mail(email, "【FamilyStorage】密码找回", "您本次的验证码为：" + sms_code + ",30分钟内有效!").then(function (result) {
                        if (!result) {
                            res.send(base.errors.cannot);
                            return;
                        }
                        var sql = "UPDATE user_sms SET sms_code =? WHERE user_id = ?";
                        mysql.query(sql, [results[0].id, sms_code, userData.id]).then(function (result) {
                            res.send({res_code: 1, msg: "发送成功"});
                        });
                    });
                }
            }
        });
    });
};

// 重新设置密码
user.reset_pwd = function (req, res) {
    var username = req.body.username;
    var sms_code = req.body.sms_code;
    var pwd = req.body.pwd;

    if (!username || !sms_code || !pwd) {
        res.send(base.errors.param_null);
        return;
    }

    var sql = "SELECT id userid FROM user WHERE user_name = ? ";
    mysql.query(sql, [username]).then(function (results) {
        if (results === null || results.length == 0) {
            res.send(base.errors.not_found_user);
            return;
        }
        var userData = results[0];
        var sql = "SELECT sms_code,state,update_time from user_sms WHERE user_id = ? ";
        mysql.query(sql, [userData.userid]).then(function (results) {
            if (results === null || results.length == 0) {
                res.send(base.errors.not_found_sms);
                return;
            }
            if (results[0].state == 1) {
                res.send(base.errors.cannot);
                return;
            }

            var time = 30;
            //剩余时间=默认时间-时间差[分钟]
            var tempTime = time - (Math.floor((moment() - results[0].update_time) / (1000 * 60)));

            if (tempTime > 0) {
                if (results[0].sms_code != sms_code) {
                    res.send(base.errors.sms_err);
                    return;
                }
                var md5Pwd = base.md5Pwd(pwd);
                var sql = "UPDATE user SET user_pwd = ? WHERE id = ? ";
                mysql.query(sql, [md5Pwd, userData.userid]).then(function (result) {
                    var sql = "UPDATE user_sms SET state = 1 WHERE user_id = ? ";
                    mysql.query(sql, [userData.userid]).then(function (result) {
                        res.send({res_code: 1, msg: "密码重置成功!"});
                    });
                });
            } else {
                res.send(base.errors.sms_ex);
            }
        });
    });
};

// 修改昵称
user.set_info = function (req, res) {
    var token = base.get_token(req);
    var nickname = req.body.nickname;
    var head_img = req.body.head_img;
    var description = req.body.description;

    var sql = "UPDATE user SET ";

    if(nickname)

    if(!nickname || nickname == ""){
        res.send(base.errors.nickname_cannot_null);
        return;
    }

    base.checkToken(token).then(function (result) {
        switch (result.res_code) {
            case 1:
                var userid = result.msg.iss;
                var sql = "SELECT * FROM user WHERE id=? ";
                mysql.query(sql, [userid]).then(function (results) {
                    if (results.length == 0) {
                        res.send(base.errors.not_found_user);
                        return;
                    }
                    var sql = "UPDATE user SET nickname = ? WHERE id = ? ";
                    mysql.query(sql, [nickname, userid]).then(function (result) {
                        res.send({res_code: 1, msg: "昵称修改成功"});
                    });
                });
                break;
            default:
                result.send(result)
                break;
        }
    });
};

// 修改密码
user.set_pwd = function (req, res) {
    var token = base.get_token(req);
    var old_pwd = req.body.old_pwd;
    var new_pwd = req.body.new_pwd;
    if (!old_pwd || !new_pwd) {
        res.send(base.errors.param_null);
        return;
    }

    base.checkToken(token).then(function (result) {
        switch (result.res_code) {
            case 1:
                var userid = result.msg.iss;
                var sql = "SELECT * FROM user WHERE id=? ";
                mysql.query(sql, [userid]).then(function (results) {
                    if (results.length == 0) {
                        res.send(base.errors.not_found_user);
                        return;
                    }
                    var userData = results[0];
                    var oldMd5Pwd = base.md5Pwd(old_pwd);
                    if (oldMd5Pwd != userData.user_pwd) {
                        res.send(base.errors.pwd_err);
                        return;
                    }
                    var newMd5Pwd = base.md5Pwd(new_pwd);
                    var sql = "UPDATE user SET user_pwd = ? WHERE id = ? ";
                    mysql.query(sql, [newMd5Pwd, userid]).then(function (result) {
                        res.send({res_code: 1, msg: "密码修改成功"});
                    });
                });
                break;
            default:
                res.send(result)
                break;
        }
    });
};

//方法-------------------------------------------

//获取用户信息
user.getUserInfoFunc = function (user_id) {
    return new Promise(function (resolve, reject) {
        if (!user_id) {
            resolve(false);
            return;
        }
        var sql = "SELECT nickname,head_img,description FROM user_info " +
            "WHERE user_id=?";
        mysql.query(sql, [user_id]).then(function (results) {
            if (results.length == 0) {
                resolve(false);
                return;
            }
            resolve(results[0]);
        });
    });
};


module.exports = user;