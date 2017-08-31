'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-22 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-08-31 11:16:44
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
var val = {}
var rt = 10 * 1000

router.get('/', async function(ctx, next) {
    await ctx.render('user')
})

/**
 * 浏览器获取扫码结果
 */
router.get('/fetch', async function(ctx, next) {
    ctx.res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    })
    var t = ctx.query.t || ctx.request.body.t
    if (!t) { ctx.body = 'error'; return }

    if (_.has(val, t)) {
        let v = JSON.stringify(val[t])
        delete val[t]
        ctx.body = `event:ready\ndata:{"value":${v}}\n\n` //自定义事件
    } else {
        ctx.body = `event:ready\ndata:{"value":"" }\n\n` //自定义事件
    }
    console.log(val)
})

/**
 * 微信扫码访问路由
 * 传递参数，重定向微信URL
 */
router.get('/qr', async function(ctx, next) {
    var t = ctx.query.t || ctx.request.body.t || '46465234668513465'
    var params = {
        url: urlencode(`http://${ctx.host}/user/qrupreg`),
        scope: 'snsapi_base',
        param: t,
    }
    var url = await wechatApi.fetchcode(params)
    ctx.redirect(url) //重定向
})

/**
 * 绑定特征码
 * 接受微信转回的数据
 * 
 */
router.all('/qrupreg', async function(ctx, next) {
    try {
        var code = ctx.query.code
        var state = ctx.query.state
        var params = {
            code: code
        }
        var data = JSON.parse(await wechatApi.fetchwebaccess_token(params))
        if (data.errcode) {
            ctx.body = '关键字失效，请重新扫码'
            logUtil.writeErr('QR获取id异常', data)
            return
        }
        val[state] = {
            openid: data.openid
        }
        scheduleCronstyle(state)
        ctx.body = val
    } catch (error) {
        ctx.body = 'error'
        logUtil.writeErr('QR获取id错误', error)
    }

})

router.post('/registe', async function(ctx, next) {
    var res = {
        code: 'ok',
    }
    var data = ctx.request.body
    let param = {
        name: data.Name,
        openid: data.Openid
    }
    try {

        await userutil.reguser(param)

        res.code = 'ok'
        res.url = '/user/ok'
    } catch (error) {
        console.dir(error)
        res.code = 'error'
        res.message = `${JSON.stringify(error)}`
    }
    ctx.body = res
})

router.all('/check/:conn', async function(ctx, next) {
    var conn = ctx.params.conn
    var res = ''
    switch (conn) {
        case 'key':
            res = true
            break
        case 'name':
            res = true
            break
        default:
            res = false
    }
    ctx.body = { 'valid': res }
})

function scheduleCronstyle(id) {
    setTimeout(function() { Rtask(id) }, rt)
}

function Rtask(id) {
    console.log('删除', id)
    try {
        delete val[id]
    } catch (error) {
        console.dir(error)
    }

}

exports = module.exports = router