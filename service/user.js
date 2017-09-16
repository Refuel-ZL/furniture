'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-23 10:58:12 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-09 16:40:52
 */
const sqlutil = require('../models/mysql/util')
const logUtil = require('../models/log4js/log_utils')
var moment = require('moment-timezone')
const _ = require('lodash')
moment.tz.setDefault('Asia/Shanghai')
exports = module.exports = {
    /**
     * 登记账户
     */
    reguser: async function(param) {
        var res = {
            code: 'ok'
        }
        var time = moment().format('YYYY-MM-DD HH:mm:ss')
        try {
            let sql2 = `INSERT INTO userinfo(userid,openid,usercreatetime,usermtime) VALUES ('${param.name}','${param.openid}','${time}','${time}')`
            await sqlutil.query(sql2)
        } catch (error) {
            res = {
                code: 'error',
                message: error
            }
            logUtil.writeErr('用户微信认证异常', error)
        }
        return res
    },
    /**
     * 核对openid 是否可用
     */
    verifyid: async function(id) {
        let sql1 = `SELECT openid FROM userinfo WHERE userinfo.openid='${id}'`
        try {
            let res1 = await sqlutil.query(sql1)
            if (res1.length <= 0) {
                return true
            } else {
                return false
            }
        } catch (error) {
            logUtil.writeErr('校验Openid异常', error.message)
            return false
        }

    },
    /**
     * 核对name 是否可用
     */
    verifyname: async function(name) {
        if (!name) return false
        let sql1 = `SELECT userid FROM userinfo WHERE userinfo.userid='${name}'`
        try {
            let res1 = await sqlutil.query(sql1)
            if (res1.length <= 0) {
                return true
            } else {
                return false
            }
        } catch (error) {
            logUtil.writeErr('校验用户名异常', error.message)
            return false
        }

    },

    /**
     * 依据id 匹配用户名
     */
    fetchname: async function(openid) {
        var res = {
            code: 'ok'
        }
        let sql1 = 'SELECT userid FROM userinfo WHERE userinfo.openid=?'
        try {
            let res1 = await sqlutil.query(sql1, [openid])
            if (res1.length <= 0) {
                res.code = 'error'
                res.message = '用户不存在'
            } else {
                res.data = {
                    openid: openid,
                    name: res1[0].userid
                }
            }
        } catch (error) {
            logUtil.writeErr('依据openid拉取用户名异常', error.message)
            res.code = 'error'
            res.message = error.message
        }
        return res
    },

    /**
     * 依据id 获取名下所有工序
     * 
     */
    fetchuserwork: async function(openid) {
        //TODO 获取当前用户的所有默认工序接口
        var res = {
            code: 'ok'
        }
        try {
            let sql1 = `SELECT ui.userid, ui.openid,uwi.userwork ,uwi.level FROM  userinfo AS ui LEFT JOIN  userworkinfo AS uwi ON uwi.userid = ui.userid WHERE ui.openid='${openid}'`
            let data = await sqlutil.query(sql1)
            if (data.length <= 0) {
                res = {
                    code: 'error',
                    message: '此用户未获取默认工序或尚未登记'
                }
            } else {
                let item = {}
                for (var i = 0; i < data.length; i++) {
                    item[data[i].userwork] = data[i].level
                }
                res.data = {
                    openid: openid,
                    name: data[0].userid,
                    workitem: item
                }
            }
        } catch (error) {
            logUtil.writeErr('依据openid拉取用户默认工序异常', error.message)
            res.code = 'error'
            res.message = error.message
        }
        return res
    },

    /**
     * 获取所有用户所有工序
     *
     */
    fetchwork: async function(params) {
        var res = {
            code: 'ok'
        }
        try {
            var search = ''
            if (params.search) {
                search = `where concat(IFNULL( uwi.userid, '' ),IFNULL( uwi.userwork, '' ),IFNULL( uwi.level, '' )) like '%${params.search}%' `
            }
            let sql1 = `select SQL_CALC_FOUND_ROWS ui.userid,max(case when  uwi.level='1'  then uwi.userwork else '' end) as '1',max(case when   uwi.level ='2' then  uwi.userwork else '' end)  as '2',max(case when   uwi.level ='3' then  uwi.userwork else '' end)  as '3' ,ui.openid,ui.usercreatetime,ui.usermtime from userinfo AS ui LEFT JOIN  userworkinfo AS uwi ON uwi.userid = ui.userid ${search} group by ui.userid,ui.openid,ui.usercreatetime,	ui.usermtime LIMIT ?,?`
            let data = await sqlutil.query(sql1, [params.offset, params.limit])
            let num = await sqlutil.query('SELECT FOUND_ROWS() num')
            res.rows = data
            res.total = num[0].num
        } catch (error) {
            console.dir(error)
            res = {
                code: 'error',
                message: error.message
            }

        }
        return res
    },

    /**
     * 更新用户信息
     */
    updateuserinfo: async function(params) {

        var res = {
            code: 'ok'
        }
        if (!params.Name || !params.Openid) {
            return {
                code: 'error',
                message: '参数不完整'
            }
        }
        try {
            var time = moment().format('YYYY-MM-DD HH:mm:ss')
            let sql1 = `update userinfo set userid='${params.Name}',usermtime='${time}' where openid='${params.Openid}'`
            await sqlutil.query(sql1)
        } catch (error) {
            res = {
                code: 'error',
                message: error.message
            }
        }
        return res
    },

    /**
     * 更新用户工序
     * @params{
     *  id:
     *  name:
     *  work:{
     *    1:"",
     *    2:"", 
     *    3:"",
     *    }
     * }
     */
    updateuserwork: async function(params) {
        var res = {
            code: 'ok'
        }
        var time = moment().format('YYYY-MM-DD HH:mm:ss')
        try {
            let val = _.keys(params.work)
            val = '\'' + val.join('\',\'') + '\''
            let sql1 = `select level from userworkinfo where userid='${params.name}' and level in(${val})`
            let res1 = await sqlutil.query(sql1)
            for (var i in params.work) {
                let re = true
                for (var j = 0; j < res1.length; j++) {
                    if (i == res1[j].level) {
                        re = false
                        let sql2 = `update  userworkinfo set userwork = '${params.work[i]}' where level='${i}' and userid='${params.name}'`
                        await sqlutil.query(sql2)
                        break
                    }
                }
                if (re) {
                    let sql3 = ` insert  userworkinfo(userid,userwork,level) values( '${params.name}','${params.work[i]}','${i}' )`
                    await sqlutil.query(sql3)
                }
            }
        } catch (error) {
            res = {
                code: 'error',
                message: error.message
            }
        }
        return res
    },

    getuser: function(openid) {
        return 'get'
    },
    deluser: function(openid) {
        return '删除'
    }
}