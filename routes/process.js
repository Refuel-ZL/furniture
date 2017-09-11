'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-31 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-11 10:44:18
 */
const router = require('koa-router')()
const urlencode = require('urlencode')

var moment = require('moment-timezone')
moment.tz.setDefault('Asia/Shanghai')
var wxconfig = require('../config/wxconfig')
const logUtil = require('../models/log4js/log_utils')
var processutil = require('../service/process')
var userutil = require('../service/user')
var Wechat = require('../wechat/wechat')

var wechatApi = new Wechat(wxconfig.wechat)

router.all('/', async(ctx, next) => {
    await ctx.render('process/search')
})

router.all('/input', async(ctx, next) => {
    await ctx.render('process/input')
})

router.all('/data', async function(ctx, next) {
    var res = {
        total: 0,
        rows: []
    }
    try {
        var limit = ctx.query.limit || ctx.request.body.limit || 10
        var offset = ctx.query.offset || ctx.request.body.offset || 0
        var search = ctx.query.search || ctx.request.body.search || ''
        var pid = ctx.query.pid || ctx.request.body.pid || ''
        var option = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            search: search,
            pid: pid
        }
        if (pid == '') { return ctx.body = res }

        res = await processutil.fetchprolog(option)
        if (res.code == 'ok') {
            res = {
                total: res.data.length,
                rows: res.data
            }
        } else {
            console.log(res.message)
            res = {
                total: 0,
                rows: []
            }
        }
    } catch (error) {
        console.log(error)
    }


    ctx.body = res
})

router.all('/exit', async(ctx, next) => {
    ctx.session = ''
    ctx.body = ctx.session
})


exports = module.exports = router