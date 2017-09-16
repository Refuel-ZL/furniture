'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-23 10:58:12 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-12 17:07:11
 */
const logUtil = require('../models/log4js/log_utils')
var userutil = require('./user')
const sqlutil = require('../models/mysql/util')
var orderutil = require('./order')
var moment = require('moment-timezone')
moment.tz.setDefault('Asia/Shanghai')

var fun = {
    scaninfo: async function(param) {
        var res = {
            code: 'ok'
        }
        try {
            //查询当前用户的身份
            let userinfo = await userutil.fetchname(param.openid)
            if (userinfo.code == 'error') {
                res = {
                    code: 'error',
                    message: userinfo.message
                }
            } else {
                let st = await orderutil.fetchprostatus(param.itemno)
                if (st.code == 'ok') {
                    res.data = {
                        name: userinfo.data.name,
                        id: st.data[0].id, //工序表id
                        nextindex: st.data[0].nextindex, //工序表下一工序的id
                        orderutilinfo: st.data[0].orderutilinfo, //型号
                        workstage: st.data[0].workstage || '', //最近一个完成的工序
                        next: st.data[0].next, //将要提交的工序
                        status: st.data[0].status, //订单状态
                        details: st.data
                    }
                } else {
                    res = {
                        code: 'error',
                        message: st.message
                    }
                }
            }
        } catch (error) {
            logUtil.writeErr('提交工作异常', JSON.stringify(error))
            res = {
                code: 'error',
                message: error.message
            }
        }
        return res
    },
    /**
     * @param {*}
     * 写操作记录
     */
    recordwork: async function(params) {
        var res = {
            code: 'ok'
        }
        if (!params) {
            res = {
                code: 'error',
                message: '参数错误'
            }
        } else {
            try {
                let sql1 = 'SELECT wrd.userid,wrd.workstageid,wrd.recordtime FROM workrecord AS wrd WHERE wrd.userid=? AND wrd.workstageid=?'
                let val = await sqlutil.query(sql1, [params.name, params.id])
                if (val.length > 0) {
                    res = {
                        code: 'error',
                        message: '请勿重新提交'
                    }
                } else {
                    var item = await orderutil.fetchorderusableswork(params.no, params.work, params.id)
                    if (item) { //是否是当前订单的适合工序
                        let time = moment().format('YYYY-MM-DD HH:mm:ss')
                        let sql2 = 'INSERT INTO workrecord (userid,workstageid,recordtime,kind) VALUES (?,?,?,?)'
                        let option = [
                            params.name, params.id, time, params.kind
                        ]
                        sqlutil.query(sql2, option)
                        if (await orderutil.finallywork(params.no, params.id)) { //最后一道程序改变订单状态
                            let res3 = await orderutil.updateorderstatus({
                                status: '1',
                                pid: params.no
                            })
                            if (res3.code == 'error') {
                                res = {
                                    code: 'error',
                                    message: res3.message
                                }
                            }
                        }
                    } else {
                        res = {
                            code: 'error',
                            message: '提交的工序非法'
                        }
                    }
                }
            } catch (error) {
                res = {
                    code: 'error',
                    message: error.message
                }
            }
        }
        return res
    }



}



exports = module.exports = fun