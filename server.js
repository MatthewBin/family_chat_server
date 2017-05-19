/**
 * 每位工程师都有保持代码优雅的义务
 * Each engineer has a duty to keep the code elegant
 *
 * @author wangxiao
 */

'use strict';

var app = require('./server_modules/app');

// 端口一定要从环境变量 `LC_APP_PORT` 中获取。
// LeanEngine 运行时会分配端口并赋值到该变量。
var PORT = parseInt(process.env.npm_package_config_port || 8675);
app.listen(PORT, function () {
    console.log('Node app is running, port:', PORT, '\n\n\n\n\n\n');
});
