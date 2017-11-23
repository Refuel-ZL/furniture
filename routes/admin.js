"use strict"
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-31 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-12 17:05:09
 */
const router = require("koa-router")()
var configUtil = require("../service/config")
var moment = require("moment-timezone")
moment.tz.setDefault("Asia/Shanghai")
const logUtil = require("../models/log4js/log_utils")
var adminutil = require("../service/admin")

router.get("/", async(ctx, next) => {
    if (ctx.session.user) {
        await ctx.redirect("/")
    }
    ctx.state = {
        title: "管理员登录",
        status: true
    }
    await ctx.render("admin/index", ctx.state)
})
router.get("/reg", async(ctx, next) => {
    if (ctx.session.user) {
        await ctx.redirect("/")
    }
    ctx.state = {
        title: "用户注册",
        status: false
    }
    await ctx.render("admin/index", ctx.state)
})
router.get("/exit", async(ctx, next) => {
    if (!ctx.session.user) {
        await ctx.redirect("/")
    } else {
        ctx.session = ""
        await ctx.redirect("/admin")
    }
})
router.get("/modify", async(ctx, next) => {
    if (!ctx.session.user) {
        await ctx.redirect("/")
    } else {
        ctx.state = {
            title: "更改管理员密码",
            name: ctx.query.u_id || ctx.session.user,
            user: ctx.session.user || ''
        }
        await ctx.render("admin/modify", ctx.state)
    }
})
router.post("/modify", async(ctx, next) => {
    var res = {
        code: "ok"
    }
    if (ctx.request.body.password1 == ctx.request.body.password2) {
        var param = {
            "username": ctx.request.body.username,
            "password": ctx.request.body.password
        }
        let log = await adminutil.login(param)
        if (log.code == "ok") {
            param = {
                "username": ctx.request.body.username,
                "password": ctx.request.body.password1
            }
            log = await adminutil.modify(param)
            if (log.code == "ok") {
                res = {
                    code: "ok"
                }
                ctx.session = ""
            } else {
                res = {
                    code: "error",
                    message: `操作失败：${log.message}`
                }
            }
        } else {
            res = {
                code: "error",
                message: `登录密码错误：${log.message}`
            }
        }
    } else {
        res = {
            code: "error",
            message: "两次密码不一致"
        }
    }
    ctx.body = res
})
router.post("/", async(ctx, next) => {
    var res = {
        code: "ok"
    }
    var param = ctx.request.body
    if (param.status) { //登录
        let log = await adminutil.login(param)
        if (log.code == "ok") {
            ctx.session.user = param.username
            res = {
                code: "ok"
            }
        } else {
            res = {
                code: "error",
                message: log.message
            }
        }
    } else { //注册

    }

    ctx.body = res
})





exports = module.exports = router