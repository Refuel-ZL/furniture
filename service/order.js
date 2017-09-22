"use strict"
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-23 10:58:12 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-12 17:03:30
 */
const logUtil = require("../models/log4js/log_utils")
const _ = require("lodash")
var configutil = require("./config")
const sqlutil = require("../models/mysql/util")

var moment = require("moment-timezone")
moment.tz.setDefault("Asia/Shanghai")


var fun = {
    /**
     * 编号最近一次的工序信息
     */
    fetchprostatus: async function(proid) {
        var res = {
            code: "ok"
        }
        if (!proid) {
            return {
                code: "error",
                message: "编号为空"
            }
        }
        try {
            var sql1 = `SELECT COUNT(*)as num FROM workrecord AS wrd INNER JOIN workstageinfo AS wsi ON wrd.workstageid = wsi.id WHERE wsi.orderinfo="${proid}"`
            var res1 = await sqlutil.query(sql1)
            if (res1[0].num > 0) {
                var sql2 = `SELECT
                    oif.pid,
                    oif.status,
                    wsi.orderinfo,
                    wrd.userid,
                    wsi.workstage,
                    wsi.id,
                    DATE_FORMAT( wrd.recordtime, "%Y-%m-%d %H:%i:%s") as recordtime,
                    wrd.kind,
                    wsi.index,
                CASE
                    WHEN wsi.index + 1 > ( SELECT MAX( wsi.index ) FROM workstageinfo AS wsi WHERE wsi.orderinfo = "${proid}" ) THEN
                    "ok" ELSE ( SELECT s.workstage FROM workstageinfo AS s WHERE s.index = wsi.index + 1 AND s.orderinfo = "${proid}" ) 
                    END AS next,
                    ( SELECT id FROM workstageinfo AS s WHERE s.orderinfo = "${proid}" AND s.INDEX = wsi.INDEX+1) as nextindex
                FROM
                    orderinfo AS oif
                    LEFT JOIN workstageinfo AS wsi ON wsi.orderinfo = oif.pid
                    LEFT JOIN workrecord AS wrd ON wrd.workstageid = wsi.id 
                WHERE
                    wsi.orderinfo = "${proid}" 
                    AND (
                    SELECT
                        max( wsi.index ) AS m 
                    FROM
                        workrecord AS wrd
                        LEFT JOIN workstageinfo AS wsi ON wrd.workstageid = wsi.id 
                    WHERE
                    wsi.orderinfo = "${proid}" 
                ) = wsi.index`
                res.data = await sqlutil.query(sql2)
            } else {
                let sql3 = `SELECT
                    0 "index" ,
                    null workstage,
                    wsi.workstage as next,
                    odif.pid,
                    wsi.orderinfo,
                    wrd.userid,
                    DATE_FORMAT( wrd.recordtime, "%Y-%m-%d %H:%i:%s") as recordtime,
                    wrd.kind,
                    odif.status,
                    (SELECT id FROM workstageinfo AS s WHERE s.orderinfo = "${proid}" AND s.INDEX =1)as nextindex
                    FROM
                    workstageinfo AS wsi
                    left JOIN workrecord AS wrd ON wrd.workstageid = wsi.id
                    LEFT JOIN orderinfo as odif on  wsi.orderinfo=odif.pid
                    WHERE wsi.orderinfo="${proid}" AND  wsi.index=1`
                res.data = await sqlutil.query(sql3)
            }
        } catch (error) {
            res = {
                code: "error",
                message: error.message
            }
            logUtil.writeErr(`获取${proid}最近一道工序异常：`, JSON.stringify(error))
        }
        console.log(res.data)
        return res

    },

    /**
     * 产品记录查询
     */
    fetchprolog: async function(params) {
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
                if (params.pid) {
                    valsql += ` and odi.pid ="${params.pid}" `
                }
                if (params.search) {
                    valsql += ` and concat_ws(" " ,odi.pid,odi.regtime,odi.status,	odi.category,wsi.index,	wsi.workstage,IFNULL( wcd.userid, "" ),IFNULL( wcd.recordtime, "" ),IFNULL( wcd.kind, "" ) ) like "%${params.search}%"`
                }
                let page = ""
                if (params.limit) {
                    page = `LIMIT  ${params.offset}, ${params.limit}`
                }
                let sql1 = `SELECT 	odi.pid,DATE_FORMAT( odi.regtime, "%Y-%m-%d %H:%i:%s") as regtime,odi.status,	odi.category,wsi.index,	wsi.workstage,wcd.userid,DATE_FORMAT(wcd.recordtime, "%Y-%m-%d %H:%i:%s") as recordtime,wcd.kind FROM orderinfo AS odi	LEFT JOIN workstageinfo AS wsi ON wsi.orderinfo = odi.pid	LEFT JOIN workrecord AS wcd ON wcd.workstageid = wsi.id ${valsql} order by odi.pid,wsi.${params.sortName} ${params.sortOrder}  ${page}`
                let val = await sqlutil.query(sql1)
                let sql2 = `SELECT COUNT(*) as num FROM orderinfo AS odi LEFT JOIN workstageinfo AS wsi ON wsi.orderinfo = odi.pid	LEFT JOIN workrecord AS wcd ON wcd.workstageid = wsi.id ${valsql} ORDER BY odi.pid,wsi.index,wcd.recordtime`
                let num = await sqlutil.query(sql2)
                res.data = val
                res.total = num[0].num
            } catch (error) {
                res = {
                    code: "error",
                    message: error.message
                }
                logUtil.writeErr("拉取产品记录异常：" + JSON.stringify(error))
            }
        }
        return res
    },
    /**
     * 查询所有订单
     */
    fetchproall: async function(params) {
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
                if (params.search) {
                    valsql += ` and concat_ws(" " ,oif.pid,oif.regtime,IFNULL( oif.category, "" ),IFNULL(oif.status, "" ) ) like "%${params.search}%"`
                }
                let page = ""
                if (params.limit) {
                    page = `LIMIT  ${params.offset}, ${params.limit}`
                }
                let sql1 = `SELECT  oif.pid,DATE_FORMAT( oif.regtime, "%Y-%m-%d %H:%i:%s") as regtime,oif.status,oif.category FROM orderinfo AS oif ${valsql} order by oif.${params.sortName} ${params.sortOrder} ${page} `

                let val = await sqlutil.query(sql1)
                let sql2 = `SELECT COUNT(*) as num FROM orderinfo AS oif ${valsql} order by oif.${params.sortName} ${params.sortOrder} `

                let num = await sqlutil.query(sql2)
                res = {
                    code: "ok",
                    data: val,
                    total: num[0].num,
                }
            } catch (error) {
                res = {
                    code: "error",
                    message: error.message
                }
                logUtil.writeErr("拉取所有订单异常：" + JSON.stringify(error))
            }

        }
        return res
    },

    /**配置的生产线
     * 
     */
    fetchbeltlineitem: async function() {
        var conf = await configutil.getconf()
        var data = {}
        if (conf) {
            data = conf.beltline
        }
        return data
    },
    /**
     * 核对产品编号是否可用
     */
    verifyPid: async function(pid) {
        if (!pid) return false
        let sql1 = "SELECT orderinfo.pid FROM orderinfo WHERE orderinfo.pid=?"
        try {
            let res1 = await sqlutil.query(sql1, [pid])
            if (res1.length <= 0) {
                return true
            } else {
                return false
            }
        } catch (error) {
            logUtil.writeErr("核对产品编号异常", error.message)
            return false
        }
    },
    /**
     * 提交录入订单
     */
    submit: async function(params) {
        var res = {
            code: "ok"
        }

        if (!params) {
            res = {
                code: "error",
                message: "参数错误！"
            }
        } else if (!await this.verifyPid(params.Pid)) {
            res = {
                code: "error",
                message: `${params.Pid}已存在`
            }
        } else if (!(params.Position in await configutil.getconf().beltline)) {
            res = {
                code: "error",
                message: `${params.Position}不存在`
            }
        } else {
            let workitem = _.keys(await configutil.getconf().beltline[params.Position])

            var sqls = []
            let time = moment().format("YYYY-MM-DD HH:mm:ss")
            let sql1 = {
                sql: "INSERT INTO orderinfo (pid, regtime,status,category) VALUES (?,?,?,?)",
                param: [params.Pid, time, 0, params.Position]
            }
            sqls.push(sql1)

            let _params = []
            let sql2 = {
                sql: "INSERT INTO workstageinfo (workstage, orderinfo,workstageinfo.index) VALUES (?,?,?)",
                param: _params
            }
            for (var i = 1; i <= workitem.length; i++) {
                var n = i - 1
                _params.push(workitem[n], params.Pid, i.toString())
                if (i < workitem.length) {
                    sql2.sql += ",(?,?,?)"
                }
            }
            sql2.param = _params
            sqls.push(sql2)
            try {
                await sqlutil.sqlaffair(sqls)
                res.Pid = params.Pid
            } catch (error) {
                res = {
                    code: "error",
                    message: `录入订单错误${error.message}`
                }
                logUtil.writeErr("录入订单异常：" + JSON.stringify(error))

            }
        }
        return res
    },
    /**
     * 更新录入订单
     */
    updateorder: async function(params) {
        var res = {
            code: "ok"
        }
        if (!params) {
            res = {
                code: "error",
                message: "参数错误"
            }
        }
        let sql1 = "update orderinfo set regtime= ?,status=?, category=? where pid= ?"
        try {
            await sqlutil.query(sql1, [params.regtime, params.status, params.category, params.pid])
        } catch (error) {
            res = {
                code: "error",
                message: error.message
            }
            logUtil.writeErr("更新录入订单异常：" + JSON.stringify(error))

        }
        return res
    },
    /**更新订单状态 */
    updateorderstatus: async function(params) {
        var res = {
            code: "ok"
        }
        if (!params) {
            res = {
                code: "error",
                message: "参数错误"
            }
        }
        let sql1 = "update orderinfo set status=? where pid= ?"
        try {
            await sqlutil.query(sql1, [params.status, params.pid])
        } catch (error) {
            res = {
                code: "error",
                message: `改变订单状态异常：${JSON.stringify(error.message)}`
            }
            logUtil.writeErr(`改变${params.pid}订单状态异常：` + JSON.stringify(error))

        }
        return res
    },
    /**
     * 核对工序是不是最后一道
     */
    finallywork: async function(pid, workid) {
        try {
            let sql1 = "SELECT wif.id,wif.workstage,wif.orderinfo,wif.index as num FROM workstageinfo AS wif WHERE wif.orderinfo=? order by wif.index DESC  limit 1;"
            let res1 = await sqlutil.query(sql1, [pid])
            if (res1[0].id == workid) {
                return true
            }
        } catch (error) {
            logUtil.writeErr(`核对是否最后工序异常：` + JSON.stringify(error))
        }
        return false
    },
    /**
     * 核对提交的工序是否有效
     * 
     */
    fetchorderusableswork: async function(pid, work, workid) {
        var res = await this.fetchprostatus(pid)
        if (res.code == "ok") {
            res = res.data
            if ((res[0].id == workid || res[0].nextindex == workid) && (res[0].next == work || res[0].workstage == work)) {
                return true
            } else {
                return false
            }
        } else {
            return false
        }
    },

    /**
     *返回所有订单基本信息的数组
     */
    fetchpidlist: async function() {
        let sql = "SELECT oif.pid,oif.status,oif.category,DATE_FORMAT( oif.regtime, \"%Y-%m-%d %H:%i:%s\") as regtime FROM orderinfo AS oif"
        let res1 = await sqlutil.query(sql)
        return res1
    },

    /**
     *删除订单 
     */
    deletorder: async function(list) {
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
                let sql = `DELETE FROM orderinfo WHERE pid in ('${list.join("','")}')`
                let res1 = await sqlutil.query(sql)
            } catch (error) {
                res = {
                    code: "error",
                    message: error.message
                }
            }
        }
        return res
    }
}

exports = module.exports = fun