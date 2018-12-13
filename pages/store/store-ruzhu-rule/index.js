// pages/store/store-ruzhu-rule/index.js
const app = getApp();
const requestUtil = require('../../../utils/requestUtil');
const _DgData = require('../../../utils/data');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    protocol_title: '',
    protocol_contents: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    var store_id = options.store_id || 0;
    /* that.setData({
      
    }); */
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php?s=/addon/DgStore/Api/getStoreConfig.html', {}, (info) => {
      if (info.store_type == 2) {
        that.setData({
          protocol_title: info.protocol_title,
          protocol_contents: info.protocol_contents
        })
      }
    } , that, { isShowLoading: true })
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
  
  }
})