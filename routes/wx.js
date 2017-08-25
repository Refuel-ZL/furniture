'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-22 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-08-23 10:56:17
 */
const router = require('koa-router')()
var wechatg = require('../wechat/index')
var config = require('../config/index')

// var Wechat = require('../wechat/wechat')
var reply = require('../service/reply')

router.all('/', wechatg(config.wechat, reply.reply))


module.exports = router