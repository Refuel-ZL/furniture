"use strict"
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-31 14:29:25 
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2017-10-26 16:34:25
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
var gettoken = require("../service/code")

/**
 * 提交产品
 */
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
    var code = ctx.query.code
    var state = ctx.query.state
    logUtil.writeDebug(JSON.stringify(ctx.query))
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
            // var data = await wechatApi.fetchwebaccess_token(params)
            var data = await new Promise(function(resolve, reject) {
                try {
                    gettoken(code, params, function(data) {
                        resolve(data)
                    })
                } catch (error) {
                    reject(error)
                }
            })
            logUtil.writeDebug(JSON.stringify(data))
            if (data.errcode) {
                ctx.state.content = "二维码信息已失效，请重新扫码提交"
                logUtil.writeErr(`【${state}】QR获取微信id异常`, JSON.stringify(data))
                await ctx.render("scanqr/index", ctx.state)
                return
            } else {
                let nameinfo = await userutil.fetchname(data.openid)
                let nameworkitem = await userutil.fetchuserwork(data.openid)
                if (nameinfo.code == "error" || nameworkitem.code == "error") {
                    ctx.state.content = `拉取用户信息异常:${nameinfo.message||nameworkitem.message}`
                    logUtil.writeDebug(ctx.state.content)
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
                ctx.state.content = `拉取${state}错误：${val.message||userwork.message}`
                logUtil.writeDebug(ctx.state.content)
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
                        let t1 = moment(ctx.state.data.details[0].recordtime).unix()
                        let t2 = moment().unix()
                        ctx.state.data.timeout.timer = t2 - t1
                        ctx.state.data.timeout.status = ctx.state.data.timeout.timer > ctx.state.data.timeout.conf
                        ctx.state.data.timeout.timer = sec_to_time(ctx.state.data.timeout.timer)
                    } catch (error) {
                        logUtil.writeErr(`【${state}】检测是否超时异常`, JSON.stringify(error))
                        logUtil.writeDebug(`【${state}】检测是否超时异常 ${JSON.stringify(error)}`)
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
    logUtil.writeDebug(JSON.stringify(ctx.state))
    await ctx.render("scanqr/index", ctx.state)
})


router.get("/qrtest", async(ctx, next) => {
    var no = ctx.query.t || ctx.request.body.t //获取提交的型号
    var params = {
        url: urlencode(`http://${ctx.hostname}/scanqr/qrtest1`),
        scope: "snsapi_userinfo",
        param: no,
    }
    var url = await wechatApi.fetchcode(params)
    ctx.redirect(url) //重定向
})
router.get("/qrtest1", async(ctx, next) => {
    console.log("测试")
    var code = ctx.query.code
    var state = ctx.query.state
    var params = {
        code: code
    }
    var data = await new Promise(function(resolve, reject) {
        try {
            gettoken(code, params, function(data) {
                resolve(data)
            })
        } catch (error) {
            reject(error)
        }
    })
    if (data.errcode) {
        ctx.state.content = "二维码信息已失效，请重新扫码提交"
        logUtil.writeErr(`【${state}】QR获取微信id异常`, JSON.stringify(data))
        ctx.body = ctx.state
        return
    } else {
        console.log(JSON.stringify(data))
        ctx.body = data
    }
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
                logUtil.writeWarn(`危险${params.name}使用自身以外的【${params.work}】权限`)
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

/**
 * 时间秒数格式化
 * @param s 时间戳（单位：秒）
 * @returns {*} 格式化后的时分秒
 */
var sec_to_time = function(s) {
    var t;
    if (s > -1) {
        var hour = Math.floor(s / 3600);
        var min = Math.floor(s / 60) % 60;
        var sec = s % 60;
        if (hour < 10) {
            t = '0' + hour + ":";
        } else {
            t = hour + ":";
        }

        if (min < 10) { t += "0"; }
        t += min + ":";
        if (sec < 10) { t += "0"; }
        t += sec.toFixed(2);
    }
    return t;
}

exports = module.exports = router