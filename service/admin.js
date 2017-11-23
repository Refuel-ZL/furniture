"use strict"
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-23 10:58:12 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-09 16:40:52
 */
const sqlutil = require("../models/mysql/util")
const logUtil = require("../models/log4js/log_utils")
var moment = require("moment-timezone")
const _ = require("lodash")
moment.tz.setDefault("Asia/Shanghai")
exports = module.exports = {
    login: async function(params) {
        var res = {
            code: "error"
        }
        var sql1 = "select u_password from admininfo where u_name=? "
        var val = await sqlutil.query(sql1, [params.username])
        if (val[0].u_password == params.password) {
            res = {
                code: "ok"
            }
        } else {
            res = {
                code: "error",
                message: "用户名或密码不正确"
            }
        }
        return res
    },
    modify: async function(params) {
        var res = {
            code: "error"
        }
        var sql = [{
            sql: "UPDATE admininfo SET u_password =? WHERE u_name =?",
            param: [params.password, params.username]
        }]
        try {
            await sqlutil.sqlaffair(sql)
            res.code = "ok"
        } catch (error) {
            res = {
                code: "error",
                message: error.message
            }
        }
        return res
    }

}