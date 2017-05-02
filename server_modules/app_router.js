/**
 * Created by maxiaobin on 17/5/2.
 */

// 所有 API 的路由

'use strict';

var router = require('express').Router();

// 添加一个模块

var hello = require('./hello');

//-------------------------------------------------



// 一个 API 路由下的 hello 接口，访问 /api/hello

router.get('/hello', hello.hello);

//-------------------------------------------------


module.exports = router;