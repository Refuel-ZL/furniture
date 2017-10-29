var rcolor = {
    0: "#339933",
    1: "#3399CC",
    2: "#FF0033"
}


var filename = ""
$("#category").append("<option value= 'ALL'  selected = 'selected'>全部</option>")
$("#status").append("<option value= 'ALL'  selected = 'selected'>全部</option>")
$.get({
    url: '/order/beltline',
    success: function(data) {
        $.each(data.item, function(index, units) {
            $("#category").append("<option value=" + units + ">" + units + "</option>")
        })
    },
    error: function(error) {
        swal("获取产品种类失败", error.message, "error")
    },
    complete: function() {}
})
$.get({
    url: '/order/status',
    success: function(data) {
        $.each(data.data, function(index, units) {
            $("#status").append("<option value=" + units + ">" + index + "</option>")
        })
    },
    error: function(error) {
        swal("获取产品种类失败", error.message, "error")
    },
    complete: function() {

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

filename = `订单管理${$("#starttime :text").val()}-${$("#endtime :text").val()}-${$("#category").val() || "全部" } - ${$("#status").find("option:selected").text() || "全部"} `
$("#pid").typeahead({
    delay: 500,
    fitToElement: true,
    source: function(query, process) {
        return $.ajax({
            url: '/order/pidlist',
            type: 'post',
            data: {
                name: query
            },
            success: function(result) {
                for (var i = 0; i < result.length; i++) {
                    result[i] = JSON.stringify(result[i])
                }
                return process(result);
            }

        })
    },
    highlighter: function(obj) {
        var item = JSON.parse(obj);
        var query = this.query.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, '\\$&');
        return item.pid.replace(new RegExp('(' + query + ')', 'ig'), function($1, match) {
            return '<strong>' + match + '</strong>'
        });
    },
    updater: function(obj) {
        var item = JSON.parse(obj);
        return item.pid;
    },
    afterSelect: function() {
        $("#search").click()
    }
})
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
        sortName: "entertime",
        sortOrder: "desc", //排序方式
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
                category: $("#category").val() || "ALL",
                status: $("#status").val() || "ALL",
                customer: $("#customer").val() || "ALL",
                endcustomer: $("#endcustomer").val() || "ALL",
                pid: $("#pid").val() || "ALL",
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
            return {
                css: {
                    "background-color": rcolor[value] || "none"
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
            console.log(field)
            return false
        },
        onClickRow: function(item, $element) { //单击行

            return false
        },
        onDblClickRow: function(item, $element) { //双击行
            window.open("/order/search?pid=" + item.pid);
            return false
        },
        columns: [{
                // checkbox: false
                field: "id",
                title: "订单序号"
            }, {
                field: "pid",
                title: "订单编号"
            }, {
                field: "category",
                title: "产品种类"
            }, {
                field: "fromtime",
                title: "来单时间",
                sortable: true,
                width: '200px',
                formatter: function(value, row, index) {
                    return moment(value).format("YYYY-MM-DD HH:mm:ss")
                }
            }, {
                field: "entertime",
                title: "下单时间",
                sortable: true,
                width: '200px',
                formatter: function(value, row, index) {
                    return moment(value).format("YYYY-MM-DD HH:mm:ss")
                }
            }, {
                field: "customer",
                title: "客户"
            }, {
                field: "endcustomer",
                title: "终端客户"
            }, {
                field: "status",
                title: "状态",
                sortable: true,
                formatter: function(value, row, index) {
                    if (value == 0) {
                        return "进行中"
                    } else if (value == 1) {
                        return "已完成"
                    } else if (value == 2) {
                        return "已取消"
                    }
                }
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
                field: "operate1",
                title: "操作",
                width: 260,
                align: "center",
                formatter: function operateFormatter(value, row, index) {
                    return [
                        `<span class="RoleOfD btn glyphicon glyphicon-edit" style="margin-right:15px;"  title="编辑 ${row.pid}状态"></span>`,
                        `<span class="RoleOfA btn glyphicon glyphicon-search" style="margin-right:15px;"  title="查看 ${row.pid} 进度"></span>`,
                        `<a href="/order/qrcode?pid=${row.pid}"  class="RoleOfB btn glyphicon glyphicon-qrcode" style="margin-right:15px;color: #000000;" download="${row.pid}.png"
                    data-toggle="popover" data-placement="left" data-delay='200'  data-title='${row.pid}'
                    data-content="<img src='/order/qrcode?pid=${row.pid}&width=236&height=236' alt='${row.pid}' height='236px' width='236px'/>" 
                    data-trigger="hover"></a>`,
                    ].join("")
                },
                events: {
                    "click .RoleOfA": function(e, value, row, index) {
                        let val = encodeURIComponent(row.pid)
                        window.open("http://" + window.location.host + "/order/search?pid=" + val)
                    },
                    "click .RoleOfD": function(e, value, row, index) {
                        edit(row)
                    }
                }
            }, {
                field: "operate2",
                title: "删除",
                width: 50,
                align: "center",
                formatter: function operateFormatter(value, row, index) {
                    return [
                        `<span class="RoleOfC btn glyphicon glyphicon-remove" style="margin-right:15px; color:red" title="删除 ${row.pid} "></span>`,
                    ].join("")
                },
                events: {
                    "click .RoleOfC": function(e, value, row, index) {
                        Deleteorder([row.pid])
                    }
                }
                // cellStyle: function cellStyle(value, row, index) {
                //     // let value = row.status
                //     return {
                //         css: {
                //             // "color": "#000000"
                //         }
                //     }
                // }
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
        filename = `订单管理${$("#starttime :text").val()}-${$("#endtime :text").val()}-${$("#category").val() || "全部" } - ${$("#status").find("option:selected").text() || "全部"} `
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

    $("#table").bootstrapTable("hideColumn", 'operate2')
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
    $("#reModalLabel").text("编辑")
    $("#_fromtime :text").val(row.fromtime)
    $("#_entertime :text").val(row.entertime)
    $("#_pid").val(row.pid)
    $("#_category").html("<option>" + row.category + "</option>")
    $("#_status").removeAttr('disabled')
    if (row.status == 1) {
        $("#_status").attr('disabled', "true")
    }
    var list = "<option value=0>进行中</option><option value=1 >已完成</option><option value=2>已取消</option>"
    $("#_status").html(list)
    $("#_status ").val(row.status)

    $("#_customer").val(row.customer)
    $("#_endcustomer").val(row.endcustomer)
    $("#reModal").modal({ keyboard: true }) //esc退出

    return

    // }
}

$("#re_Form").keydown(function(event) {
    if (event.keyCode == 13) {
        $("#re-submit").click()
    }
})
$("#re-submit").on("click", function() {
    swal({
        title: "",
        text: "提交中！请稍后。",
        showConfirmButton: false,
        imageUrl: "/images/timg.gif"
    });
    $("#_fromtime :text").removeAttr('disabled')
    $("#_entertime :text").removeAttr('disabled')
    $("#_pid").removeAttr('disabled')
    $("#_category").removeAttr('disabled')
    $("#_status").removeAttr('disabled')
    var data = $("#re_Form").serialize()
    $("#_fromtime :text").attr('disabled', "true")
    $("#_entertime :text").attr('disabled', "true")
    $("#_pid").attr('disabled', "true")
    $("#_category").attr('disabled', "true")
    $("#_status").attr('disabled', "true")
    $.ajax({
        type: "post",
        url: "/order/edit",
        data: data,
        dataType: "JSON",
        success: function(data, status) {
            if (status == "success" && data.code == "ok") {
                $("#reModal").modal("hide")
                swal("成功", "恭喜修改成功", "success")
                $("#table").bootstrapTable("refresh")
            } else {
                swal("失败", data.message, "error")
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
})