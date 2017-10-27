"use strict"
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-22 14:29:25 
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2017-10-26 10:33:04
 */
const router = require("koa-router")()
const urlencode = require("urlencode")
const _ = require("lodash")
var moment = require("moment-timezone")
moment.tz.setDefault("Asia/Shanghai")
var wxconfig = require("../config/wxconfig")
const logUtil = require("../models/log4js/log_utils")
var userutil = require("../service/user")

var Wechat = require("../wechat/wechat")

var wechatApi = new Wechat(wxconfig.wechat)
var gettoken = require("../service/code")
var val = {}
var rt = 60 * 1000

router.use(async(ctx, next) => {
    if (!ctx.session.user) {
        if (ctx.URL.pathname == "/user/qr" || ctx.URL.pathname == "/user/fetch" || ctx.URL.pathname == "/user/qr" || ctx.URL.pathname == "/user/qrupreg" || ctx.URL.pathname == "/user/test" || ctx.URL.pathname == "/user/test1") {
            return await next()
        } else {
            await ctx.redirect('/admin/')

        }
    } else {
        return await next()
    }
})
router.get("/", async function(ctx, next) {
    ctx.state = {
        title: "员工管理",
        user: ctx.session.user || ''
    }
    await ctx.render("user/userinfo")

})


router.get("/reguser", async function(ctx, next) {
    ctx.state = {
        title: "员工登记"
    }
    await ctx.render("user/reguser")
})


/**
 * 浏览器获取扫码结果
 */
router.get("/fetch", async function(ctx, next) {
    ctx.set("Content-Type", "text/event-stream")
    var t = ctx.query.t || ctx.request.body.t
    if (!t) { ctx.body = "error"; return }
    // console.log("值", _.has(val, t))
    if (_.has(val, t)) {
        if (val[t]) {
            let v = JSON.stringify(val[t])
            delete val[t]
            ctx.body = `event:ready\ndata:{"value":${v}}\n\n` //自定义事件
        } else {
            let res = {
                code: "info",
                massage: "未扫描"
            }
            res = JSON.stringify(res)
            ctx.body = `event:ready\ndata:{"value":${res}}\n\n` //自定义事件
        }
    } else {
        let res = {
            code: "error",
            massage: "已失效"
        }
        res = JSON.stringify(res)
        ctx.body = `event:ready\ndata:{"value":${res}}\n\n` //自定义事件
    }
})

/**
 * 网页微信扫码地址
 * 传递参数，重定向微信URL
 */
router.get("/qr", async function(ctx, next) {
    var t = ctx.query.t || ctx.request.body.t
    var params = {
        url: urlencode(`http://${ctx.hostname}/user/qrupreg`),
        scope: "snsapi_base",
        param: t,
    }
    var url = await wechatApi.fetchcode(params)
    ctx.redirect(url) //重定向
})

/**
 * 获取绑定特征码
 * 服务器得到openid
 * 
 */
router.all("/qrupreg", async function(ctx, next) {
    var html = `<script>(function(){alert("msg");})()</script>`
    try {
        var code = ctx.query.code
        var state = ctx.query.state
            // console.log("code " + code)
        if (_.has(val, state)) {
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
                logUtil.writeErr("QR获取id异常", JSON.stringify(data))
                html = html.replace(/msg/, "获取信息失败，错误码: " + data.errcode)
            } else {
                val[state] = {
                    openid: data.openid
                }
                html = html.replace(/msg/, "获取信息成功")
            }
        } else {
            html = html.replace(/msg/, "获取信息失败,该二维码已失效")
        }
    } catch (error) {
        html = html.replace(/msg/, "获取信息失败,发生错误，请查看系统日志")
        logUtil.writeErr("QR获取id错误", error)
    }
    ctx.body = html
})

router.get("/key", async function(ctx, next) {
    var t = ctx.query.t
    val[t] = ""
    scheduleCronstyle(t)
    ctx.body = "ok"
})

/**
 * 页面表单提及路由
 * 返回{
 *      code:ok,error  
 *      url/massage
 * }
 * 
 */
router.post("/registe", async function(ctx, next) {
    var res = {
        code: "ok",
    }
    var data = ctx.request.body
    let param = {
        name: data.Name,
        openid: data.Openid,
        work: data.work || []
    }
    try {
        if (await userutil.verifyname(param.name)) {
            if (await userutil.verifyid(param.openid)) {
                let val = await userutil.reguser(param)
                if (val.code == "ok") {
                    res.code = "ok"
                    res.url = "/user/ok"
                } else {
                    res.code = "error"
                    res.message = val.message
                }
            } else {
                res.code = "error"
                res.message = "此微信已抢注"
            }
        } else {
            res.code = "error"
            res.message = "此账户名已抢注"
        }
    } catch (error) {
        console.dir(error)
        res.code = "error"
        res.message = `${JSON.stringify(error)}`
    }
    ctx.body = res
})

