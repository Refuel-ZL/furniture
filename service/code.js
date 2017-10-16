"use strict"
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-22 14:29:25 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-11 09:21:08
 */
var _code = []
var _codeCallback = []
var wxconfig = require("../config/wxconfig")
var Wechat = require("../wechat/wechat")
var schedule = require("node-schedule")

var wechatApi = new Wechat(wxconfig.wechat)

var loadGettoken = async function(code, params, fun) {
    var codeCache = _code
    var codeCacheCallback = _codeCallback
    if (!codeCache[code]) {
        if (codeCacheCallback[code]) {
            codeCacheCallback[code].push([fun])
        } else {
            codeCacheCallback[code] = [fun]
            codeCache[code] = JSON.parse(await wechatApi.fetchwebaccess_token(params))
            codeCacheCallback[code][0](codeCache[code])
            codeCacheCallback[code] = null
        }
    } else {
        fun(codeCache[code])
    }
}
var T1 = schedule.scheduleJob("* */10 * * * *", async function() {
    _code = []
    _codeCallback = []
})
exports = module.exports = loadGettoken