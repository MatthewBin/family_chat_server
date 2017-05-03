/**
 * Created by maxiaobin on 17/5/3.
 */
'use strict';

var moment = require('moment');

var mysql = require('./mysql');
var base = require('./base');
var logs = require('./logs');

var user = {};

//用户名密码登陆
user.login = function (req, res) {
    var username = req.body.username;
    var password = req.body.pwd;
    var from = req.body.from;
    var is_debug = req.body.is_debug;
    var origin = req.body.origin;
    var ip = req.headers["x-real-ip"];

    if (!username || !password || !from) {
        res.send(base.errors.param_null);
        return;
    }
    //当前只支持web和xg登录
    if (from != "web" && from != "xg" && from != "app") {
        res.send(base.errors.param_type_err);
        return;
    }

    mysql.query("select id,password from user where username=?", [username]).then(function (result) {
        if (result === null || result.length === 0) {
            res.send(base.errors.not_found_user);
            return;
        }
        var user_id = result[0].id;
        var md5Pwd = base.md5Pwd(password);
        if (result[0].password != md5Pwd) {
            res.send(base.errors.pwd_err);
            return;
        }
        //设置token，返回结果
        var setToken = function (from) {
            //获取token
            var token = base.createToken(user_id);
            var sql = "UPDATE user SET token_web=? WHERE id=?";
            if(from == 'app'){
                sql = "UPDATE user SET token_app=? WHERE id=?";
            }
            //更新数据库
            mysql.query(sql, [token, user_id]).then(function (result) {
                if(from != 'app'){
                    res.cookie('dscj_id', token, {
                        domain: '.laoshi123.com',
                        expires: new Date(moment().add(1, 'months'))
                    });
                }

                if (is_debug || from == "app") {
                    res.send({res_code: 1, msg: "登陆成功", token: token});
                } else {
                    res.send({res_code: 1, msg: "登陆成功"});
                }
            });

            //记录事件日志
            base.get_baidu_position_by_ip(ip).then(function (position) {
                position = unescape(position.replace(/\\u/g, '%u'));
                try {
                    position = JSON.parse(position);
                    var province = position.content.address_detail.province;
                    var city = position.content.address_detail.city;
                    base.add_event_log(user_id, ip, JSON.stringify(position), province, city, 2, "", origin);
                } catch (e) {
                    base.add_event_log(user_id, ip, e.message, "", "", 2, "", origin);
                }
            });
        };
        switch (from) {
            case "web":
            case "app":
                setToken(from);
                break;
            case "xg":
                role.getUserRoleFunc(user_id).then(function (role_id_arr) {
                    if (role_id_arr && (role_id_arr.indexOf(1) >= 0 ||
                        role_id_arr.indexOf(7) >= 0)) {
                        setToken();
                    } else {
                        res.send(base.errors.norole);
                    }
                });
                break;
            default:
                res.send(base.errors.param_type_err);
        }

    });
};

