'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-22 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-08-31 10:24:37
 */
var wx = require('./wx')
const router = require('koa-router')()
var CryptoJS = require('crypto-js')
const logUtil = require('../models/log4js/log_utils')
var moment = require('moment-timezone')
moment.tz.setDefault('Asia/Shanghai')
var userutil = require('../service/user')
var productutil = require('../service/product')

const config = require('../config/index')
var urlencode = require('urlencode')
var Wechat = require('../wechat/wechat')

var wechatApi = new Wechat(config.wechat)
var users = require('./users')


var outtime = 10 * 60 * 1000 //二维码超时

router.use('/user', users.routes(), users.allowedMethods())
router.use('/wx', wx.routes(), wx.allowedMethods())
router.get('/', async(ctx, next) => {
    // ctx.body = 'Hello World'
    ctx.state = {
        title: '用户操作',
        content: '恭喜你操作成功'
    }

    await ctx.render('index', ctx.state)
})

router.all('/reguser', async(ctx, next) => { //扫描二维码注册
    var val = ''
    var e = new Error()
    try {
        val = ctx.query.t || ctx.request.body.t
        let val_ = val.replace(new RegExp('-', 'gm'), '+').replace(new RegExp('\\*', 'gm'), '/')
        let _val = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(val_))
        var res = _val.split('|')
        if (res.length != 2) {
            e.name = '非法访问'
            e.message = `${val_} 参数错误`
            throw e
        }
        if (moment().format('x') - res[1] > outtime) { //获取二维码时间戳(毫秒)
            e.name = '非法访问'
            e.message = '参数已失效'
            throw e
        }
        if (!res[0]) {
            e.name = '非法访问'
            e.message = '参数不完整'
            throw e
        }
        // var order = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf16.parse(`${res[0]}|${res[1]}`))
        var params = {
            url: urlencode(`http://${ctx.host}/reg`),
            scope: 'snsapi_base',
            param: val,
        }
        var url = await wechatApi.fetchcode(params)
        ctx.redirect(url) //重定向
    } catch (error) {
        logUtil.writeErr(`【${ctx.ip}】 访问:${ctx.url}`, `${error} ${val}`)
        ctx.body = error.message
    }

})

router.all('/reg', async(ctx, next) => {
    try {
        var code = ctx.query.code
        var state = ctx.query.state
        var params = {
            code: code
        }
        let val_ = state.replace(new RegExp('-', 'gm'), '+').replace(new RegExp('\\*', 'gm'), '/')
        state = CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(val_))
        var data = JSON.parse(await wechatApi.fetchwebaccess_token(params))
        if (data.errcode) {
            ctx.body = '关键字失效，请重新扫码'
            logUtil.writeErr('QR获取id异常', data)
            return
        }
        let res = state.split('|')
        if (!res[0] || !data.openid) {
            throw new Error('信息为空')
        }
        let param = {
            name: res[0],
            openid: data.openid
        }
        await userutil.reguser(param)
        ctx.body = data
    } catch (error) {
        ctx.body = '获取用户信息异常!请重试'
        logUtil.writeErr('网页code实名认证用户信息异常', error)
    }
})

router.all('/submit', async(ctx, next) => {
    var no = ctx.query.t || ctx.request.body.t //获取提交的型号
    var params = {
        url: urlencode(`http://${ctx.host}/submitItem`),
        scope: 'snsapi_base',
        param: no,
    }
    var url = await wechatApi.fetchcode(params)
    ctx.redirect(url) //重定向
})

router.all('/submitItem', async(ctx, next) => {
    var code = ctx.query.code
    var state = ctx.query.state
    ctx.state = {
        title: `单号：【${state}】`,
        content: '提示语'
    }
    try {
        var params = {
            code: code
        }
        var data = JSON.parse(await wechatApi.fetchwebaccess_token(params))
        if (data.errcode) {
            ctx.state.content = '二维码信息已失效，请重新扫码提交'
            logUtil.writeErr(`【${state}】QR获取微信id异常`, JSON.stringify(data))
        } else {
            var itemno = state
            var option = {
                openid: data.openid,
                itemno: itemno
            }
            ctx.state.content = await productutil.submit(option)
        }
    } catch (error) {
        ctx.state.content = '用户提交工作异常!请重试'
        logUtil.writeErr(`【用户提交${state}工作】拉取用户信息异常`, error)
    }
    await ctx.render('submit', ctx.state)
})

module.exports = router