/**
 * 表单校验接口
 * 
 */

router.all("/check/:conn", async function(ctx, next) {
    var conn = ctx.params.conn
    var res = ""
    switch (conn) {
        case "id":
            let id = ctx.query.Openid
            res = await userutil.verifyid(id)
            break
        case "name":
            let name = ctx.query.Name
            res = await userutil.verifyname(name)
            break
        default:
            res = false
    }
    ctx.body = { "valid": res }
})


/**
 * 账户信息对外接口
 * 
 */
router.all("/data", async function(ctx, next) {
    var res = {
        total: 0,
        rows: {}
    }
    try {
        var limit = ctx.query.limit || ctx.request.body.limit || null
        var offset = ctx.query.offset || ctx.request.body.offset || 0
        var search = ctx.query.search || ctx.request.body.search || ""

        var option = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            search: search
        }
        let data = await userutil.fetchwork(option)
        if (data.code == "ok") {
            res = {
                total: data.total,
                rows: data.rows
            }
        }
    } catch (error) {
        console.log(error.massage)
    }

    ctx.body = res
})


/**
 * 接受用户信息修改
 *
 */
router.all("/reuserinfo", async function(ctx, next) {
    var res = {
        code: "ok",
        message: ""
    }
    var data = {}
    if (Object.keys(ctx.query).length === 0) {
        data = ctx.request.body
    } else {
        data = ctx.query
    }
    try {
        res = await userutil.updateuserinfo(data)
        if (res.code == "ok") {
            let param = {
                id: data.Openid,
                name: data.Name,
                work: {}
            }
            for (var key in data) {
                if (key.substring(0, 4) === "Work") {
                    param.work[key.substring(4)] = data[key]
                }
            }
            if (Object.keys(param).length === 0) {
                res = {
                    code: "error",
                    message: "工序参数失败"
                }
            } else {
                res = await userutil.updateuserwork(param)
                if (res.code != "ok") {
                    res = {
                        code: "error",
                        message: res.message
                    }
                }
            }
        } else {
            res = {
                code: "error",
                message: res.message
            }
        }
    } catch (error) {
        res = {
            code: "error",
            message: error.message
        }
    }

    ctx.body = res
})


/**
 * 删除用户路由
 * 
 */
router.post('/delet', async(ctx, next) => {
    var list = ctx.request.body.uidlist
    var res = {
            code: 'ok'
        }
        // if (ctx.session.user) {
    if (true) {
        if (list) {
            await userutil.deletuser(list)

        } else {
            res = {
                code: 'error',
                message: '参数错误'
            }
        }
    } else {
        res = {
            code: 'error',
            message: '对不起，你没有登录或登录信息已过期，请重新登录'
        }
    }

    ctx.body = res
})

router.all('/search', async(ctx, next) => {
    ctx.state = {
        title: '用户搜索',
        user: ctx.session.user || ''
    }
    await ctx.render('user/search', ctx.state)
})

/**
 * 获取所有订单id
 */
router.all('/userlist', async(ctx, next) => {
    var res = []
    try {
        res = await userutil.fetchuserlist()
    } catch (error) {
        console.log(error)
    }
    ctx.body = res
})

/**
 * 
 * 获取userid 的工作记录
 */
router.all('/userid_data', async function(ctx, next) {
    var res = {
        total: 0,
        rows: []
    }
    try {
        var limit = ctx.query.limit || ctx.request.body.limit || null
        var offset = ctx.query.offset || ctx.request.body.offset || 0
        var search = ctx.query.search || ctx.request.body.search || ''
        var userid = ctx.query.userid || ctx.request.body.userid || ''
        var sortName = ctx.query.sortName || ctx.request.body.sortName || 'id'
        var sortOrder = ctx.query.sortOrder || ctx.request.body.sortOrder || 'esc'
        var starttime = ctx.query.starttime || ctx.request.body.starttime || ''
        var endtime = ctx.query.endtime || ctx.request.body.endtime || ''
        var category = ctx.query.category || ctx.request.body.category || 'ALL'
        var workstage = ctx.query.workstage || ctx.request.body.workstage || 'ALL'
        var option = {
            limit: parseInt(limit),
            offset: parseInt(offset),
            search: search,
            sortName: sortName,
            sortOrder: sortOrder,
            userid: userid,
            starttime: starttime,
            endtime: endtime,
            category: category,
            workstage: workstage,
        }
        if (userid == '') { return ctx.body = res }
        res = await userutil.fetchuserlog(option)
        if (res.code == 'ok') {
            res = {
                total: res.total,
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
    } finally {
        ctx.body = res
    }
})

function scheduleCronstyle(id) {
    setTimeout(function() { Rtask(id) }, rt)
}

function Rtask(id) {
    console.log("删除", id)
    try {
        delete val[id]
    } catch (error) {
        console.dir(error)
    }

}

exports = module.exports = router