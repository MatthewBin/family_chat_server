/**
 * Created by maxiaobin on 17/5/2.
 */

// 所有 API 的路由

'use strict';

var router = require('express').Router();

// 添加一个模块

var hello = require('./hello');
var user =require('./user');
var user_chat = require('./user_chat');
//-------------------------------------------------

// 一个 API 路由下的 hello 接口，访问 /api/hello

router.get('/hello', hello.hello);
router.post('/user/get_friend_list',hello.get_friend_list);

router.post('/connect', hello.hello);
router.post('/user/check_id_card', user.check_id_card);
router.post('/user/register', user.register);
router.post('/user/login', user.login);
router.post('/user/user_info', user.user_info);
router.post('/user/set_info', user.set_info);

router.post('/user_chat/get_chat_list', user_chat.get_chat_list);
router.post('/user_chat/send_msg', user_chat.send_msg);
router.post('/user_chat/get_recently_list', user_chat.get_recently_list);
router.post('/user_chat/get_active_list', user_chat.get_active_list);
router.post('/user_chat/send_active', user_chat.send_active);
router.post('/user_chat/get_last_msg', user_chat.get_last_msg);
router.post('/user_chat/set_is_read', user_chat.set_is_read);

//-------------------------------------------------


module.exports = router;
