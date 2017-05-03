/**
 * Created by suyubo on 16/3/10.
 */
'use strict';

var moment = require('moment');

var log4js = require('log4js');
log4js.configure("./log4js.json");
var log = log4js.getLogger('log_date');
//var req_log = log4js.getLogger('req_log');
var tools_log = log4js.getLogger('tools_log');

var logs = {};

//记录日志
logs.logs = function (msg, type) {
    switch (type) {
        case "info":
            log.info('"' + msg + '"');
            break;
        case "error":
            log.error('"' + msg + '"');
            break;
        case "debug":
            log.debug('"' + msg + '"');
            break;
        default:
            break;
    }
};

////记录请求日志
//logs.req_logs = function (ip, url) {
//    req_log.info(ip + ' 请求接口: ' + url);
//};
//
//记录后台日志
logs.logs_tools = function (user_id, msg) {
    tools_log.info("[用户]" + user_id + "-[操作信息]" + msg);
};

module.exports = logs;