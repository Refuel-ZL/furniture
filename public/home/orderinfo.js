var filename = ""
$.get({
    url: '/order/beltline',
    success: function(data) {
        $.each(data.item, function(index, units) {
            $("#Position").append("<option value=" + units + ">" + units + "</option>")
        })
    },
    error: function(error) {
        swal("获取生产线失败", error.message, "error")
    },
    complete: function() {
        $("#Position").append("<option value= 'ALL'  selected = 'selected'>全部</option>")
    }
})
$.get({
    url: '/order/status',
    success: function(data) {
        $.each(data.data, function(index, units) {
            $("#status").append("<option value=" + units + ">" + index + "</option>")
        })
    },
    error: function(error) {
        swal("获取生产线失败", error.message, "error")
    },
    complete: function() {
        $("#status").append("<option value= 'ALL'  selected = 'selected'>全部</option>")
    }
})
$("#starttime").datetimepicker({
    format: "yyyy-mm-dd hh:ii:ss",
    language: 'zh-CN',
    weekStart: 1,
    todayBtn: 1,
    autoclose: 1,
    todayHighlight: 1,
    startView: 2,
    minView: 0,
    forceParse: 0
}).on("changeDate", function(ev) {
    var starttime = $("#starttime :text").val();
    $("#endtime").datetimepicker("setStartDate", starttime)
    $("#endtime").datetimepicker("setEndDate", moment().format("YYYY-MM-DD HH:mm:ss"));
})
$("#endtime").datetimepicker({
    format: "yyyy-mm-dd hh:ii:ss",
    language: 'zh-CN',
    weekStart: 1,
    todayBtn: 'linked',
    autoclose: 1,
    todayHighlight: 1,
    startView: 2,
    minView: 0,
    forceParse: 0
}).on("changeDate", function(ev) {
    var starttime = $("#starttime :text").val();
    var endtime = $("#endtime :text").val();
    $("#endtime").datetimepicker("setEndDate", moment().format("YYYY-MM-DD HH:mm:ss"));
    $("#starttime").datetimepicker("setEndDate", endtime)
})
$("#starttime :text").val(moment(1483200000000).format("YYYY-MM-DD HH:mm:ss"))
$("#endtime :text").val(moment().format("YYYY-MM-DD HH:mm:ss"))
$("#endtime").datetimepicker("setStartDate", $("#starttime :text").val());
$("#endtime").datetimepicker("setEndDate", moment().format("YYYY-MM-DD HH:mm:ss"));
$("#starttime").datetimepicker("setEndDate", moment().format("YYYY-MM-DD HH:mm:ss"));

filename = `订单管理${$("#starttime :text").val()}-${$("#endtime :text").val()}-${$("#Position").val() || "全部" } - ${$("#status").find("option:selected").text() || "全部"} `

