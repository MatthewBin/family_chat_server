/**
 * Created by maxiaobin on 17/5/3.
 */
'use strict'

var request = require('request');
var jwt = require('jwt-simple');
var crypto = require('crypto');
var moment = require('moment');
var nodemailer = require("nodemailer");

var mysql = require('./mysql');

var base = {};

base.console = function (msg, type) {

    if (!type) {
        type = ""
    } else {
        type = "[" + type + "]"
    }

    console.log()
    console.log('---- ' + moment().format('YYYY-MM-DD HH:mm:ss') + ' -----------')
    console.log('#### [MSG]: ' + msg)
    console.log('#### ' + type + '---------------------------------')
    console.log()
};

//生成随机数
base.getRandomCode = function (min, max) {
    var code = Math.floor(Math.random() * (max - min + 1) + min);
    return code.toString();
};

//md5密码加密
base.md5Pwd = function (password) {
    var md5Pwd = crypto.createHash('md5').update(password).digest('hex');
    return md5Pwd;
};

//生成token
base.createToken = function (userid) {
    var expires = moment().add(1, 'months').valueOf();
    var token = jwt.encode({
        iss: userid,
        exp: expires
    }, 'dscj');
    return token;
};

//检查token
base.checkToken = function (token) {
    return new Promise(function (resolve, reject) {
        // 测试用的token
        if (token == "illegal0001") {
            resolve({res_code: 1, msg: {iss: 1342}});
            return;
        }

        if (token) {
            try {
                var decoded = jwt.decode(token, 'dscj');
                //console.log(decoded);
                if (!decoded.iss) {
                    resolve({res_code: -996, msg: "token错误"});
                }
                //console.log(decoded);
                //过期
                if (decoded.exp <= Date.now()) {
                    resolve({res_code: -998, msg: "token已过期"});
                }

                var sql = "SELECT token_client,token_web FROM user WHERE id=?";
                //console.log(decoded.iss);
                mysql.query(sql, [decoded.iss]).then(function (results) {
                    if (results.length > 0) {
                        if (results[0].token_client == token || results[0].token_web == token) {
                            resolve({res_code: 1, msg: decoded});
                        } else {
                            resolve({res_code: -995, msg: "token错误"});
                        }
                    } else {
                        resolve(base.errors.not_found_user);
                    }
                });
            } catch (err) {
                console.log(err);
                resolve({res_code: -999, msg: "token错误"});
            }
        } else {
            //console.log("else");
            resolve({res_code: -997, msg: "token为空"});
        }
    });
};

//获取token
base.get_token = function (req) {
    var token = req.cookies.dscj_id;
    if (!token) {
        token = req.body.token;
    }
    //var token = req.body.token;
    return token;
};


base.errors = {
    "no_data": {res_code: 0, msg: "未找到数据"},
    "param_null": {res_code: -1, msg: "参数为空"},
    "not_found_user": {res_code: -2, msg: "没找到用户"},
    "not_found_sms": {res_code: -3, msg: "没找到短信验证码"},
    "sms_err": {res_code: -4, msg: "短信验证码错误"},
    "sms_ex": {res_code: -5, msg: "短信验证码过期"},
    "pwd_err": {res_code: -6, msg: "密码错误"},
    "has_user": {res_code: -7, msg: "用户已存在"},
    "token_null_not_login": {res_code: -8, msg: "token为空，无法获取数据，不需要登录"},
    "user_no_tags": {res_code: -9, msg: "用户没有tags标签"},
    "has_email": {res_code: -10, msg: "邮箱已注册"},
    "type_err": {res_code: -11, msg: "格式错误.只支持jpg,png.gif"},
    "param_type_err": {res_code: -12, msg: "参数格式错误"},
    "cannot": {res_code: -13, msg: "不能操作"},
    "has_nickname": {res_code: -14, msg: "昵称重名"},
    "word_err": {res_code: -15, msg: "含有敏感词"},
    "sys_err": {res_code: -16, msg: "系统错误"},
    "has_curriculum": {res_code: -17, msg: "已购买该课程"},
    "nickname_cannot_null": {res_code: -18, msg: "昵称不能为空"},
    "user_info_err": {res_code: -19, msg: "用户信息错误"},
    "need_buy": {res_code: -20, msg: "需要购买"},
    "count_0": {res_code: -21, msg: "数量错误,为0 或 >10,000"},
    "redeem_code_err": {res_code: -22, msg: "兑换码错误"},
    "redeem_code_ex": {res_code: -23, msg: "兑换码已过期"},
    "redeem_code_use": {res_code: -24, msg: "兑换码已使用"},
    "redeem_code_cannot_use": {res_code: -25, msg: "兑换码不能使用"},
    "redeem_code_type_err": {res_code: -26, msg: "兑换码类型错误"},
    "apple_has_receipt": {res_code: -27, msg: "该苹果凭证已使用"},
    "apple_vali_fail": {res_code: -28, msg: "苹果验证失败"},
    "ali_search_error": {res_code: -29, msg: "搜索错误"},
    "redeem_code_use_me": {res_code: -30, msg: "您已经正确使用了这个兑换码"},
    "redeem_code_open_time_before": {res_code: -31, msg: "这个兑换码还没到可以使用的时间"},
    "norole": {res_code: -32, msg: "该用户没有操作权限"},
    "has_term": {res_code: -33, msg: "已拥有该学期"},
    "has_project": {res_code: -34, msg: "已拥有该项目"},
    "nickname_null": {res_code: -35, msg: "昵称不能为空"}
};

