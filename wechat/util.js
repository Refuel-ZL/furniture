'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-22 14:52:36 
 * @Last Modified by:   ZhaoLei 
 * @Last Modified time: 2017-08-22 14:52:36 
 */

var xml2js = require('xml2js')
var moment = require('moment-timezone')
moment.tz.setDefault('Asia/Shanghai')
var tpl = require('./tpl')
const Promise = require('bluebird')

exports.parseXMLAsync = function(xml) {
    return new Promise(function(resolve, reject) {
        xml2js.parseString(xml, { trim: true }, function(err, content) {
            if (err) reject(err)
            else resolve(content)
        })
    })
}

exports.formatMessage = function(result) {
    var message = {}
    if (typeof result === 'object') {
        var keys = Object.keys(result)

        for (var i = 0; i < keys.length; i++) {
            var item = result[keys[i]]
            var key = keys[i]
            if (!(item instanceof Array) || item.length === 0) {
                continue
            }
            if (item.length === 1) {
                var val = item[0]
                if (typeof val === 'object') {
                    message[keys] = this.formatMessage(val)
                } else {
                    message[key] = (val || '').trim()
                }
            } else {
                message[key] = []
                for (var j = 0, k = item.length; j < k; j++) {
                    message[key].push(this.formatMessage(item[j]))
                }
            }

        }
    }
    return message
}

exports.tpl = function(content, message) {
    var info = {}
    var type = 'text'
    var fromUserName = message.FromUserName
    var toUserName = message.ToUserName

    if (Array.isArray(content)) {
        type = 'news'
    }
    type = content.type || type

    info.content = content
    info.createTime = moment().format('X')
    info.msgType = type
    info.toUserName = fromUserName
    info.fromUserName = toUserName
    return tpl.compiled(info)
}