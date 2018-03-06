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
var orderutil = require("../service/order")
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
        content: null,
        data: "",
        name: ""
    }
    try {
        var params = {
            code: code
        }
        var nameworkitem = {}
        if (!ctx.session.openid) {
            // var data = await wechatApi.fetchwebaccess_token(params)
            var data = await new Promise(function (resolve, reject) {
                try {
                    gettoken(code, params, function (data) {
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
                nameworkitem = await userutil.fetchuserwork(data.openid)
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
        } else {
            nameworkitem = await userutil.fetchuserwork(ctx.session.openid)
        }

        if (state && ctx.session.openid) {
            var option = {
                openid: ctx.session.openid,
                itemno: state
            }
            let val = await scanqrutil.scaninfo(option)
            if (val.code == "error" || nameworkitem.code == "error") {
                ctx.state.content = `拉取${state}错误：${val.message||nameworkitem.message}`
                logUtil.writeErr(`拉取${state}错误`, `${val.message||nameworkitem.message}`)
                logUtil.writeDebug(ctx.state.content)
            } else {
                if (nameworkitem.data.workpart == 1) { //配件员工
                    if (val.data.partstate == 0) { //非配件订单
                        ctx.state.content = `该${state}订单无配件工序，因此配件员工无法对其操作。如有问题请联系管理员`
                    } else {
                        //1.是否已经提交
                        //2.未提交返回的数据
                        if (val.data.parttime || val.data.partuser) {
                            let _data = await userutil.fetchname(val.data.partuser)
                            let name = _data.code == "ok" ? _data.data.name : val.data.partuser
                            ctx.state.content = `该订单已由【${name}】于【${moment(val.data.parttime).format("YYYY-MM-DD HH:mm:ss")}】提交配件工序，如有问题请联系管理员`
                        } else {
                            ctx.state.data = val.data
                            ctx.state.data.type = 1 //配件提交类型
                            ctx.state.data.next = "配件"
                            ctx.state.data.nextindex = null
                            ctx.state.data.pid = option.itemno
                            ctx.state.config = configUtil.getconf()
                        }
                    }
                } else {
                    //1.判断配件工序是否完成 status
                    var status = true
                    if (val.data.partstate == 1 && !(val.data.parttime && val.data.partuser)) { //配件订单
                        var _data = await orderutil.fetchorderwork(state)
                        if (_data.code == "ok") {
                            let list = [] //下一道工序的序号
                            for (i in _data.data) {
                                list.push(_data.data[i].workstage)
                            }
                            var nextid = list.indexOf(val.data.next)
                            var key_work = ["柜门-白胚质检","门套-白胚质检", "墙板-白胚质检","房门-白胚质检"]
                            for (var i = 0; i < key_work.length; i++) {
                                var n = list.indexOf(key_work[i])
                                if (n <= nextid && n != -1) {
                                    status = false
                                    ctx.state.content = `该${state}订单配件工序尚未完成，无法对其进行${val.data.next}等后续操作。如有问题请联系管理员`
                                    break
                                }
                            }
                        } else {
                            status = false
                            ctx.state.content = `该${state}订单的工序集合获取失败。如有问题请联系管理员`
                        }
                    }
                    if (status) {
                        val.data.type = 0 //正常提交
                        val.data.default = false
                        //是否是默认工序
                        if (nameworkitem.data.workitem[val.data.next]) {
                            val.data.default = true
                        }
                        ctx.state.data = val.data
                        ctx.state.data.workitem = nameworkitem.data.workitem
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
                }

            }
            ctx.state.name = val.data.name
        } else {
            ctx.session = ""
            ctx.state.content = "产品型号已丢失请重新扫码"
        }
    } catch (error) {
        ctx.session = ""
        ctx.state.content = "用户提交工作异常!请重试"
        logUtil.writeErr(`【用户提交${state}工作】拉取用户信息异常`, error)
        logUtil.writeDebug(`【用户提交${state}工作】拉取用户信息异常${JSON.stringify(ctx.state)}`)
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
    var data = await new Promise(function (resolve, reject) {
        try {
            gettoken(code, params, function (data) {
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

/**
 * 主要工序提交
 */
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
 * 配件工序提交
 */
router.post("/worksubmit_", async(ctx, next) => {
    var res = {
        code: "ok"
    }
    if (ctx.session.openid) {
        let userwork = await userutil.fetchuserwork(ctx.session.openid)
        if (userwork.code == "ok") {
            var params = ctx.request.body
            params.name = userwork.data.name
            params.openid = ctx.session.openid

            let val = await scanqrutil.recordwork_(params)

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
var sec_to_time = function (s) {
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

        if (min < 10) {
            t += "0";
        }
        t += min + ":";
        if (sec < 10) {
            t += "0";
        }
        t += sec.toFixed(2);
    }
    return t;
}

exports = module.exports = router