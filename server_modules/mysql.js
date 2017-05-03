/**
 * Created by maxiaobin on 17/5/3.
 */

'use strict';

var mysql = require('mysql');
var logs = require('./logs');

var moment = require('moment');

var sql = {};

var pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'maxiaobin',
    database: 'dskj_dscj',
    port: '3306',
    charset: 'utf8mb4'
});


sql.query = function (sql, params) {
    return new Promise(function (resolve, reject) {
        pool.getConnection(function (err, connection) {
            if (err) {
                console.error(moment().format() + "sql.query:" + err + "----sql:" + sql);
                logs.logs("sql.query.getConnection:" + err + "----sql:" + sql, "error");
                reject(err);
            }

            connection.query(sql, params, function (err, result) {
                if (err) {
                    console.error(moment().format() + "sql.query:" + err + "----sql:" + sql);
                    logs.logs("sql.query:" + err + "----sql:" + sql, "error");
                    reject(err);
                }

                //console.log(result);
                resolve(result);
            });
            //回收pool
            connection.release();
        });
    });
};

module.exports = sql;