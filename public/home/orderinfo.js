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
            sortName: params.sort //排序字段
        }
        return temp
    }, //传递参数（*）
    queryParamsType: "limit",
    sidePagination: "server", //分页方式：client客户端分页，server服务端分页（*）
    pageNumber: 1, //初始化加载第一页，默认第一页
    pageSize: 10, //每页的记录行数（*）
    pageList: [10, 25, 50, 100, 200, 500, 'ALL'], //可供选择的每页的行数（*）
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
    exportTypes: ['txt', 'doc', 'excel'],
    exportOptions: {
        fileName: '文件名',
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
        sortable: true
    }, {
        field: "status",
        title: "状态",
        // formatter: function(value, row, index) {
        //         if (value == 0) {
        //             return "进行中"
        //         } else if (value == 1) {
        //             return "完成"
        //         } else if (value == 2) {
        //             return "已取消"
        //         }
        //     }
        editable: {
            type: "select",
            title: "状态",
            source: [{
                    value: "0",
                    text: "进行中",
                    disabled: "disabled" //不能返工
                },
                {
                    value: "1",
                    text: "已完成",
                    disabled: "disabled" //不能返工
                }, {
                    value: "2",
                    text: "已取消"
                }
            ],
            validate: function(v) {
                if (!v) return "不能为空"
            }
        }
    }, {
        field: "operate",
        title: "操作",
        align: "center",
        events: {
            "click .RoleOfA": function(e, value, row, index) {
                let val = encodeURIComponent(row.pid)
                window.open("http://" + window.location.host + "/order/search?pid=" + val)
            },
            "click .RoleOfC": function(e, value, row, index) {
                Deleteorder([row.pid])
            }
        },
        formatter: function operateFormatter(value, row, index) {
            return [
                `<button type="button" class="RoleOfA btn btn-primary  btn-sm" style="margin-right:15px;">进度</button>`,
                `<a href="#" class="RoleOfB btn btn-info btn-sm" style="margin-right:15px;"
                data-toggle="popover" data-placement="left" data-delay='200'  data-title='${row.pid}'
                data-content="<img src='/order/qrcode?pid=${row.pid}&width=236&height=236' alt='${row.pid}' height='236px' width='236px'/>" 
                data-trigger="hover">二维码</a>`,
                `<button type="button" class="RoleOfC btn  btn-danger  btn-sm" style="margin-right:15px;">删除</button>`,
                // "<button type="button" class="RoleOfEdit btn btn-default  btn-sm" style="margin-right:15px;">编辑</button>",
            ].join("")
        }
    }],
    onEditableSave: function(field, row, oldValue, $el) {
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

$(function() {
    //1.初始化Table
    $("#table").bootstrapTable(tableconf)

    $('#toolbar').find('select').change(function() {
        $("#table").bootstrapTable('destroy')
        tableconf.exportDataType = $(this).val()
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