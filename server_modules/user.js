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
user.check_id_card = function (req, res) {
    var id_code = req.body.id_code;

    base.check_id_card(id_code).then(function (result) {
        res.send(result);
    });
};

// 用户注册
user.register = function (req, res) {
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

    var head_img = {uri:"data:image/jpeg;base64,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",isStatic:true};

    var sql = "SELECT * FROM user WHERE user_name = ? ";
    mysql.query(sql, [username]).then(function (results) {
        if (results.length > 0) {
            res.send(base.errors.has_user);
            return;
        }

        var md5Pwd = base.md5Pwd(pwd);
        var sql = "INSERT INTO user (user_name,user_pwd,head_img,nickname,description,email,state) " +
            "VALUES (?,?,?,?,?,?,?) ";
        mysql.query(sql, [username, md5Pwd,JSON.stringify(head_img),username,'这家伙很懒，还未设置..', email, 1]).then(function (result) {
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
                res.send({
                    res_code: 1, msg: {
                        token: token,
                        user_id: userid
                    }
                });
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

// 修改信息
user.set_info = function (req, res) {
    var token = base.get_token(req);
    var nickname = req.body.nickname;
    var head_img = req.body.head_img;
    var description = req.body.description;


    if (!nickname || nickname == "") {
        res.send(base.errors.nickname_cannot_null);
        return;
    }
    if (!head_img)
        head_img = {uri:"data:image/jpeg;base64,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",isStatic:true};
    head_img = JSON.stringify(head_img);
    if (!description)
        description = "";

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
                    var sql = "UPDATE user SET nickname = ?,head_img=?,description=? WHERE id = ? ";
                    mysql.query(sql, [nickname, head_img, description, userid]).then(function (result) {
                        res.send({res_code: 1, msg: "修改成功"});
                    });
                });
                break;
            default:
                res.send(result)
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
        var sql = "SELECT nickname,head_img,description FROM user " +
            "WHERE id=?";
        mysql.query(sql, [user_id]).then(function (results) {
            if (results.length == 0) {
                resolve(false);
                return;
            }
            var data = results[0];
            data.head_img = JSON.parse(data.head_img);
            resolve(data);
        });
    });
};


module.exports = user;