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
        await ctx.redirect("/")
    }
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