$(function() {
    var tableconf = {
        classes: "table table-hover", //加载的样式
        url: "/order/data", //请求后台的URL（*）
        method: "get", //请求方式（*）
        toolbar: "#toolbar", //工具按钮用哪个容器
        singleSelect: true, //单选
        striped: true, //是否显示行间隔色
        cache: false, //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
        pagination: true, //是否显示分页（*）
        sortable: true, //是否启用排序
        sortStable: false,
        silentSort: false,
        sortName: "regtime",
        sortOrder: "asc", //排序方式
        queryParams: function(params) {
            var temp = { //这里的键的名字和控制器的变量名必须一直，这边改动，控制器也需要改成一样的
                offset: params.offset, //页码
                limit: params.limit, //页面大小
                departmentname: $("#txt_search_departmentname").val(),
                statu: $("#txt_search_statu").val(),
                search: params.search,
                sortOrder: params.order, //排序
                sortName: params.sort, //排序字段
                starttime: $("#starttime :text").val(),
                endtime: $("#endtime :text").val(),
                position: $("#Position").val() || "ALL",
                status: $("#status").val() || "ALL",
            }
            return temp
        }, //传递参数（*）
        queryParamsType: "limit",
        sidePagination: "server", //分页方式：client客户端分页，server服务端分页（*）
        pageNumber: 1, //初始化加载第一页，默认第一页
        pageSize: 10, //每页的记录行数（*）
        pageList: [15, 20, 50, 100, 200, 'ALL'], //可供选择的每页的行数（*）
        search: true, //是否显示表格搜索
        strictSearch: true,
        showColumns: true, //是否显示所有的列
        showRefresh: true, //是否显示刷新按钮
        minimumCountColumns: 2, //最少允许的列数
        clickToSelect: true, //是否启用点击选中行
        // height: 800, //行高，如果没有设置height属性，表格自动根据记录条数觉得表格高度
        uniqueId: "ID", //每一行的唯一标识，一般为主键列
        showToggle: true, //是否显示详细视图和列表视图的切换按钮
        cardView: false, //是否显示详细视图
        detailView: false, //是否显示父子表
        showExport: true, //是否显示导出
        exportDataType: 'all',
        exportTypes: ['txt', 'doc', 'excel'],
        exportOptions: {
            fileName: filename + "_" + $("#toolbar .form-control").val(),
        },
        rowStyle: function(row, index) {
            /* var classes = ["active", "success", "info", "warning", "danger"]*/
            let value = row.status
            if (value == 0) {
                return {
                    classes: "info"
                }
            } else if (value == 1) {
                return {
                    classes: "success"
                }
            } else if (value == 2) {
                return {
                    classes: "danger"
                }
            }
        },
        onCheck: function(row) { //选中框
            // console.log(row)
            return false
        },
        onClickCell: function(field, value, row, $element) { //单击单元格
            // console.log(field, value, row)
            return false
        },
        onDblClickCell: function(field, value, row, $element) { //双击单元格
            return false
        },
        onClickRow: function(item, $element) { //单击行

            return false
        },
        onDblClickRow: function(item, $element) { //双击行

            return false
        },
        columns: [{
                // checkbox: false
                formatter: function(value, row, index) {
                    return index + 1
                }
            }, {
                field: "pid",
                title: "编号"
            }, {
                field: "category",
                title: "生产线"
            }, {
                field: "regtime",
                title: "录入时间",
                sortable: true,
                formatter: function(value, row, index) {
                    return moment(value).format("YYYY-MM-DD HH:mm:ss")
                }
            }, {
                field: "status",
                title: "状态",
                sortable: true,
                formatter: function(value, row, index) {
                        if (value == 0) {
                            return "进行中"
                        } else if (value == 1) {
                            return "完成"
                        } else if (value == 2) {
                            return "已取消"
                        }
                    }
                    // editable: {
                    //     type: "select",
                    //     title: "状态",
                    //     source: [{
                    //             value: "0",
                    //             text: "进行中",
                    //             disabled: "disabled" //不能返工
                    //         },
                    //         {
                    //             value: "1",
                    //             text: "已完成",
                    //             disabled: "disabled" //不能返工
                    //         }, {
                    //             value: "2",
                    //             text: "已取消"
                    //         }
                    //     ],
                    //     validate: function(v, a, b) {
                    //         console.log(v, a, b)
                    //         if (!v) return "不能为空"
                    //     },
                    //     success: function(a, b, c) {
                    //         console.log(a, b, c)
                    //     }
                    // }
            }, {
                field: "workstage",
                title: "最近完成的工序",
                width: '100px',
                formatter: function(value, row, index) {
                    var val = ""
                    if (value) {
                        val = value
                    }
                    return val
                }

            },
            {
                field: "recordtime",
                title: "最近完成工序的时间",
                width: "200px",
                sortable: true,
                formatter: function(value, row, index) {
                    var date = ""
                    if (value) {
                        date = moment(value).format("YYYY-MM-DD HH:mm:ss")
                    }
                    return date
                }
            }, {
                field: "operate",
                title: "操作",
                width: 300,
                align: "center",
                events: {
                    "click .RoleOfA": function(e, value, row, index) {
                        let val = encodeURIComponent(row.pid)
                        window.open("http://" + window.location.host + "/order/search?pid=" + val)
                    },
                    "click .RoleOfC": function(e, value, row, index) {
                        Deleteorder([row.pid])
                    },
                    "click .RoleOfD": function(e, value, row, index) {
                        edit(row)
                    }
                },
                formatter: function operateFormatter(value, row, index) {
                    return [
                        `<span class="RoleOfD btn glyphicon glyphicon-edit" style="margin-right:15px; color:#337AB7" title="查看 ${row.pid} 修改"></span>`,
                        `<span class="RoleOfA btn glyphicon glyphicon-search" style="margin-right:15px; color:#337AB7" title="查看 ${row.pid} 进度"></span>`,
                        `<a href="/order/qrcode?pid=${row.pid}"  class="RoleOfB btn glyphicon glyphicon-qrcode" style="margin-right:15px;color: #000000;" download="${row.pid}.png"
                    data-toggle="popover" data-placement="left" data-delay='200'  data-title='${row.pid}'
                    data-content="<img src='/order/qrcode?pid=${row.pid}&width=236&height=236' alt='${row.pid}' height='236px' width='236px'/>" 
                    data-trigger="hover"></a>`,
                        `<span class="RoleOfC btn glyphicon glyphicon-remove" style="margin-right:15px; color:red" title="删除 ${row.pid} "></span>`,
                    ].join("")
                }
            }
        ],
        onEditableInit: function() {
            console.log("初始化")
        },
        onEditableSave: function(field, row, oldValue, $el) {
            $("#table").bootstrapTable("resetView")
            if (oldValue == 1) {
                swal({
                    title: "错误",
                    text: "该订单已经完成，拒绝修改",
                    type: "success",
                    confirmButtonText: "确认"
                })
                return
            }
            $.ajax({
                type: "post",
                url: "/order/edit",
                data: row,
                dataType: "JSON",
                success: function(data, status) {
                    if (status == "success" && data.code == "ok") {
                        swal({
                            title: "信息已提交成功",
                            text: "信息已提交成功！",
                            type: "success",
                            confirmButtonText: "确认"
                        }).then(function() {
                            $("#table").bootstrapTable("refresh")
                        })

                    } else {
                        swal({
                            title: "信息已提交失败",
                            text: data.message,
                            type: "error",
                            confirmButtonText: "确认"
                        })
                    }
                },
                error: function(XMLHttpRequest, textStatus, errorThrown) {
                    swal({
                        title: "信息已提交失败",
                        text: textStatus,
                        type: "error",
                        confirmButtonText: "确认"
                    })
                }
            })
        },
        onEditableHidden: function(field, row, $el, reason) {
            return false
        },
        onEditableShown: function(field, row, $el, editable) {
            return false
        },
        onPostBody: function() {
            $('.RoleOfB').popover({ html: true })
        },
        onLoadSuccess: function(data) {
            if (data.rows.length === 0) {
                if (this.pageNumber > 1) {
                    $("#table").bootstrapTable('selectPage', (this.pageNumber))
                }
            }
        }
    }
    $("#search").on('click', function() {
        filename = `订单管理${$("#starttime :text").val()}-${$("#endtime :text").val()}-${$("#Position").val() || "全部" } - ${$("#status").find("option:selected").text() || "全部"} `
        $("#table").bootstrapTable('destroy')
        tableconf.exportDataType = $("#toolbar .form-control").val()
        tableconf.exportOptions.fileName = filename + "_" + $("#toolbar .form-control").val()
        $("#table").bootstrapTable(tableconf)
    })

    //1.初始化Table
    $("#table").bootstrapTable(tableconf)

    $('#toolbar').find('select').change(function() {
        $("#table").bootstrapTable('destroy')
        tableconf.exportDataType = $(this).val()
        tableconf.exportOptions.fileName = filename + "_" + $(this).val()
        $("#table").bootstrapTable(tableconf)
    })
})





