$("#re_Form").bootstrapValidator({
    message: "此值无效！",
    verbose: false,
    excluded: [":disabled"], //关键配置，表示只对于禁用域不进行验证，其他的表单元素都要验证  
    feedbackIcons: {
        valid: "glyphicon glyphicon-ok",
        invalid: "glyphicon glyphicon-remove",
        validating: "glyphicon glyphicon-refresh"
    },
    fields: {
        message: "该值是无效的",
        Name: {
            message: "用户名是无效的",
            enabled: false,
            trigger: "change",
            validators: {
                notEmpty: {
                    message: "用户名是必需的，不能是空的"
                },
                stringLength: {
                    min: 2,
                    max: 10,
                    message: "用户名必须2~10个字符"
                },
                remote: {
                    url: "/user/check/name",
                    delay: 1000,
                    message: "该账户名已被抢注"
                }
            }
        }
    }
}).on("keyup", "[name=\"Name\"]", function() {
    var isEmpty = document.getElementById("re_Name").getAttribute("data-init") == $("#re_Name").val()
    $("#re_Form").bootstrapValidator("enableFieldValidators", "Name", !isEmpty)
    $(this).change()
});

var tableconf = {
    url: "/user/data", //请求后台的URL（*）
    method: "get", //请求方式（*）
    toolbar: "#toolbar", //工具按钮用哪个容器
    singleSelect: true, //单选
    striped: true, //是否显示行间隔色
    cache: false, //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
    showPaginationSwitch: true,
    pagination: true, //是否显示分页（*）
    sortable: true, //是否启用排序
    sortName: "userid",
    sortOrder: "asc", //排序方式
    queryParams: function(params) {
        var temp = { //这里的键的名字和控制器的变量名必须一直，这边改动，控制器也需要改成一样的
            limit: params.limit, //页面大小
            offset: params.offset, //页码
            search: params.search
        }
        return temp
    }, //传递参数（*）
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
    exportTypes: ['txt', 'doc', 'excel'],
    exportOptions: {
        fileName: '用户管理' + moment().format("YYYY-MM-DD"),
    },
    columns: [
        //     {
        //     title: "",
        //     formatter: function(value, row, index) {
        //         return index + 1
        //     }
        // },
        {
            field: "userid",
            title: "账户名",
        }, {
            field: "1",
            title: "工序1"
        }, {
            field: "2",
            title: "工序2"
        }, {
            field: "3",
            title: "工序3"
        }, {
            field: "operate",
            title: "操作",
            width: 150,
            align: "center",
            formatter: function operateFormatter(value, row, index) {
                return [
                    `<span  class="RoleOfA btn glyphicon glyphicon-edit" style="margin-right:15px; color:#337AB7" title="修改 ${row.userid}"></span>`,
                    // `<button type="button" class="RoleOfA btn  btn-primary  btn-sm " style="margin-right:15px;">修改</button>`,//
                    // `<button type="button" class="RoleOfB  glyphicon glyphicon-remove" style="margin-right:15px;">删除</button>`,
                    `<span  class="RoleOfB btn glyphicon glyphicon-remove" style="margin-right:15px; color:red" title="删除 ${row.userid}"></span>`,
                    // "<button type="button" class="RoleOfEdit btn btn-default  btn-sm" style="margin-right:15px;">编辑</button>",
                ].join("")
            },
            events: {
                "click .RoleOfA": function(e, value, row, index) {
                    $("#reModalLabel").text("编辑")
                    $("#re_Name").val(row.userid)
                    $("#re_Work1").val(row["1"])
                    $("#re_Work2").val(row["2"])
                    $("#re_Work3").val(row["3"])
                    $("#re_openid").val(row.openid)
                    $("#re_Form").bootstrapValidator("enableFieldValidators", "Name", false)
                    $("#reModal").modal({ keyboard: true }) //esc退出
                },
                "click .RoleOfB": function(e, value, row, index) {
                    DeleteUser([row.userid])
                }
            }
        }
    ],
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
        tableconf.exportOptions.fileName = '用户管理' + moment().format("YYYY-MM-DD")
        $("#table").bootstrapTable(tableconf)
    })
})


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
    $.ajax({
        type: "post",
        url: "/user/reuserinfo",
        data: $("#re_Form").serialize(),
        async: true,
        error: function(res) {
            // console.log(res)
            swal("失败", res.message, "error")
        },
        success: function(res) {
            if (res.code == "ok") {
                $("#reModal").modal("hide")
                swal("成功", "恭喜修改成功", "success")
            } else {
                swal("失败", res.message, "error")
            }
            $("#table").bootstrapTable(("refresh"))
        }
    })

})

function DeleteUser(uidlist) {
    let html = "<h4>删除后该用户所有记录将彻底销毁</h4>"
    if (!uidlist) return
    uidlist.forEach(function(item) {
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
                url: '/user/delet',
                data: { "uidlist": uidlist },
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