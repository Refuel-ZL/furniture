'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-31 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-12 17:05:09
 */
const router = require('koa-router')()
var configUtil = require('../service/config')
var moment = require('moment-timezone')
moment.tz.setDefault('Asia/Shanghai')
const logUtil = require('../models/log4js/log_utils')
var adminutil = require('../service/admin')

router.get('/', async(ctx, next) => {
    if (ctx.session.user) {
        await ctx.redirect('/')
    }
    ctx.state = {
        title: '用户登陆',
        status: true
    }
    await ctx.render('admin/index', ctx.state)
})
router.post('/login', async(ctx, next) => {

})


router.get('/register', async(ctx, next) => {
    ctx.state = {
        title: '用户注册',
        status: false
    }
    await ctx.render('admin/index', ctx.state)
})
router.post('/register', async(ctx, next) => {

})




exports = module.exports = router