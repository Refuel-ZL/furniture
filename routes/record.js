'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-31 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-08-31 16:19:14
 */
const router = require('koa-router')()
const urlencode = require('urlencode')
const _ = require('lodash')
var moment = require('moment-timezone')
moment.tz.setDefault('Asia/Shanghai')
var config = require('../config/index')
const logUtil = require('../models/log4js/log_utils')
var userutil = require('../service/user')

var Wechat = require('../wechat/wechat')

var wechatApi = new Wechat(config.wechat)

router.get('/', async function(ctx, next) {

    await ctx.render('user')
})


exports = module.exports = router