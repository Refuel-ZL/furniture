'use strict'
/*
 * @Author: ZhaoLei 
 * @Date: 2017-08-23 10:58:12 
 * @Last Modified by: ZhaoLei
 * @Last Modified time: 2017-09-01 16:10:44
 */
const consql = require('../models/sqlite/util')
const logUtil = require('../models/log4js/log_utils')
var config = require('./config')
const async = require('async')
const Promise = require('bluebird')
const util = require('util')


var moment = require('moment-timezone')
moment.tz.setDefault('Asia/Shanghai')


exports = module.exports = {
    submit: async function(param) {
        try {
            //查询当前用户的身份
            let res1 = await getuserinfo(param.openid)
                // console.dir(res1)
            if (res1.length <= 0) {
                return '很抱歉，您身份信息没有录入系统'
            }
            var _beltline = JSON.parse(await config())['beltline']
                //查看此编号的产品状态
            let res2 = await getproductinfo(param.itemno)
            if (res2.length <= 0) { //新产品编号
                if (res1[0].work_kind != 0) {
                    return '很抱歉此环节，您无权限提交'
                }
                //依据用户身份分配生产线
                let beltline = res1[0].beltline
                if (_beltline) {
                    var steps = _beltline[beltline]['I'] //默认分支 
                    let param_ = {
                        itemno: param.itemno,
                        openid: param.openid,
                        beltline: beltline,
                        step: Object.keys(steps)[0],
                        state: 0,
                    }
                    setproduct(param_)
                    return `恭喜您对【${param.itemno}】订单，完成${param_.step}工序`
                } else {
                    return '依据用户身份分配生产线错误！请核对用户身份信息'
                }
            } else { /*** 产品流程 */
                let steps = _beltline[res2[0].beltline]['I'] //该生产线的工序
                var procedure = Object.keys(steps) //工序数组
                let step = procedure.indexOf(res2[0].step) //当前工序的位置
                if (step >= 0) {
                    if (res1[0].work_kind > procedure.length - 1) {
                        return '请注意您的身份信息不符此条生产线'
                    }
                    if (res1[0].work_kind == step + 1) { //本次工序 核对用户权限
                        let state = 0
                        if (res1[0].work_kind == procedure.length - 1) {
                            state = 1
                        }
                        step = procedure[step + 1]
                        let param_ = {
                            itemno: param.itemno, //编号
                            step: step, //工序名
                            state: state, //状态
                            openid: param.openid, //用户id
                        }
                        upproductlog(param_)
                        return `恭喜您对【${param.itemno}】订单，完成${step}工序`

                    } else {
                        return '很抱歉此环节，您无权限提交'
                    }
                } else {
                    return '数据库记录和生产线工序配置不符'
                }
            }
        } catch (error) {
            console.dir(error)
            logUtil.writeErr('提交工作异常', JSON.stringify(error))
            return '错误'
        }
    },
    getlog: async function(idlist, item) {
        // let sql1 = 'UPDATE product SET step = $step,state=$state where item_no = $itemno'
        var res = ''
        try {
            res = await getidlog(idlist, item)
        } catch (error) {
            console.dir(error)
            res = ''
        }

        return res
    }
}

async function getidlog(idlist, item) {
    var res = {
        row: idlist.length,
        data: {}

    }
    let sql1 = 'SELECT  pl.item_no,pl.time, pl.USER, pl.action, pl.STATUS  FROM productlog AS pl  WHERE pl.item_no = $pid ORDER BY pl.id ASC'
    let sql2 = 'SELECT  p.item_no,p.beltline,p.step,p.next,p.state  FROM product AS p  WHERE p.item_no = $pid'

    for (var i = 0; i < idlist.length; i++) {
        let _idlist = {
            $pid: idlist[i]
        }
        try {
            if (item === 'process') {
                let process = await consql.select(sql1, _idlist)
                res.data[idlist[i]] = {
                    process: process,
                }
            } else if (item === 'actuality') {
                let actuality = await consql.select(sql2, _idlist)
                res.data[idlist[i]] = {
                    actuality: actuality
                }
            } else {
                let process = await consql.select(sql1, _idlist)
                let actuality = await consql.select(sql2, _idlist)
                res.data[idlist[i]] = {
                    process: process,
                    actuality: actuality
                }
            }
        } catch (error) {
            console.dir(error)
            res.data[idlist[i]] = {
                process: '',
                actuality: ''
            }
        }

    }
    return res
}


function getuserinfo(openid) {
    return new Promise(function(resolve, reject) {
        try {
            let sql1 = 'SELECT * FROM user WHERE user.openid=$openid'
            var _param = {
                $openid: openid
            }
            let res = consql.select(sql1, _param)
            resolve(res)
        } catch (error) {
            reject(error)
        }
    })
}

function getproductinfo(itemno) {
    return new Promise(function(resolve, reject) {
        try {
            let sql1 = 'SELECT * FROM product WHERE product.item_no=$item_no'
            let _param = {
                $item_no: itemno
            }
            let res = consql.select(sql1, _param)
            resolve(res)
        } catch (error) {
            reject(error)
        }
    })
}

function setproduct(param) {
    return new Promise(function(resolve, reject) {
        try {
            let sql3 = 'INSERT INTO product(item_no,beltline,step,state) VALUES ($item_no,$beltline,$step,$state)'
            let param_ = {
                $item_no: param.itemno,
                $beltline: param.beltline,
                $step: param.step,
                $state: param.state
            }
            let res = consql.inser(sql3, param_)

            let sql4 = 'INSERT INTO productlog(item_no,time,user,action) VALUES ($item_no,$time,$user,$action)'
            let time = moment().format('YYYY-MM-DD HH:mm:ss')

            param_ = {
                $item_no: param.itemno,
                $time: time,
                $user: param.openid,
                $action: param.step,
            }
            res = consql.inser(sql4, param_)
            resolve(res)
        } catch (error) {
            reject(error)
        }


    })
}

function upproductlog(param) {
    return new Promise(function(resolve, reject) {
        try {
            let sql1 = 'UPDATE product SET step = $step,state=$state where item_no = $itemno'
            let _param = {
                $itemno: param.itemno,
                $step: param.step,
                $state: param.state
            }
            let res = consql.select(sql1, _param)
            let sql2 = 'INSERT INTO productlog(item_no,time,user,action) VALUES ($item_no,$time,$user,$action)'
            let time = moment().format('YYYY-MM-DD HH:mm:ss')
            _param = {
                $item_no: param.itemno,
                $time: time,
                $user: param.openid,
                $action: param.step,
            }
            res = consql.inser(sql2, _param)


            resolve(res)
        } catch (error) {
            reject(error)
        }
    })
}