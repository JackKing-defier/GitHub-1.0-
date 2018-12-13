// pages/restaurant/restaurant-refund-detail/index.js
const app = getApp();
const requestUtil = require('../../../utils/requestUtil');
const _DgData = require('../../../utils/data');
import _dg from '../../../utils/dg';
const s_common = require('../store-common/common');
Page({

  /**
   * 页面的初始数据
   */
  data: {
  options:{},
  order_info:{},
  cancle_button:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  this.setData({
    options:options
  })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    this.getRefundInfo()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.onShow()
    setTimeout(() => {
      _dg.stopPullDownRefresh()
    }, 1000);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },
  getRefundInfo:function(){
    //获取退款订单信息
    let requestData = {}
    requestData.order_id = this.data.options.order_id
    s_common.getRefundInfo(requestData).then((data)=>{
      console.log(data)
      this.setData({ order_info: data })
    })
  },
  // 取消退款
  cancleRefund:function(){
    const that = this
    let order_info = this.data.order_info 
    if (order_info.status!=1) {
      _dg.alert('错误的订单状态')
      return
    }
    let requestData = {}
    requestData.order_id = order_info.order_id
    this.setData({cancle_button:true})
    s_common.cancleRefund(requestData).then((data) => {
      if(data){
        _dg.alert('取消成功')
        that.onShow()
      }
    })
  },
})