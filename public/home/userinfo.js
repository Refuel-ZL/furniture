$('#re_Form').bootstrapValidator({
    message: '此值无效！',
    verbose: false,
    excluded: [':disabled'], //关键配置，表示只对于禁用域不进行验证，其他的表单元素都要验证  
    feedbackIcons: {
        valid: 'glyphicon glyphicon-ok',
        invalid: 'glyphicon glyphicon-remove',
        validating: 'glyphicon glyphicon-refresh'
    },
    fields: {
        message: '该值是无效的',
        Name: {
            message: '用户名是无效的',
            enabled: false,
            trigger: 'change',
            validators: {
                notEmpty: {
                    message: '用户名是必需的，不能是空的'
                },
                stringLength: {
                    min: 2,
                    max: 10,
                    message: '用户名必须2~10个字符'
                },
                remote: {
                    url: '/user/check/name',
                    delay: 1000,
                    message: '该账户名已被抢注'
                }
            }
        }
    }
}).on('keyup', '[name="Name"]', function() {
    var isEmpty = document.getElementById('re_Name').getAttribute('data-init') == $('#re_Name').val()
    $('#re_Form').bootstrapValidator('enableFieldValidators', 'Name', !isEmpty)
    $(this).change()
});


$(function() {

    //1.初始化Table
    var oTable = new TableInit()
    oTable.Init()

    //2.初始化Button的点击事件
    var oButtonInit = new ButtonInit()
    oButtonInit.Init()
})
var TableInit = function() {
    var oTableInit = new Object()
        //初始化Table
    oTableInit.Init = function() {
        $('#table').bootstrapTable({
            url: '/user/data', //请求后台的URL（*）
            method: 'get', //请求方式（*）
            toolbar: '#toolbar', //工具按钮用哪个容器
            singleSelect: true, //单选
            striped: true, //是否显示行间隔色
            cache: false, //是否使用缓存，默认为true，所以一般情况下需要设置一下这个属性（*）
            pagination: true, //是否显示分页（*）
            sortable: true, //是否启用排序
            sortName: 'userid',
            sortOrder: 'asc', //排序方式
            queryParams: oTableInit.queryParams, //传递参数（*）
            sidePagination: 'server', //分页方式：client客户端分页，server服务端分页（*）
            pageNumber: 1, //初始化加载第一页，默认第一页
            pageSize: 10, //每页的记录行数（*）
            pageList: [10, 15, 50, 100], //可供选择的每页的行数（*）
            search: true, //是否显示表格搜索
            strictSearch: true,
            showColumns: true, //是否显示所有的列
            showRefresh: true, //是否显示刷新按钮
            minimumCountColumns: 2, //最少允许的列数
            clickToSelect: true, //是否启用点击选中行
            // height: 800, //行高，如果没有设置height属性，表格自动根据记录条数觉得表格高度
            uniqueId: 'ID', //每一行的唯一标识，一般为主键列
            showToggle: true, //是否显示详细视图和列表视图的切换按钮
            cardView: false, //是否显示详细视图
            detailView: false, //是否显示父子表
            // showExport: true, //是否显示导出
            // exportDataType: 'basic', //basic', 'all', 'selected'.
            columns: [{
                checkbox: true
            }, {
                field: 'userid',
                title: '账户名',
            }, {
                field: '1',
                title: '工序1'
            }, {
                field: '2',
                title: '工序2'
            }, {
                field: '3',
                title: '工序3'
            }]
        })
    }

    //得到查询的参数
    oTableInit.queryParams = function(params) {
        var temp = { //这里的键的名字和控制器的变量名必须一直，这边改动，控制器也需要改成一样的
            limit: params.limit, //页面大小
            offset: params.offset, //页码
            departmentname: $('#txt_search_departmentname').val(),
            statu: $('#txt_search_statu').val(),
            search: params.search
        }
        return temp
    }
    return oTableInit
}


var ButtonInit = function() {
    var oInit = new Object()
    oInit.Init = function() {
        //初始化页面上面的按钮事件
        $('#btn_edit').click(function() {
            var arrselections = $('#table').bootstrapTable('getSelections')
            if (arrselections.length > 1) {
                swal({
                    title: '',
                    text: '只能选择一行进行编辑',
                    type: 'error',
                    confirmButtonText: '确认',
                    confirmButtonColor: '#f27474',
                })
                return
            }
            if (arrselections.length <= 0) {
                swal({
                    title: '',
                    text: '请选择有效数据',
                    type: 'error',
                    confirmButtonText: '确认',
                    confirmButtonColor: '#f27474',
                })
                return
            }
            $('#reModalLabel').text('编辑')
            $('#re_Name').val(arrselections[0].userid)

            // $('#re_Name').attr('data-init', arrselections[0].userid)
            document.getElementById('re_Name').setAttribute('data-init', arrselections[0].userid)
            $('#re_Work1').val(arrselections[0]['1'])
            $('#re_Work2').val(arrselections[0]['2'])
            $('#re_Work3').val(arrselections[0]['3'])
            $('#re_openid').val(arrselections[0]['openid'])
            $('#re_Form').bootstrapValidator('enableFieldValidators', 'Name', false)
            $('#reModal').modal({ keyboard: true }) //esc退出

        })
    }

    return oInit
}

$('#re-submit').on('click', function() {
    window.event.returnValue = false
    $.ajax({
        type: 'post',
        url: '/user/reuserinfo',
        data: $('#re_Form').serialize(),
        async: false,
        error: function(res) {
            console.log(res)
            sweetAlert('失败', res.message, 'error')
        },
        success: function(res) {
            if (res.code == 'ok') {
                sweetAlert('成功', '恭喜修改成功', 'success')
                $('#reModal').modal('hide')
            } else {
                sweetAlert('失败', res.message, 'error')
            }
            $('#table').bootstrapTable(('refresh'))
        }
    })

})