//过滤html标签
base.filter_html = function (content) {
    //img标签替换成[图片]
    var result = content.replace(/<img/g, "[图片]<img");
    //过滤html标签
    result = result.replace(/<\/?[^>]*>/g, "");
    //过滤空格
    result = result.replace(/&nbsp;/ig, '');
    return result;
};

//html编码
base.html_encode = function (html) {
    if (html.length == 0) return "";
    html = html.replace(/&/g, "&amp;");
    html = html.replace(/</g, "&lt;");
    html = html.replace(/>/g, "&gt;");
    html = html.replace(/ /g, "&nbsp;");
    html = html.replace(/\'/g, "&#39;");
    html = html.replace(/\"/g, "&quot;");
    html = html.replace(/\n/g, "<br/>");
    return html;
};

//发送邮件
base.send_mail = function (to, subject, html) {
    // 开启一个 SMTP 连接池
    var smtpConfig = {
        host: 'smtp.exmail.qq.com',
        port: 465,
        secure: true, // use SSL
        auth: {
            user: 'service@laoshi123.com',
            pass: 'Srv123'
        }
    };
    var smtpTransport = nodemailer.createTransport(smtpConfig);
    // 设置邮件内容
    var mailOptions = {
        from: "service@laoshi123.com", // 发件地址
        to: to, // 收件列表
        subject: subject, // 标题
        html: html // html 内容
    };
    // 发送邮件
    smtpTransport.sendMail(mailOptions, function (error, response) {
        if (error) {
            console.log(error);
        } else {
            console.log("Message sent: " + JSON.stringify(response));
        }
        smtpTransport.close(); // 如果没用，关闭连接池
    });
};

//记录事件日志表
base.add_event_log = function (user_id, ip, position, province, city, type, params, from_info) {
    return new Promise(function (resolve, reject) {
        if (!from_info) {
            from_info = "";
        }
        var sql = "INSERT INTO logs_event(user_id,ip,position,province,city,type,params,from_info) VALUES(?,?,?,?,?,?,?,?)";
        mysql.query(sql, [user_id, ip, position, province, city, type, params, from_info]).then(function (result) {
            resolve(result.insertId);
        });
    });
};

//获取百度地图位置
base.get_baidu_position = function (lat, lng) {
    return new Promise(function (resolve, reject) {
        var url = "http://wx.api.laoshi123.com/api/baidu/get_position";
        request.post(url, function (error, response, body) {
            if (error || response.statusCode != 200) {
                return;
            }
            var position = JSON.parse(body);
            resolve(position);
        }).form({lat: lat, lng: lng});
    });
};

//根据ip获取百度地图位置
base.get_baidu_position_by_ip = function (ip) {
    return new Promise(function (resolve, reject) {
        var url = "http://wx.api.laoshi123.com/api/baidu/get_position_by_ip";
        request.post(url, function (error, response, body) {
            if (error || response.statusCode != 200) {
                return;
            }
            resolve(body);
        }).form({ip: ip});
    });
};

base.check_id_card = function (id) {
    return new Promise(function (resolve, reject) {
        try {
            var id_str = id.toString();
            if (id_str.length != 18) {
                resolve({
                    res_code: -1,
                    msg: "身份证长度错误"
                });
            }
            var address_code = parseInt(id_str.substring(0, 6));
            var year = parseInt(id_str.substring(6, 10));
            var month = parseInt(id_str.substring(10, 12));
            var day = parseInt(id_str.substring(12, 14));
            var segment_code = parseInt(id_str.substring(14, 17));
            var check_code = id_str[17].toLowerCase();

            var table = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
            var check_table = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
            var total = 0;
            for (var i = 0; i < 17; i++) {
                total += table[i] * parseInt(id_str[i]);
            }
            var div = total % 11;

            if (check_table[div].toLowerCase() != check_code) {
                resolve({
                    res_code: -2,
                    msg: "身份证不合法"
                });
                return;
            } else {
                mysql.query("SELECT address FROM id_address WHERE id = ? ", [address_code]).then(function (results) {
                    var address = results.length == 0 ? 'none' : results[0].address;
                    resolve({
                        res_code: 1,
                        msg: {
                            address: address,
                            year: year,
                            month: month,
                            day: day,
                            sex: parseInt(id_str[16]) % 2 == 0 ? '女' : '男'
                        }
                    });
                    return;
                });
            }
        } catch (err) {
            resolve({
                res_code: -3,
                msg: "身份证格式错误"
            });
            return;
        }
    });
};

module.exports = base;