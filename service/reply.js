'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-22 15:14:35 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-08-23 10:55:17
 */
var moment = require('moment-timezone')

var config = require('../config/index')
var Wechat = require('../wechat/wechat')
var rule = require('../config/rule')
const logUtil = require('../models/log4js/log_utils')
moment.tz.setDefault('Asia/Shanghai')
var Reply = {
    reply: async function() {
        var wechatApi = new Wechat(config.wechat)
        var message = this.weixin
        var reply = config.greetings
        if (message.MsgType === 'event') {
            if (message.Event === 'subscribe') {
                if (message.EventKey) {
                    // console.log('扫二维码进来：' + message.EventKey + ' ' + message.Ticket)
                }
                logUtil.writeInfo(message.FromUserName + '  事件——关注公众号')
                reply = `${config.greetings}\n请点击菜单栏中：攻略-->指令列表获取当前已支持指令`

            } else if (message.Event === 'CLICK') {
                switch (message.EventKey) {
                    case '_alarmlog':

                        break
                    case 'alarmlog':

                        break
                    case 'alarmlog10':

                        break
                    case 'dictatelist':

                        break
                    case 'about':

                        break
                    default:
                        break
                }
            } else if (message.Event === 'LOCATION') {
                reply = '定位'
            } else if (message.Event === 'unsubscribe') {
                logUtil.writeInfo(message.FromUserName + '  事件——取消公众号')
                reply = '取消关注'
            } else if (message.Event === 'MASSSENDJOBFINISH') {
                logUtil.writeInfo('事件——群发结果事件' + JSON.stringify(message))
                reply = ''
            } else if (message.Event === 'TEMPLATESENDJOBFINISH') {
                // logUtil.writeInfo('事件——模板结果事件' + JSON.stringify(message))
                logUtil.writeInfo('事件——模板发送结果事件  【' + message.FromUserName + '】结果：' + message.Status)
                reply = ''
            } else {
                logUtil.writeInfo(message.FromUserName + '  事件——无效事件')
                reply = '无效事件'
            }

        } else if (message.MsgType === 'text') { //文字
            var content = message.Content
            logUtil.writeInfo(message.FromUserName + '  文本——' + content)
            var order = content.substring(0, 1)
            switch (order) {
                case '#':

                default:
                    reply = '首字符' + order
                    break
            }
        } else if (message.MsgType === 'voice') { //语音


        } else {
            reply = '抱歉！ 未添加该类型的回复策略'
        }
        this.body = reply
    }
}
module.exports = Reply