var Deleteorder = function(pidlist) {

    let html = "<h4>删除后该订单所有记录将彻底销毁</h4>"
    if (!pidlist) return
    pidlist.forEach(function(item) {
        html += `<p style="color:red"><b>${item}</b></p>`

    }, this)

    swal({
        title: '警告:危险操作',
        html: html,
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: '确定',
        cancelButtonText: '取消',
    }).then(function(isConfirm) {
        if (isConfirm === true) {
            $.ajax({
                type: 'post',
                url: '/order/delet',
                data: { "pidlist": pidlist },
                error: function(res) {
                    swal('失败', res.message, 'error')
                },
                success: function(res) {
                    $("#table").bootstrapTable("refresh")
                    if (res.code == 'ok') {
                        swal('成功', "速度非常", 'success')
                    } else {
                        swal('失败', res.message, 'error')
                    }

                }
            })
        } else if (isConfirm === false) {
            swal.close()
        } else {
            swal.close()
        }
    }, function(dismiss) {
        console.log("销毁弹窗")

    })
}
var edit = function(row) {
    console.log(row)
    if (row.status == 1) {
        swal({
            title: "无法修改",
            text: "产品完成所有工序后，不可修改",
            type: "error",
            confirmButtonText: "确认"
        })
    } else {
        swal({
            title: `修改${row.pid}订单状态`,
            input: 'select',
            inputOptions: {
                '0': '进行中',
                '2': '已取消',
            },
            inputPlaceholder: '请选择状态',
            showCancelButton: true,
            inputValidator: function(value) {
                return new Promise(function(resolve, reject) {
                    if (value === '0' || value === '1' || value === '2') {
                        resolve();
                    } else {
                        reject('请正确选择 :)');
                    }
                });
            }
        }).then(function(result) {
            if (result) {
                // swal({
                //     type: 'success',
                //     html: 'You selected: ' + result
                // });
                if (row.status == result) {
                    swal({
                        type: 'success',
                        html: '状态已为修改状态 :)'
                    });
                    return
                }
                row.status = result
                $.ajax({
                    type: "post",
                    url: "/order/edit",
                    data: row,
                    dataType: "JSON",
                    success: function(data, status) {
                        if (status == "success" && data.code == "ok") {
                            swal({
                                title: "信息已提交成功",
                                text: "信息已提交成功！",
                                type: "success",
                                confirmButtonText: "确认"
                            }).then(function() {
                                $("#table").bootstrapTable("refresh")
                            })

                        } else {
                            swal({
                                title: "信息已提交失败",
                                text: data.message,
                                type: "error",
                                confirmButtonText: "确认"
                            })
                            $("#table").bootstrapTable("refresh")
                        }
                    },
                    error: function(XMLHttpRequest, textStatus, errorThrown) {
                        swal({
                            title: "信息已提交失败",
                            text: textStatus,
                            type: "error",
                            confirmButtonText: "确认"
                        })
                    }
                })
            }
        })
        return

    }




}