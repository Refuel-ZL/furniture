'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-22 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-12 17:04:39
 */

const router = require('koa-router')()
const logUtil = require('../models/log4js/log_utils')
var moment = require('moment-timezone')
moment.tz.setDefault('Asia/Shanghai')
const users = require('./users')
const wx = require('./wx')
const scanqr = require('./scanqr')
const order = require('./order')
const admin = require('./admin')
const config = require('./config')

router.use('/user', users.routes(), users.allowedMethods())
router.use('/wx', wx.routes(), wx.allowedMethods())
router.use('/scanqr', scanqr.routes(), scanqr.allowedMethods())
router.use('/order', order.routes(), order.allowedMethods())
router.use('/admin', admin.routes(), admin.allowedMethods())
router.use('/config', config.routes(), config.allowedMethods())


router.get('/', async(ctx, next) => {
    ctx.state = {
        title: '首页',
        content: '恭喜你操作成功',
        user: ctx.session.user || ''
    }
    await ctx.render('index', ctx.state)
})
router.all('/help', async(ctx, next) => {
    ctx.state = {
        title: '帮助',
        user: ctx.session.user || ''
    }
    await ctx.render('help', ctx.state)
})
exports = module.exports = router