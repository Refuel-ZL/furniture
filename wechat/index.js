var config = require('../config/index')

var getRawBody = require('raw-body')
var sha1 = require('sha1')
var util = require('./util')
var Wechat = require('./wechat')
var logUtil = require('../models/log4js/log_utils')

module.exports = function(opts, handler) {
    var wechat = new Wechat(opts)
    wechat.fetchAccessToken()
    return async(ctx, next) => {
        var token = config.wechat.token
        var signature = ctx.query.signature
        var nonce = ctx.query.nonce
        var timestamp = ctx.query.timestamp
        var echostr = ctx.query.echostr
        var str = [token, timestamp, nonce].sort().join('')
        var sha = sha1(str)
        if (ctx.method === 'GET') {
            if (sha === signature) {
                ctx.body = echostr + ''
            } else {
                ctx.body = 'GET--非微信服务器发来请求'
            }
        } else if (ctx.method === 'POST') {
            if (sha !== signature) {
                ctx.body = 'POST--非微信服务器发来请求'
            } else {
                var data = await getRawBody(ctx.req, {
                    length: ctx.length,
                    limit: '1mb',
                    encoding: ctx.charset
                })
                try {
                    var content = await util.parseXMLAsync(data)
                    var message = util.formatMessage(content.xml)
                    ctx.weixin = message
                    await handler.call(ctx)
                } catch (error) {
                    ctx.body = '内部错误！请稍后再试'
                    logUtil.writeErr('微信服务器应答异常', error)
                }

                wechat.reply.call(ctx)
            }
        }
        await next()
    }
}