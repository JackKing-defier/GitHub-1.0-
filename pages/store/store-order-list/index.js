var _function = require('../../../utils/functionData.js');
const requestUtil = require('../../../utils/requestUtil');
const _DgData = require('../../../utils/data');
import _dg from '../../../utils/dg';
var app = getApp()
Page({
  data: {
    postlist: [],
    this_weiba_id: 0,
    hasMore: false,
    showLoading: false,
    isScrollY: true,
    page_index: 1,//当前页码
    pagesize: 10,//每页数量
    this_nav_name: 'index',
    this_is_jinghua: 0,
    this_finish_page: 0,
    glo_is_load: true,
    orderListArr: [],
    is_show_load_bg: true//控制整个界面显示，没有加载好则显示默认背景
  },
  //订单详情
  user_orderinfo_bind: function (e) {
    var oid = e.currentTarget.id;
    _dg.navigateTo({
      url: '../store-order-info/index?oid=' + oid
    });
  },
  //评价
  order_go_comment_bind: function (e) {
    var oid = e.currentTarget.id;
    _dg.navigateTo({
      url: '../store-order-comment/index?oid=' + oid
    });
  },
  //删除订单
  delete_user_order: function (e) {
    var that = this
    var oid = e.currentTarget.id;
    _dg.confirm("确认要删除该订单吗?",function(res){
      if (res.confirm == true) {
        requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/OrderApi/deleteUserOrder.html', { oid: oid }, (info) => {
          that.setData({
            page_index: 1
          })
          that.getUserOrderList();
        });
      }
    })
  },
  change_order_status_or_show: function (e) {
    var that = this
    var oid = e.currentTarget.id;
    var change_type = e.currentTarget.dataset.change_type;
    var order_type = e.currentTarget.dataset.order_type;
    let refund = e.currentTarget.dataset.refund
    let refund_status = e.currentTarget.dataset.refundstatus
    let item_store_id = e.currentTarget.dataset.store_id
    if (refund && !order_type) {
      let url = refund_status == 0 ? '../store-refund-write/index?order_id=' + oid + '&store_id=' + item_store_id : '../store-refund-detail/index?order_id=' + oid 
      _dg.navigateTo({
        url:url
      })
      return
    }
    var content='';
    if (change_type == 1) {
      //取消订单
      content = '确认要取消订单吗？';
    }
    else if (change_type == 2) {
      // 确认已送达
      if(order_type==1)
      {
        content = '确认已领取吗？';
      }
      else if (order_type == 2)
      {
        content = '确认已送达吗？';
      }
     
      }
    else if (change_type == 3) {
      content = '确定要删除订单吗？';
    }
    _dg.confirm(content,function(res){
      if (res.confirm == true) {
        requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/OrderApi/changeOrderStatusOrShow.html', { oid: oid, change_type: change_type }, (info) => {
          that.setData({
            page_index: 1
          })
          that.getUserOrderList();
        });
      }
    })
  },
  //获取订单列表
  getUserOrderList: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/getUserOrderList.html', { pagesize: that.data.pagesize, pagenum: that.data.page_index }, (data) => {
      //如果是下拉加载时 先将评论数组清空 
      if (that.data.page_index == 1) {
        //默认进来进来 或者刷新时调用
        that.data.orderListArr.splice(0, that.data.orderListArr.length);
        if (data.length > 0) {
          that.data.orderListArr = that.data.orderListArr.concat(data);
        }
      }
      else {
        //加载更多数据
        if (data.length > 0) {
          that.data.orderListArr = that.data.orderListArr.concat(data);
        }
      }
      that.setData({
        postlist: that.data.orderListArr,
        is_show_load_bg: false,
        glo_is_load: false
      });
      that.data.page_index = parseInt(that.data.page_index) + 1;
      _dg.hideToast();
    });
  },
  onShow: function () {
    var that = this
    that.setData({
      page_index: 1
    })
    that.getUserOrderList();
  },
  //下拉刷新
  onPullDownRefresh: function () {
    var that = this;
    // that.setData({
    //   page_index: 1
    // });
    
    that.data.page_index=1;
    that.getUserOrderList();
    setTimeout(() => {
      _dg.stopPullDownRefresh();
    }, 1000)
  },
  onReachBottom: function (e) {
    var that = this;
    if (that.data.page_index>1){
 that.getUserOrderList();
    }
   
  },
  //开始支付
  order_go_pay_bind: function (e) {
    var that = this;
    var this_order_id = e.currentTarget.id;
    _dg.showToast({
      title: '加载中',
      icon: 'loading',
      duration: 10000
    })
    that.setData({
      buttonIsDisabled: true,
      submitIsLoading: true
    })
    that.orderPay(this_order_id);
  },
  //订单支付
  orderPay: function (oid) {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/OrderApi/orderPay.html', { oid: oid }, (data) => {
      _dg.hideToast();
      that.setData({
        buttonIsDisabled: false,
        submitIsLoading: false
      })
      wx.requestPayment({
        'timeStamp': data.timeStamp,
        'nonceStr': data.nonceStr,
        'package': data.package,
        'signType': 'MD5',
        'paySign': data.paySign,
        'complete': function () {
          //支付完成 刷新
          that.getUserOrderList();
        }
      });
    }, { complete: that.orderPayComplete() });
  },
  //支付完成
  orderPayComplete: function () {
    var that = this;
    that.setData({
      btn_submit_disabled: false,
      submitIsLoading: false
    });
  },
})