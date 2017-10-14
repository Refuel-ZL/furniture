"use strict"
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-22 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-11 09:21:08
 */
const router = require("koa-router")()
const urlencode = require("urlencode")
const _ = require("lodash")
var moment = require("moment-timezone")
moment.tz.setDefault("Asia/Shanghai")
var wxconfig = require("../config/wxconfig")
const logUtil = require("../models/log4js/log_utils")

const configinfo = require("../service/config")


var config = {}



/**
 *返回工序列表
 */
router.use(async(ctx, next) => {
    try {
        await configinfo.regetconf()
    } catch (error) {
        throw "config error"
    }

    return next()
})
router.get("/workitems", async function(ctx, next) {
    config = configinfo.getconf().beltline
    var key = _.keys(config)
    var res = {
        total: 0,
        rows: []
    }
    if (key != null || key.length != 0) {
        res.total = key.length
        for (var i = 0; i < key.length; i++) {
            var val = _.keys(config[key[i]])
            var va = {
                "name": key[i],
                "item": val
            }
            res.rows.push(va)
        }
    }
    ctx.body = res || {}
})
router.get("/orserstutas", async function(ctx, next) {
    config = configinfo.getconf()
    ctx.body = config.orserstutas || {}
})

exports = module.exports = router