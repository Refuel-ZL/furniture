'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-23 10:58:12 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-08 19:07:37
 */
const logUtil = require('../models/log4js/log_utils')
const Promise = require('bluebird')
const _ = require('lodash')
var userutil = require('./user')
const sqlutil = require('../models/mysql/util')

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
                let st = await this.fetchprostatus(param.itemno)
                if (st.code == 'ok') {
                    res.data = {
                        name: userinfo.data.name,
                        id: st.data[0].id, //工序表id
                        nextindex: st.data[0].nextindex, //工序表下一工序的id
                        orderinfo: st.data[0].orderinfo, //型号
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
     * 编号最近一次的工序信息
     */
    fetchprostatus: async function(proid) {
        var res = {
            code: 'ok'
        }
        if (!proid) {
            return {
                code: 'error',
                message: '编号为空'
            }
        }
        try {
            var sql1 = `SELECT COUNT(*)as num FROM workrecord AS wrd INNER JOIN workstageinfo AS wsi ON wrd.workstageid = wsi.id WHERE wsi.orderinfo='${proid}'`
            var res1 = await sqlutil.query(sql1)
            if (res1[0].num > 0) {
                var sql2 = `SELECT
                    oif.pid,
                    oif.status,
                    wsi.orderinfo,
                    wrd.userid,
                    wsi.workstage,
                    wsi.id,
                    DATE_FORMAT( wrd.recordtime, '%Y-%m-%d %H:%i:%s') as recordtime,
                    wrd.kind,
                    wsi.index,
                CASE
                    WHEN wsi.index + 1 > ( SELECT MAX( wsi.index ) FROM workstageinfo AS wsi WHERE wsi.orderinfo = '${proid}' ) THEN
                    'ok' ELSE ( SELECT s.workstage FROM workstageinfo AS s WHERE s.index = wsi.index + 1 AND s.orderinfo = '${proid}' ) 
                    END AS next,
                    ( SELECT id FROM workstageinfo AS s WHERE s.orderinfo = '${proid}' AND s.INDEX = wsi.INDEX+1) as nextindex
                FROM
                    orderinfo AS oif
                    LEFT JOIN workstageinfo AS wsi ON wsi.orderinfo = oif.pid
                    LEFT JOIN workrecord AS wrd ON wrd.workstageid = wsi.id 
                WHERE
                    wsi.orderinfo = '${proid}' 
                    AND (
                    SELECT
                        max( wsi.index ) AS m 
                    FROM
                        workrecord AS wrd
                        LEFT JOIN workstageinfo AS wsi ON wrd.workstageid = wsi.id 
                    WHERE
                    wsi.orderinfo = '${proid}' 
                ) = wsi.index`
                res.data = await sqlutil.query(sql2)
            } else {
                let sql3 = `SELECT
                    0 'index' ,
                    null workstage,
                    wsi.workstage as next,
                    odif.pid,
                    wsi.orderinfo,
                    wrd.userid,
                    DATE_FORMAT( wrd.recordtime, '%Y-%m-%d %H:%i:%s') as recordtime,
                    wrd.kind,
                    odif.status,
                    (SELECT id FROM workstageinfo AS s WHERE s.orderinfo = '${proid}' AND s.INDEX =0)as nextindex
                    FROM
                    workstageinfo AS wsi
                    left JOIN workrecord AS wrd ON wrd.workstageid = wsi.id
                    LEFT JOIN orderinfo as odif on  wsi.orderinfo=odif.pid
                    WHERE wsi.orderinfo='${proid}' AND  wsi.index=0`
                res.data = await sqlutil.query(sql3)
            }
        } catch (error) {
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
            // userid,workstageid,recordtime,kind
            try {
                let sql1 = 'SELECT wrd.userid,wrd.workstageid,wrd.recordtime FROM workrecord AS wrd WHERE wrd.userid=? AND wrd.workstageid=?'
                let val = await sqlutil.query(sql1, [params.name, params.id])
                if (val.length > 0) {
                    res = {
                        code: 'error',
                        message: '请勿重新提交'
                    }
                } else {
                    let time = moment().format('YYYY-MM-DD HH:mm:ss')
                    let sql2 = `INSERT INTO workrecord (userid,workstageid,recordtime,kind) VALUES (?,?,?,?)`
                    let option = [
                        params.name, params.id, time, params.kind
                    ]
                    try {
                        let val = sqlutil.query(sql2, option)
                    } catch (error) {
                        res = {
                            code: 'error',
                            message: error.message
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
    },
    fetchprolog: async function(params) {
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
                var valsql = 'WHERE 1=1'
                if (params.pid) {
                    valsql += ` and odi.pid ='${params.pid}' `
                }
                if (params.search) {
                    valsql += ` and concat(odi.pid,odi.regtime,odi.status,	odi.category,wsi.index,	wsi.workstage,wcd.userid,wcd.recordtime,wcd.kind ) like '%${params.search}%'`
                }
                let sql1 = `SELECT 	odi.pid,DATE_FORMAT( odi.regtime, '%Y-%m-%d %H:%i:%s') as regtime,odi.status,	odi.category,wsi.index,	wsi.workstage,wcd.userid,DATE_FORMAT(wcd.recordtime, '%Y-%m-%d %H:%i:%s') as recordtime,wcd.kind FROM orderinfo AS odi	LEFT JOIN workstageinfo AS wsi ON wsi.orderinfo = odi.pid	LEFT JOIN workrecord AS wcd ON wcd.workstageid = wsi.id ${valsql} ORDER BY odi.pid,wsi.index,wcd.recordtime  LIMIT ?,?`
                let val = await sqlutil.query(sql1, [params.offset, params.limit])
                res.data = val
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