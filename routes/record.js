'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-31 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-05 10:43:48
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

    await ctx.render('record/index')
})

router.all('/getinfo', async function(ctx, next) {
    var pid = ctx.query.id || ctx.request.body.id
    var item = ctx.query.item || ctx.request.body.item
    var res = ''
        // try {
        //     pid = (JSON.parse(pid))
        // } catch (error) {
        //     pid = new Array(pid)
        // }
        // res = await product.getlog(pid, item)
    ctx.body = res
})

var isArray = function(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]'
}
exports = module.exports = router