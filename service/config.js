'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-24 16:40:22 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-11 14:09:47
 */
var path = require('path')
const logUtil = require('../models/log4js/log_utils')

var util = require('../models/fs/util')
var jsonminify = require('jsonminify')
var wechat_flie = path.join(__dirname, '../config/config.json')

var fun = {
    getconf: {},
    regetconf: async function() {
        try {
            var conf = await util.readFileAsync(wechat_flie, 'utf-8')
            this.getconf = jsonminify(conf)
            return this.getconf
        } catch (error) {
            logUtil.writeErr('重新拉去配置文件异常', error)
            return {}
        }
    }
}
fun.regetconf()

exports = module.exports = fun