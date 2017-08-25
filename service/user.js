'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-23 10:58:12 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-08-25 11:26:48
 */
const consql = require('../models/sqlite/util')
const logUtil = require('../models/log4js/log_utils')

exports = module.exports = {
    reguser: async function(param) {
        let sql1 = 'SELECT id FROM user WHERE user.openid=$openid'
        let _param = {
            $openid: param.openid
        }
        try {
            let res1 = await consql.select(sql1, _param)
            if (res1.length <= 0) {
                let sql2 = 'INSERT INTO user(openid,"name") VALUES ($openid,$name)'
                _param = {
                    $openid: param.openid,
                    $name: param.name
                }
                await consql.inser(sql2, _param)
            } else {
                let sql3 = 'UPDATE user SET "name" = $name WHERE openid = $openid'
                _param = {
                    $openid: param.openid,
                    $name: param.name
                }
                await consql.update(sql3, _param)
            }
        } catch (error) {
            logUtil.writeErr('用户微信认证异常', error)
        }
        return 'zhuce'
    },
    getuser: function(openid) {
        return 'get'
    },
    deluser: function(openid) {
        return '删除'
    }
}