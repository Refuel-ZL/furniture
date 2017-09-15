'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-31 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-11 09:54:00
 */
const router = require('koa-router')()
const urlencode = require('urlencode')

var moment = require('moment-timezone')
moment.tz.setDefault('Asia/Shanghai')
var wxconfig = require('../config/wxconfig')
const logUtil = require('../models/log4js/log_utils')
var scanqrutil = require('../service/scanqr')
var userutil = require('../service/user')
var Wechat = require('../wechat/wechat')

var configUtil = require('../service/config')

var wechatApi = new Wechat(wxconfig.wechat)

/**
 * 提交产品
 */
router.get('/qrform', async(ctx, next) => {
    var no = ctx.query.t || ctx.request.body.t //获取提交的型号
    var params = {
        url: urlencode(`http://${ctx.host}/scanqr/qrupinfo`),
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
        title: `${state}`,
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
                await ctx.render('scanqr/index', ctx.state)
                return
            } else {
                let nameinfo = await userutil.fetchname(data.openid)
                let nameworkitem = await userutil.fetchuserwork(data.openid)
                if (nameinfo.code == 'error' || nameworkitem.code == 'error') {
                    ctx.state.content = `拉取用户信息异常${nameinfo.message||nameworkitem.message}`
                    await ctx.render('scanqr/index', ctx.state)
                    return
                } else {
                    ctx.session = {
                        user_id: Math.random().toString(36).substr(2),
                        openid: data.openid,
                        name: nameinfo.data.name,
                        workitem: nameworkitem.data.workitem
                    }
                }
            }
        }
        if (state) {
            var option = {
                openid: ctx.session.openid,
                itemno: state
            }
            let val = await scanqrutil.scaninfo(option)
            if (val.code == 'error') {
                ctx.state.content = `拉取${state}错误：${val.message}`
            } else {
                val.data.default = false
                if (ctx.session.workitem[val.data.next]) {
                    val.data.default = true
                }
                ctx.state.data = val.data
                ctx.state.data.workitem = ctx.session.workitem
                ctx.state.data.pid = option.itemno
                ctx.state.config = configUtil.getconf()
            }
        } else {
            ctx.session = ''
            ctx.state.content = '产品型号已丢失请重新扫码'
        }

    } catch (error) {
        ctx.session = ''
        ctx.state.content = '用户提交工作异常!请重试'
        logUtil.writeErr(`【用户提交${state}工作】拉取用户信息异常`, error)
    }

    await ctx.render('scanqr/index', ctx.state)
    console.dir(JSON.stringify(ctx.state))
})

router.get('/test', async(ctx, next) => {
    /*  ctx.state = {
         'content': '提示语',
         'data': {
             workitem: {
                 '下料': '1',
                 '': '3'
             },
             details: [{
                 index: 1,
                 kind: null,
                 next: '下料',
                 nextindex: null,
                 orderinfo: 'kay',
                 pid: 'kay',
                 recordtime: null,
                 status: '0',
                 userid: null,
                 workstage: null,
             }],
             id: null,
             name: '赵磊',
             next: '下料',
             nextindex: null,
             orderutilinfo: null,
             status: '0',
             workstage: '',
         },
         config: configUtil.getconf(),
         title: 'kay'
     } */
    ctx.state = {
        "title": "kay",

        "config": configUtil.getconf(),
        "content": "提示语",
        "data": {
            "name": "赵磊",
            "pid": "kay",
            "id": 323,
            "nextindex": 324,
            "workstage": "下料",
            "next": "拼版",
            "status": "0",
            "details": [{
                "pid": "kay",
                "status": "0",
                "orderinfo": "kay",
                "userid": "赵磊",
                "workstage": "下料",
                "id": 323,
                "recordtime": "2017-09-15 17:07:15",
                "kind": "0",
                "index": 1,
                "next": "拼版",
                "nextindex": 324
            }],
            "default": false,
            "workitem": {
                "下料": "1",
                "拼版": "3"
            }
        }
    }

    await ctx.render('scanqr/index', ctx.state)
})


router.post('/worksubmit', async(ctx, next) => {
    var res = {
        code: 'ok'
    }
    if (ctx.session.openid) {
        var params = ctx.request.body
        params.name = ctx.session.name
        if (params.kind == '1') {
            console.log(`危险${params.name}重复产品上一工序【${params.work}】`)
        }
        if (!ctx.session.workitem[params.work]) {
            console.log(`危险${params.name}使用自身以外的【${params.work}】权限`)
            params.kind = 1
        }

        let val = await scanqrutil.recordwork(params)
        if (val.code == 'error') {
            res.code = 'error'
            res.message = `录入错误${val.message}`
        }
    } else {
        res.code = 'error'
        res.message = '很抱歉！请用微信扫描产品编号进入此页面'
    }
    ctx.body = res

})

router.all('/exit', async(ctx, next) => {
    ctx.session = ''
    ctx.body = ctx.session
})


exports = module.exports = router