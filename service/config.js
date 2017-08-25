'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-24 16:40:22 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-08-24 16:57:53
 */
var path = require('path')
var util = require('../models/fs/util')
var wechat_flie = path.join(__dirname, '../config/config.config')

var config = async function() {
    return util.readFileAsync(wechat_flie, 'utf-8')
}


exports = module.exports = config