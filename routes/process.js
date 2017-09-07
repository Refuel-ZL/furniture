'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-31 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-07 16:58:47
 */
const router = require('koa-router')()
const urlencode = require('urlencode')

var moment = require('moment-timezone')
moment.tz.setDefault('Asia/Shanghai')
var config = require('../config/index')
const logUtil = require('../models/log4js/log_utils')
var processutil = require('../service/process')
var userutil = require('../service/user')
var Wechat = require('../wechat/wechat')

var wechatApi = new Wechat(config.wechat)

/**
 * 提交产品
 */
router.get('/qrsubmit', async(ctx, next) => {
    var no = ctx.query.t || ctx.request.body.t //获取提交的型号
    var params = {
        url: urlencode(`http://${ctx.host}/process/qrupinfo`),
        scope: 'snsapi_base',
        param: no,
    }
    var url = await wechatApi.fetchcode(params)
    ctx.redirect(url) //重定向
})

/**
 * 获取openid
 * 获取产品详情 返回前台
 */
router.get('/qrupinfo', async(ctx, next) => {
    var code = ctx.query.code
    var state = ctx.query.state
    ctx.state = {
        title: `单号：【${state}】`,
        content: '提示语',
        data: ''
    }
    try {
        var params = {
            code: code
        }
        if (!ctx.session.openid) {
            var data = JSON.parse(await wechatApi.fetchwebaccess_token(params))
            if (data.errcode) {
                ctx.state.content = '二维码信息已失效，请重新扫码提交'
                logUtil.writeErr(`【${state}】QR获取微信id异常`, JSON.stringify(data))
                await ctx.render('submit', ctx.state)
                return
            } else {
                let nameinfo = await userutil.fetchname(data.openid)
                if (nameinfo.code == 'error') {
                    ctx.state.content = `拉取用户信息异常${nameinfo.message}`
                    await ctx.render('submit', ctx.state)
                    return
                } else {
                    ctx.session = {
                        user_id: Math.random().toString(36).substr(2),
                        openid: data.openid,
                        name: nameinfo.data.name
                    }
                }
            }
        }
        if (state) {
            var option = {
                openid: ctx.session.openid,
                itemno: state
            }
            let val = await processutil.scaninfo(option)
            if (val.code == 'error') {
                ctx.state.content = `拉取${state}错误：${val.message}`
            } else {
                ctx.state.data = val.data
            }
        } else {
            ctx.state.content = '产品型号已丢失请重新扫码'
        }

    } catch (error) {
        ctx.state.content = '用户提交工作异常!请重试'
        logUtil.writeErr(`【用户提交${state}工作】拉取用户信息异常`, error)
    }
    await ctx.render('submit', ctx.state)
    console.log(ctx.state)
})
router.get('/submit', async(ctx, next) => {
    ctx.state = {
        title: '单号：【kt-9-002】',
        content: '提示语',
        data: {
            name: '赵磊',
            details: [{
                id: 14,
                index: 1,
                kind: "0",
                next: "ok",
                nextindex: null,
                orderinfo: "kt-9-001",
                pid: "kt-9-001",
                recordtime: "2017-09-07 16:56:37",
                status: "0",
                userid: "赵磊",
                workstage: "封边",
            }],
            default: false,
            next: 'ok',
            nextindex: null,
            orderinfo: 'kt-9-001',
            status: '0',
            workstage: '封边',
            id: 14
        }
    }
    await ctx.render('submit', ctx.state)
    console.log(ctx.state)

})

router.post('/worksubmit', async(ctx, next) => {
    var res = {
        code: 'ok'
    }
    if (ctx.session.openid) {
        var params = ctx.request.body
        params.name = ctx.session.name
        let val = await processutil.recordwork(params)
        if (val.code == 'error') {
            res.code = 'error'
            res.message = `录入错误${val.message}`
        }
    } else {
        res.code = 'error'
        res.message = '很抱歉！您没有登陆，请扫描产品编号进入此页面'
    }
    ctx.body = res
})
router.all('/exit', async(ctx, next) => {
    ctx.session = ''
    ctx.body = ctx.session
})
exports = module.exports = router