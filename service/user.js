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
    /**
     * 登记账户
     */
    reguser: async function(param) {
        var res = {
            code: "ok"
        }
        console.log(param)
        var time = moment().format("YYYY-MM-DD HH:mm:ss")
        try {
            var sqls = []
            var sql1 = {
                sql: "INSERT INTO userinfo(userid,openid,usercreatetime,usermtime) VALUES (?,?,?,?)",
                param: [param.name, param.openid, time, time]
            }
            sqls.push(sql1)
            if (_.has(param, "work") && param.work.length > 0) {
                var sql2 = {
                    sql: "insert into userworkinfo(userid,userwork,level) VALUES (?,?,?)",
                    param: [param.name, param.work[0], 1]
                }
                for (var i = 1; i < param.work.length; i++) {
                    sql2.sql += ", (?,?,?)"
                    sql2.param.push(param.name, param.work[i], i + 1)
                }
                sqls.push(sql2)
            }
            await sqlutil.sqlaffair(sqls)
        } catch (error) {
            res = {
                code: "error",
                message: error.message
            }
            logUtil.writeErr(`录入用户【${param.openid}】异常`, error)
        }
        return res
    },
    /**
     * 核对openid 是否可用
     */
    verifyid: async function(id) {
        let sql1 = `SELECT openid FROM userinfo WHERE userinfo.openid="${id}"`
        try {
            let res1 = await sqlutil.query(sql1)
            if (res1.length <= 0) {
                return true
            } else {
                return false
            }
        } catch (error) {
            logUtil.writeErr("校验Openid异常", error.message)
            return false
        }

    },
    /**
     * 核对name 是否可用
     */
    verifyname: async function(name) {
        if (!name) return false
        let sql1 = `SELECT userid FROM userinfo WHERE userinfo.userid="${name}"`
        try {
            let res1 = await sqlutil.query(sql1)
            if (res1.length <= 0) {
                return true
            } else {
                return false
            }
        } catch (error) {
            logUtil.writeErr("校验用户名异常", error.message)
            return false
        }

    },

    /**
     * 依据id 匹配用户名
     */
    fetchname: async function(openid) {
        var res = {
            code: "ok"
        }
        let sql1 = "SELECT userid FROM userinfo WHERE userinfo.openid=?"
        try {
            let res1 = await sqlutil.query(sql1, [openid])
            if (res1.length <= 0) {
                res.code = "error"
                res.message = "用户不存在"
            } else {
                res.data = {
                    openid: openid,
                    name: res1[0].userid
                }
            }
        } catch (error) {
            logUtil.writeErr("依据openid拉取用户名异常", error.message)
            res.code = "error"
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
            code: "ok"
        }
        try {
            let sql1 = `SELECT ui.userid, ui.openid,uwi.userwork ,uwi.level FROM  userinfo AS ui LEFT JOIN  userworkinfo AS uwi ON uwi.userid = ui.userid WHERE ui.openid="${openid}"`
            let data = await sqlutil.query(sql1)
            if (data.length <= 0) {
                res = {
                    code: "error",
                    message: "此用户未获取默认工序或尚未登记"
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
            logUtil.writeErr(`拉取${openid}用户默认工序异常`, error.message)
            res.code = "error"
            res.message = `拉取${openid}用户默认工序异常`
        }
        return res
    },

    /**
     * 获取所有用户所有工序
     *
     */
    fetchwork: async function(params) {
        var res = {
            code: "ok"
        }
        try {
            var search = ""
            if (params.search) {
                search = `where concat(IFNULL( uwi.userid, "" ),IFNULL( uwi.userwork, "" ),IFNULL( uwi.level, "" )) like "%${params.search}%" `
            }
            var page = ""
            if (params.limit) {
                page = `LIMIT ${params.offset}, ${params.limit}`
            }
            let sql1 = `select  ui.userid,max(case when  uwi.level="1"  then uwi.userwork else "" end) as "1",max(case when   uwi.level ="2" then  uwi.userwork else "" end)  as "2",max(case when   uwi.level ="3" then  uwi.userwork else "" end)  as "3" ,ui.openid,ui.usercreatetime,ui.usermtime from userinfo AS ui LEFT JOIN  userworkinfo AS uwi ON uwi.userid = ui.userid ${search} group by ui.userid,ui.openid,ui.usercreatetime,	ui.usermtime ${page}`
            let data = await sqlutil.query(sql1)

            let sql2 = `SELECT COUNT(*)as num FROM (select  ui.userid,max(case when  uwi.level="1"  then uwi.userwork else "" end) as "1",max(case when   uwi.level ="2" then  uwi.userwork else "" end)  as "2",max(case when   uwi.level ="3" then  uwi.userwork else "" end)  as "3" ,ui.openid,ui.usercreatetime,ui.usermtime from userinfo AS ui LEFT JOIN  userworkinfo AS uwi ON uwi.userid = ui.userid ${search} group by ui.userid,ui.openid,ui.usercreatetime,	ui.usermtime)as table1`
            let num = await sqlutil.query(sql2)
            res.rows = data
            res.total = num[0].num
        } catch (error) {
            console.dir(error)
            res = {
                code: "error",
                message: error.message
            }
            logUtil.writeErr("拉取用户管理数据异常", JSON.stringify(error))
        }
        return res
    },

    /**
     * 更新用户信息
     */
    updateuserinfo: async function(params) {

        var res = {
            code: "ok"
        }
        if (!params.Name || !params.Openid) {
            return {
                code: "error",
                message: "参数不完整"
            }
        }
        try {
            var time = moment().format("YYYY-MM-DD HH:mm:ss")
            let sql1 = `update userinfo set userid='${params.Name}',usermtime='${time}' where openid='${params.Openid}'`
            await sqlutil.query(sql1)
        } catch (error) {
            res = {
                code: "error",
                message: error.message
            }
            logUtil.writeErr("更新用户信息失败：", JSON.stringify(error))
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
            code: "ok"
        }
        var time = moment().format("YYYY-MM-DD HH:mm:ss")
        try {
            // let val = _.keys(params.work)
            // if (val == null || val.length == 0) {
            //     let sql1 = `delete from userworkinfo where userid =${params.name}`
            //     await sqlutil.query(sql1)                
            // } else {
            //     val = "\"" + val.join("\",\"") + "\""
            //     let sql1 = `select level from userworkinfo where userid="${params.name}" and level in(${val})`
            //     let res1 = await sqlutil.query(sql1)
            //     for (var i in params.work) {
            //         let re = true
            //         for (var j = 0; j < res1.length; j++) {
            //             if (i == res1[j].level) {
            //                 re = false
            //                 let sql2 = `update  userworkinfo set userwork = "${params.work[i]}" where level="${i}" and userid="${params.name}"`
            //                 await sqlutil.query(sql2)
            //                 break
            //             }
            //         }
            //         if (re) {
            //             let sql3 = ` insert userworkinfo(userid,userwork,level) values( "${params.name}","${params.work[i]}","${i}" )`
            //             await sqlutil.query(sql3)
            //         }
            //     }
            // }
            var sql = []
            sql.push({
                sql: "delete from userworkinfo where userid =?",
                param: [params.name]
            })
            for (var work in params.work) {
                sql.push({
                    sql: "insert userworkinfo(userid,userwork,level) values(?,?,? ) ",
                    param: [params.name, params.work[work], work]
                })
            }
            sql.push({
                sql: "update userinfo set usermtime = ? where userid=? ",
                param: [time, params.name]
            })
            await sqlutil.sqlaffair(sql)
        } catch (error) {
            res = {
                code: "error",
                message: error.message
            }
            logUtil.writeErr("更新用户默认工序异常：", JSON.stringify(error))
        }
        return res
    },
    /**
     * 根据用户名删除指定用户（数组）
     */
    deletuser: async function(list) {
        var res = {
            code: "ok"
        }
        if (!list) {
            res = {
                code: "error",
                message: "参数错误"
            }
        } else {
            try {
                let sql = `DELETE FROM userinfo WHERE userid in ('${list.join("','")}')`
                let res1 = await sqlutil.query(sql)
            } catch (error) {
                res = {
                    code: "error",
                    message: error.message
                }
            }
        }
        return res
    },
    fetchuserlist: async function() {
        let sql = "SELECT uif.userid,  uif.openid,  uif.usercreatetime,  uif.usermtime  FROM  userinfo AS uif"
        let res1 = await sqlutil.query(sql)
        return res1
    },
    fetchuserlog: async function(params) {
        var res = {
            code: "ok"
        }
        if (!params) {
            res = {
                code: "error",
                message: "参数错误"
            }
        } else {
            try {
                var valsql = "WHERE 1=1"
                if (params.userid) {
                    valsql += ` and wcd.userid ="${params.userid}" `
                }
                if (params.search) {
                    valsql += ` and concat_ws(" " ,IFNULL( wcd.userid, "" ),IFNULL( wcd.workstageid, "" ),IFNULL( wcd.recordtime, "" ),IFNULL( wcd.kind, "" ),IFNULL( wif.workstage, "" ),IFNULL( wif.num, "" ),IFNULL(wif.orderinfo, "" ),IFNULL( oif.fromtime, "" ),IFNULL(oif.entertime, "" ),IFNULL(oif.status, "" ),IFNULL( oif.category, "" ),IFNULL( oif.customer, "" ),IFNULL( oif.endcustomer, "" ),IFNULL(wif.index, "",IFNULL( oif.id, "" ) ))  like %${params.search}%"`
                }
                if (params.starttime && params.endtime) {
                    valsql += ` AND  wcd.recordtime  BETWEEN '${params.starttime}' AND '${params.endtime}'`
                }
                if (params.category && params.category != "ALL") {
                    valsql += `and oif.category ="${params.category}" `
                }
                if (params.workstage && params.workstage != "ALL") {
                    valsql += `and wif.workstage = "${params.workstage}"`
                }

                let page = ""
                if (params.limit) {
                    page = `LIMIT  ${params.offset}, ${params.limit}`
                }
                let sql1 = `SELECT *,wcd.id FROM workrecord AS wcd LEFT JOIN workstageinfo AS wif ON wcd.workstageid = wif.id  LEFT JOIN orderinfo AS oif ON wif.orderinfo = oif.pid ${valsql} order by wcd.${params.sortName}, wcd.recordtime DESC  ${page}`
                let val = await sqlutil.query(sql1)
                let sql2 = `SELECT COUNT( * ) as num FROM workrecord AS wcd LEFT JOIN workstageinfo AS wif ON wcd.workstageid = wif.id LEFT JOIN orderinfo AS oif ON wif.orderinfo = oif.pid ${valsql} `
                let num = await sqlutil.query(sql2)
                res.data = val
                res.total = num[0].num
            } catch (error) {
                res = {
                    code: "error",
                    message: error.message
                }
                logUtil.writeErr("拉取员工记录异常：" + JSON.stringify(error))
            }
        }
        return res
    }
}