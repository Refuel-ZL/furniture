"use strict"
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-31 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-11 09:54:00
 */
const router = require("koa-router")()
const urlencode = require("urlencode")

var moment = require("moment-timezone")
moment.tz.setDefault("Asia/Shanghai")
var wxconfig = require("../config/wxconfig")
const logUtil = require("../models/log4js/log_utils")
var scanqrutil = require("../service/scanqr")
var userutil = require("../service/user")
var Wechat = require("../wechat/wechat")

var configUtil = require("../service/config")

var wechatApi = new Wechat(wxconfig.wechat)

/**
 * 提交产品
 */
var iplist = []
router.get("/qrform", async(ctx, next) => {
    var no = ctx.query.t || ctx.request.body.t //获取提交的型号
    var params = {
        url: urlencode(`http://${ctx.hostname}/scanqr/qrupinfo`),
        scope: "snsapi_userinfo",
        param: no,
    }
    var url = await wechatApi.fetchcode(params)
    ctx.redirect(url) //重定向
})

/**
 * 获取openid
 * 获取产品详情 返回前台
 */
router.get("/qrupinfo", async(ctx, next) => {
    ctx.set("Access-Control-Allow-Origin", "*")
    ctx.set("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE")
    ctx.set("Access-Control-Allow-Credentials", true)
    ctx.set("Access-Control-Max-Age", 300)
    var code = ctx.query.code
    var state = ctx.query.state
    ctx.state = {
        title: `${state}`,
        content: "提示语",
        data: ""
    }
    try {
        var params = {
            code: code
        }
        if (!ctx.session.openid) {
            var data = JSON.parse(await wechatApi.fetchwebaccess_token(params))
            if (data.errcode) {
                ctx.state.content = "二维码信息已失效，请重新扫码提交"
                logUtil.writeErr(`【${state}】QR获取微信id异常`, JSON.stringify(data))
                await ctx.render("scanqr/index", ctx.state)
                return
            } else {
                let nameinfo = await userutil.fetchname(data.openid)
                let nameworkitem = await userutil.fetchuserwork(data.openid)
                if (nameinfo.code == "error" || nameworkitem.code == "error") {
                    ctx.state.content = `拉取用户信息异常${nameinfo.message||nameworkitem.message}`
                    await ctx.render("scanqr/index", ctx.state)
                    return
                } else {
                    ctx.session = {
                        user_id: Math.random().toString(36).substr(2),
                        openid: data.openid
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
            let userwork = await userutil.fetchuserwork(option.openid)

            if (val.code == "error" || userwork.code == "error") {
                ctx.state.content = `拉取${state}错误：${val.message}`
            } else {
                val.data.default = false
                if (userwork.data.workitem[val.data.next]) {
                    val.data.default = true
                }
                ctx.state.data = val.data
                ctx.state.data.workitem = userwork.data.workitem
                ctx.state.data.pid = option.itemno
                ctx.state.config = configUtil.getconf()

                ctx.state.data.timeout = {
                    status: false,
                    timer: 0, //时间差值
                    conf: ctx.state.config.workgap
                }
                if (ctx.state.data.index != 0) { //是否超时 非首道工序
                    try {
                        let t1 = moment(ctx.state.data.details[0].recordtime).valueOf()
                        let t2 = moment().valueOf()
                        ctx.state.data.timeout.timer = t2 - t1
                        ctx.state.data.timeout.status = ctx.state.data.timeout.timer > ctx.state.data.timeout.conf
                    } catch (error) {
                        console.error(error)
                    }
                }




            }
        } else {
            ctx.session = ""
            ctx.state.content = "产品型号已丢失请重新扫码"
        }

    } catch (error) {
        ctx.session = ""
        ctx.state.content = "用户提交工作异常!请重试"
        logUtil.writeErr(`【用户提交${state}工作】拉取用户信息异常`, error)
    }
    await ctx.render("scanqr/index", ctx.state)
})

router.get("/test", async(ctx, next) => {
    ctx.state = {
        "title": "kt-9-002",
        "content": "提示语",
        "data": {
            "name": "赵磊2",
            "id": 342,
            "nextindex": 343,
            "workstage": "刨方",
            "index": 3,
            "next": "立铣",
            "status": "0",
            "details": [{ "pid": "kt-9-002", "status": "0", "orderinfo": "kt-9-002", "userid": "赵磊2", "workstage": "刨方", "id": 342, "recordtime": "2017-09-20 10:16:09", "kind": "1", "index": 3, "next": "立铣", "nextindex": 343 }],
            "default": false,
            "workitem": { "null": null },
            "pid": "kt-9-002"
        },
        "config": {
            "qrencryption": false,
            "host": "http://my.ngrok.zltcloud.com",
            "workgap": 1000,
            "orserstutas": { "0": "进行中", "1": "已完成", "2": "已取消" },
            "beltline": {
                "柜门": { "下料": "", "拼版": "", "刨方": "", "立铣": "", "出榫": "", "组装": "", "定尺": "", "边型铰孔": "", "装线条": "", "白胚质检": "", "打磨": "", "底油": "", "底油质栓": "", "面油": "", "成品质检": "", "成品包装": "", "发货": "" },
                "柜体": { "下料": "", "封边": "", "排钻": "", "打磨": "", "底油": "", "质检": "", "面油": "", "包装": "", "发货": "" },
                "房门": {
                    "下料": "",
                    "刨方": "",
                    "立铣": "",
                    "出榫": "",
                    "组装": "",
                    "定尺": "",
                    "面线造型": "",
                    "雕花": "",
                    "门套": "",
                    "套线": "",
                    "白胚质检": "",
                    "底油": "",
                    "打磨": "",
                    "面油": "",
                    "成品质检": "",
                    "包装": "",
                    "发货": ""
                }
            }
        },
        "settings": { "views": "d:\\Empolder\\WebWorkspaces\\furniture\\views" },
        "partials": {},
        "filename": "d:\\Empolder\\WebWorkspaces\\furniture\\views\\scanqr\\index.html"
    }

    await ctx.render("scanqr/index", ctx.state)
})


router.post("/worksubmit", async(ctx, next) => {
    var res = {
        code: "ok"
    }
    if (ctx.session.openid) {
        let userwork = await userutil.fetchuserwork(ctx.session.openid)
        if (userwork.code == "ok") {
            var params = ctx.request.body
            params.name = userwork.data.name
            if (!userwork.data.workitem[params.work]) {
                console.log(`危险${params.name}使用自身以外的【${params.work}】权限`)
            }
            let val = await scanqrutil.recordwork(params)
            if (val.code == "error") {
                res.code = "error"
                res.message = `录入错误${val.message}`
            }
        } else {
            res.code = "error"
            res.message = userwork.message
        }
    } else {
        res.code = "error"
        res.message = "很抱歉！您的身份信息已过期请重新用微信扫描产品二维码"
    }
    ctx.body = res

})

router.all("/exit", async(ctx, next) => {
    //ctx.session.get(sid)
    // ctx.session = ""
    ctx.session = {
        user_id: Math.random().toString(36).substr(2),
        openid: new Date().getTime()
    }
    ctx.body = ctx
})

router.all("/aa", async(ctx, next) => {
    //ctx.session.get(sid)
    // ctx.session = ""
    ctx.session = null
    ctx.body = ctx
})
router.all("/bb", async(ctx, next) => {
    //ctx.session.get(sid)
    // ctx.session = ""
    ctx.body = ctx.session
})

exports = module.exports = router