//用户注册
user.regist = function (req, res) {
    var phone = req.body.phone;
    var pwd = req.body.pwd;
    var smsCode = req.body.sms_code;
    var origin = req.body.origin;
    var ip = req.headers["x-real-ip"];

    if (!phone || !smsCode || !pwd | !origin) {
        res.send(base.errors.param_null);
        return;
    }

    phone = phone.replace(/ /g, "");

    mysql.query("select id from user where username=?", [phone]).then(function (result) {
        if (result.length > 0) {
            res.send(base.errors.has_user);
            return;
        }

        mysql.query("select * from sms where phone=?", [phone]).then(function (result) {
            if (result === null || result.length === 0) {
                res.send(base.errors.not_found_sms);
                return;
            }

            if (smsCode != result[0].sms_code) {
                res.send(base.errors.sms_err);
                return;
            }

            var time = "30";
            if ((Math.floor((moment() - result[0].update_time) / (1000 * 60))) >= time) {
                res.send(base.errors.sms_ex);
                return;
            }

            var md5Pwd = base.md5Pwd(pwd);

            var sql = "INSERT INTO user(username,password) VALUES(?,?)";
            mysql.query(sql, [phone, md5Pwd]).then(function (result) {
                var user_id = result.insertId;
                //添加个人信息
                var nickname = phone.substr(0, 3) + '****' + phone.substr(-4);
                var sql = "INSERT INTO user_info(user_id,nickname,phone) VALUES(?,?,?)";
                mysql.query(sql, [user_id, nickname, phone]).then(function (result) {

                    //获取token 自动登录
                    //var token = base.createToken(user_id);
                    //var sql = "UPDATE user SET token_web=? WHERE id=?";
                    //mysql.query(sql, [token, user_id]).then(function (result) {
                    //    res.cookie('dscj_id', token, {
                    //        domain: '.laoshi123.com',
                    //        expires: new Date(moment().add(1, 'months'))
                    //    });
                    //    res.send({res_code: 1, msg: "注册成功"});
                    //});
                    res.send({res_code: 1, msg: "注册成功"});


                    //记录事件日志
                    base.get_baidu_position_by_ip(ip).then(function (position) {
                        position = unescape(position.replace(/\\u/g, '%u'));
                        try {
                            position = JSON.parse(position);
                            var province = position.content.address_detail.province;
                            var city = position.content.address_detail.city;
                            base.add_event_log(user_id, ip, JSON.stringify(position), province, city, 1, "", origin);
                        } catch (e) {
                            base.add_event_log(user_id, ip, e.message, "", "", 1, "", origin);
                        }
                    });
                });
            });
        });
    });
};

//忘记密码
user.forgot_pwd = function (req, res) {
    var phone = req.body.phone;
    var smsCode = req.body.sms_code;
    var new_pwd = req.body.new_pwd;

    if (!phone || !smsCode || !new_pwd) {
        res.send(base.errors.param_null);
        return;
    }

    mysql.query("select * from sms where phone=?", [phone]).then(function (result) {
        if (result === null || result.length === 0) {
            res.send(base.errors.not_found_sms);
            return;
        }

        if (smsCode != result[0].sms_code) {
            res.send(base.errors.sms_err);
            return;
        }

        var time = "30";
        if ((Math.floor((moment() - result[0].update_time) / (1000 * 60))) >= time) {
            res.send(base.errors.sms_ex);
            return;
        }

        mysql.query("SELECT user_id FROM user_info WHERE phone=?", [phone]).then(function (result) {
            if (result.length == 0) {
                res.send(base.errors.not_found_user);
                return;
            }
            var userid = result[0].user_id;

            //修改密码
            var md5Pwd = base.md5Pwd(new_pwd);
            var sql = "UPDATE user SET password=? WHERE id=?";
            mysql.query(sql, [md5Pwd, userid]).then(function (result) {
                res.send({res_code: 1, msg: "修改成功"});
            });
        });
    });
};

//登出
user.logout = function (req, res) {
    res.clearCookie('dscj_id', {
        domain: '.laoshi123.com'
    });
    res.send({res_code: 1, msg: "登出成功"});
};

//获取用户信息
user.user_info = function (req, res) {
    var token = base.get_token(req);
    base.checkToken(token).then(function (result) {
        switch (result.res_code) {
            case 1:
                var userid = result.msg.iss;
                user.getUserInfoFunc(userid).then(function (user_info) {
                    role.getUserRoleFunc(userid).then(function (role_arr) {
                        user_info.role_arr = role_arr;
                        res.send({res_code: 1, msg: user_info});
                    });
                });
                break;
            default:
                res.send(result);
                break;
        }
    });
};


