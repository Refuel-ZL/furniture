"use strict"
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-23 10:58:12 
 * @Last Modified by: mikey.zhaopeng
 * @Last Modified time: 2017-10-26 16:54:01
 */
const logUtil = require("../models/log4js/log_utils")
var userutil = require("./user")
const sqlutil = require("../models/mysql/util")
var orderutil = require("./order")
var moment = require("moment-timezone")
moment.tz.setDefault("Asia/Shanghai")

var fun = {
    /**
     * 该二维码对象的信息
     */
    scaninfo: async function (param) {
        var res = {
            code: "ok"
        }
        try {
            //查询当前用户的身份
            let userinfo = await userutil.fetchname(param.openid)
            if (userinfo.code == "error") {
                res = {
                    code: "error",
                    message: userinfo.message
                }
            } else {
                let st = await orderutil.fetchprostatus(param.itemno)
                if (st.code == "ok") {
                    res.data = {
                        name: userinfo.data.name,
                        id: st.data[0].id, //工序表id
                        partstate: st.data[0].partstate,
                        parttime: st.data[0].parttime,
                        partuser: st.data[0].partuser,
                        nextindex: st.data[0].nextindex, //工序表下一工序的id
                        orderutilinfo: st.data[0].orderutilinfo, //型号
                        workstage: st.data[0].workstage || "", //最近一个完成的工序
                        index: st.data[0].index, //完成工序的序号
                        next: st.data[0].next, //将要提交的工序
                        status: st.data[0].status, //订单状态
                        details: st.data,
                        category: st.data[0].category,
                        customer: st.data[0].customer,
                        endcustomer: st.data[0].endcustomer,
                    }
                } else {
                    res = {
                        code: "error",
                        message: st.message
                    }
                }
            }
        } catch (error) {
            res = {
                code: "error",
                message: error.message
            }
            logUtil.writeErr("拉取扫描订单信息异常", JSON.stringify(error))
        }
        return res
    },
    /**
     * @param {*}
     * 写操作记录
     */
    recordwork: async function (params) {
        logUtil.writeInfo("提交操作记录：" + JSON.stringify(params))
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
                let sql1 = "SELECT wrd.userid,wrd.workstageid,wrd.recordtime FROM workrecord AS wrd WHERE wrd.userid=? AND wrd.workstageid=?"
                let val = await sqlutil.query(sql1, [params.name, params.id])
                if (val.length > 0) {
                    res = {
                        code: "error",
                        message: "请勿重新提交"
                    }
                } else {
                    var item = await orderutil.fetchorderusableswork(params.no, params.work, params.id)
                    if (item) { //是否是当前订单的合法工序
                        let time = moment().format("YYYY-MM-DD HH:mm:ss")
                        // let sql2 = "INSERT INTO workrecord (userid,workstageid,recordtime,kind) VALUES (?,?,?,?)"
                        // let option = [
                        //     params.name, params.id, time, params.kind
                        // ]
                        // sqlutil.query(sql2, option)
                        var sql = []
                        let sql2 = {
                            "sql": "INSERT INTO workrecord (userid,workstageid,recordtime,kind) VALUES (?,?,?,?)",
                            "param": [params.name, params.id, time, params.kind]
                        }
                        let sql3 = {
                            "sql": "UPDATE workstageinfo SET num =num+1 WHERE id=?",
                            "param": [params.id]
                        }
                        sql.push(sql2)
                        sql.push(sql3)
                        await sqlutil.sqlaffair(sql)
                        if (await orderutil.finallywork(params.no, params.id)) { //最后一道程序改变订单状态
                            let res3 = await orderutil.updateorderstatus({
                                status: "1",
                                pid: params.no
                            })
                            if (res3.code == "error") {
                                res = {
                                    code: "error",
                                    message: res3.message
                                }
                            }
                        }
                    } else {
                        res = {
                            code: "error",
                            message: "提交的工序非法"
                        }
                    }
                }
            } catch (error) {
                res = {
                    code: "error",
                    message: error.message
                }
                logUtil.writeErr("提交工作记录异常：", JSON.stringify(error))

            }
        }
        return res
    },
    /**
     * @param {*}
     * 写配件的操作记录
     */
    recordwork_: async function (params) {
        logUtil.writeInfo("提交操作记录：" + JSON.stringify(params))
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
                let sql1 = 'SELECT * FROM orderinfo AS oif where  oif.parttime is NOT null AND oif.partuser is NOT null AND oif.partstate="1" AND oif.pid=?'
                let val = await sqlutil.query(sql1, [params.no])
                if (val.length > 0) {
                    res = {
                        code: "error",
                        message: "请勿重新提交"
                    }
                } else {
                    let sql2 = "UPDATE orderinfo SET partuser =?,parttime=? WHERE  partstate='1' AND pid=?"
                    await sqlutil.query(sql2, [params.openid, moment().format("YYYY-MM-DD HH:mm:ss"), params.no])
                }
            } catch (error) {
                res = {
                    code: "error",
                    message: error.message
                }
                logUtil.writeErr("提交配件工作记录异常：", JSON.stringify(error))
            }
        }
        return res
    }


}



exports = module.exports = fun