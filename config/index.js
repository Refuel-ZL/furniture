/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-22 14:50:02 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-08-22 15:27:11
 */
var path = require('path')
var util = require('../models/fs/util')
var wechat_flie = path.join(__dirname, './wechat.json')


var config = {
    greetings: '您好，欢迎关注湖南康森韦尔科技园',
    port: 3000,
    wechat: {
        appID: 'wx36027d695ab350c7',
        appSecret: '8e307a174cde4a2eeae81d0f3d84e7f0',
        token: 'Cq8nEQJwIxy7L3K0FP86VMyhETcSUsyE',
        getAccessToken: function() {
            return util.readFileAsync(wechat_flie, 'utf-8')
        },
        saveAccessToken: function(data) {
            data = JSON.stringify(data)
            return util.writeFileAsync(wechat_flie, data)
        }
    }
}
exports = module.exports = config