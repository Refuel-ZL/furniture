'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-22 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-08 18:54:51
 */

const router = require('koa-router')()
const logUtil = require('../models/log4js/log_utils')
var moment = require('moment-timezone')
moment.tz.setDefault('Asia/Shanghai')
const users = require('./users')
const wx = require('./wx')
const process = require('./process')


router.use('/user', users.routes(), users.allowedMethods())
router.use('/wx', wx.routes(), wx.allowedMethods())
router.use('/process', process.routes(), process.allowedMethods())



router.get('/', async(ctx, next) => {
    ctx.state = {
        title: '用户操作',
        content: '恭喜你操作成功'
    }
    await ctx.render('index', ctx.state)
})

exports = module.exports = router