//设置昵称
user.set_nickname = function (req, res) {
    var token = base.get_token(req);
    var nickname = req.body.nickname;

    if (!nickname) {
        res.send(base.errors.param_null);
        return;
    }

    nickname = nickname.replace(/\s/g, "");

    //过滤


    base.checkToken(token).then(function (result) {
        switch (result.res_code) {
            case 1:
                var userid = result.msg.iss;
                var sql = "SELECT user_id FROM user_info WHERE nickname=?";
                mysql.query(sql, [nickname]).then(function (result) {
                    if (result.length == 0) {
                        var sql = "UPDATE user_info SET nickname=? WHERE user_id=?";
                        mysql.query(sql, [nickname, userid]).then(function (result) {
                            res.send({res_code: 1, msg: "修改成功"});
                        });
                    } else {
                        if (userid == result[0].user_id) {
                            res.send({res_code: 1, msg: "修改成功"});
                        } else {
                            res.send(base.errors.has_nickname);
                        }
                    }
                });
                break;
            default:
                res.send(result);
                break;
        }
    });
};

//设置简介
user.set_desc = function (req, res) {
    var token = base.get_token(req);
    var description = req.body.description;

    if (!description) {
        res.send(base.errors.param_null);
        return;
    }

    base.checkToken(token).then(function (result) {
        switch (result.res_code) {
            case 1:
                var userid = result.msg.iss;
                var sql = "UPDATE user_info SET description=? WHERE user_id=?";
                mysql.query(sql, [description, userid]).then(function (result) {
                    res.send({res_code: 1, msg: "修改成功"});
                });
                break;
            default:
                res.send(result);
                break;
        }
    });
};

//设置头像地址
user.set_head_img_url = function (req, res) {
    var token = base.get_token(req);
    var img_url = req.body.img_url;

    if (!img_url) {
        res.send(base.errors.param_null);
        return;
    }

    base.checkToken(token).then(function (result) {
        switch (result.res_code) {
            case 1:
                var userid = result.msg.iss;
                var sql = "UPDATE user_info SET head_img_url=? WHERE user_id=?";
                mysql.query(sql, [img_url, userid]).then(function (result) {
                    res.send({res_code: 1, msg: "修改成功"});
                });
                break;
            default:
                res.send(result);
                break;
        }
    });
};


//设置用户信息
user.set_info = function (req, res) {
    var token = base.get_token(req);
    var img_url = req.body.img_url;
    var nickname = req.body.nickname;
    var description = req.body.description;
    var sex = req.body.sex;
    var city_id = req.body.city_id;
    var birthday = req.body.birthday;

    var child_sql = '';
    var param_arr=[];

    if(img_url){
        child_sql+="head_img_url=?,";
        param_arr.push(img_url)
    }
    if(description){
        child_sql+="description=?,";
        param_arr.push(description)
    }
    if(city_id){
        child_sql+="city_id=?,";
        param_arr.push(city_id)
    }
    if(birthday){
        child_sql+="birthday=?,";
        param_arr.push(birthday)
    }
    if (sex == 0 || sex ==1) {
        child_sql+="sex=?,";
        param_arr.push(sex)
    }



    if(nickname == undefined || nickname == null || nickname.trim() == ''){
        res.send(base.errors.nickname_null);
        return;
    }

    base.checkToken(token).then(function (result) {
        switch (result.res_code) {
            case 1:
                var userid = result.msg.iss;
                child_sql ="UPDATE user_info SET " + child_sql+"nickname = ? WHERE user_id = ? ";
                param_arr.push(nickname);
                param_arr.push(userid);
                // var sql = "UPDATE user_info SET head_img_url=?,nickname = ?,description=?,sex=?,city_id=?,birthday=? WHERE user_id=?";
                mysql.query(child_sql, param_arr).then(function (result) {
                    res.send({res_code: 1, msg: "修改成功"});
                });
                break;
            default:
                res.send(result);
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
        var sql = "SELECT nickname,realname,phone,head_img_url,city_id,birthday,description,sex,email,cret_description FROM user_info WHERE user_id=?";
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