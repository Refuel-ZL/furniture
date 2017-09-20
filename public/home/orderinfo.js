$(function() {
    //1.初始化Table
    var oTable = new TableInit()
    oTable.Init()

    //2.初始化Button的点击事件
    var oButtonInit = new ButtonInit()
    oButtonInit.Init()
    $('#toolbar').find('select').change(function() {
        $("#table").bootstrapTable('refreshOptions', {
            exportDataType: $(this).val()
        });
    });


})
var TableInit = function() {
    var oTableInit = new Object()
        //初始化Table
    oTableInit.Init = function() {
        function operateFormatter(value, row, index) {
            return [
                `<button type="button" class="RoleOfA btn btn-default  btn-sm" style="margin-right:15px;">进度</button>`,
                `<a href="/order/qrcode?pid=${row.pid}" class="RoleOfB btn btn-default btn-sm" style="margin-right:15px;">二维码</a>`,
                // "<button type="button" class="RoleOfB btn btn-default  btn-sm" style="margin-right:15px;">二维码</button>",
                // "<button type="button" class="RoleOfC btn btn-default  btn-sm" style="margin-right:15px;">C权限</button>",
                // "<button type="button" class="RoleOfEdit btn btn-default  btn-sm" style="margin-right:15px;">编辑</button>",

            ].join("")
        }
        var operateEvents = {
            "click .RoleOfA": function(e, value, row, index) {
                let val = encodeURIComponent(row.pid)
                window.open("http://" + window.location.host + "/order/search?pid=" + val)
            },
            "mouseover .RoleOfB": function(e, value, row, index) {
                var $pElem = $(this)
                $(this).get(0).setAttribute("download", row.pid + ".png")
                $pElem.popover({
                    html: true,
                    trigger: "hover", //hover 
                    title: `二维码【${row.pid}】`,
                    content: `<img src="/order/qrcode?pid=${row.pid}" alt="${row.pid}" height="256px" width="260px"/>`,
                    container: "#table",
                    placement: "left",
                    animation: false
                })
                $pElem.popover("show")
            },
            "mouseleave .RoleOfB": function(e, value, row, index) {
                // var $pElem = $(this)
                // $pElem.popover("hide")
            },
            /*   "click .RoleOfB": function(e, value, row, index) {
                  swal({
                      title: "",
                      text: "<img src="/order/qrcode"/> </br><a href="/order/qrcode" download class="btn btn-default"> 下载</a>",
                      html: true,
                      closeOnConfirm: false,
                      closeOnCancel: false,
                      showConfirmButton: false
                          // imageUrl: "/order/qrcode"
                  })
              }, */
        }
        $("#table").bootstrapTable({
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
            sortName: "regtime",
            sortOrder: "asc", //排序方式
            queryParams: oTableInit.queryParams, //传递参数（*）
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
                    //             // disabled: "disabled" //不能返工
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
                    //     validate: function(v) {
                    //         if (!v) return "不能为空"
                    //     }
                    // }
            }, {
                field: "operate",
                title: "操作",
                align: "center",
                events: operateEvents,
                formatter: operateFormatter
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
            }
        })
    }

    //得到查询的参数
    oTableInit.queryParams = function(params) {
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
    }
    return oTableInit
}


var ButtonInit = function() {
    var oInit = new Object()
    oInit.Init = function() {
        //初始化页面上面的按钮事件
        $("#btn_edit").click(function() {
            var arrselections = $("#table").bootstrapTable("getSelections")
            if (arrselections.length > 1) {
                swal({
                    title: "",
                    text: "只能选择一行进行编辑",
                    type: "error",
                    confirmButtonText: "确认",
                    confirmButtonColor: "#f27474",
                })
                return
            }
            if (arrselections.length <= 0) {
                swal({
                    title: "",
                    text: "请选择有效数据",
                    type: "error",
                    confirmButtonText: "确认",
                    confirmButtonColor: "#f27474",
                })
                return
            }
        })
    }

    return oInit
}