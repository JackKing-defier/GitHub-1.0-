const app = getApp();
const requestUtil = require('../../../utils/requestUtil');
const _DgData = require('../../../utils/data');
import _dg from '../../../utils/dg';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    options: {},
    refund_reason_list: [
      { name: '商家送货不及时' },
      { name: '点错了' },
      { name: '不想要了' },
      { name: '...' }],
      current_select_reason: '',
      submitBtn:false,

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log(options)
    this.setData({
      options: options
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
  buttonChange: function (e) {
    let current_select = e.currentTarget.dataset.current
    this.setData({
      current_select_reason: current_select.name
    })
  },
  commitApply: function (e) {
    console.log(e)
    const that = this;
    let formId = e.detail.formId
    let refund_tag = this.data.current_select_reason
    let other_reason = e.detail.value.beizhu
    let order_id = this.data.options.order_id
    let store_id = this.data.options.store_id
    if (!order_id || !store_id) {
      _dg.alert('错误的参数，请返回')
      return
    }
    if (!refund_tag && !other_reason) {
      _dg.alert('请填写退款原因！')
      return
    }
    this.setData({ submitBtn:true})
    let requestData = {}
    requestData.order_id = order_id
    requestData.store_id = store_id
    requestData.form_id = formId
    requestData.refund_tag = refund_tag != 'undefined' ? refund_tag : ''
    requestData.other_reason = other_reason != 'undefined' ? other_reason:''
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/OrderApi/userApplyRefund.html', requestData, (data) => {
      if (data) {
        wx.showModal({
          title: '提示',
          content: "申请成功",
          confirmText: "查看详情",
          showCancel: false,
          success: function (res) {
            wx.redirectTo({
              url: '../store-refund-detail/index?order_id=' + that.data.options.order_id
            });
          }
        })
      }
    });
  }
})