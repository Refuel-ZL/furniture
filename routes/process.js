'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-31 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-12 15:03:54
 */
const router = require('koa-router')()
const urlencode = require('urlencode')
var qrcodeutil = require('../models/qrcode/util')

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
router.all('/search', async(ctx, next) => {
    await ctx.render('process/search')
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

/**
 * TODO GET二维码
 * 
 */
router.all('/qrcode', async(ctx, next) => {
    var url = 'https://www.baidu.com/你好'
    ctx.set({
        'Content-Type': 'image/jpeg'
    })
    ctx.body = qrcodeutil.createQr(url)
})


/**
 * 请求配置的生产类别
 */
router.all('/beltline', async(ctx, next) => {
    var res = {
        item: [],
        data: {}
    }
    res.data = await processutil.fetchbeltlineitem()
    res.item = Object.keys(res.data)
    ctx.body = res
})

/**
 * 表单校验
 */
router.get('/check/:conn', async(ctx, next) => {
    var conn = ctx.params.conn
    var res = ''
    switch (conn) {
        case 'pid':
            let id = ctx.query.Pid
            res = await processutil.verifyPid(id)
            break
        default:
            res = false
    }
    ctx.body = { 'valid': res }
})

/**
 * 
 */
router.post('/submit', async(ctx, next) => {
    var req = ctx.request.body
    ctx.body = await processutil.submit(req)
})
exports = module.exports = router