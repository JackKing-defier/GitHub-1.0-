const app = getApp();
const requestUtil = require('../../../utils/requestUtil');
const util = require('../../../utils/util');
const _DgData = require('../../../utils/data');
import _dg from '../../../utils/dg';
Page({
  /**
   * 页面的初始数据
   */
  data: {
    page_index: 1,
    goodsArr: [],
    categorys: [],
    latitude: "",
    longitude: "",
    keywords: '',
    is_show_cates_v: false,
    select_category_id: '',
    select_category_title: '全部',
    sort_type: 1, //1默认排序2热销排序
    is_show_load_bg: true,//控制整个界面显示，没有加载好则显示默认背景
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    that.getCategorys();
    that.getMarketInfo();
    that.getLocation();

  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    var that = this;
    that.getCategorys();
    that.getMarketInfo();
    that.getLocation();
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
    var that = this;
    that.getGoodsList(that.data.page_index);
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  //获取集市信息
  getMarketInfo: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php?s=/addon/DgStore/StoreApi/getMarketInfo.html', {}, (info) => {
      that.setData({
        market_info: info,
      });
    }, that, { isShowLoading: false });
  },
  //获取定位
  getLocation: function () {
    var that = this;
    // 页面初始化 options为页面跳转所带来的参数
    var latitude = 0;
    var longitude = 0;

    var lat = _dg.getStorageSync('LATITUD')
    var lng = _dg.getStorageSync('LONGITUDE')
    if (lat && lng && lat != 'undefined' && lng != 'undefined') {
      that.setData({
        latitude: lat,
        longitude: lng
      });
      that.getGoodsList();
    }
    else {
      wx.getLocation({
        type: 'wgs84',
        success: function (res) {
          that.data.latitude = res.latitude
          that.data.longitude = res.longitude
        },
        fail: function () {
          _dg.setStorageSync('LATITUD', 39.90);
          _dg.setStorageSync('LONGITUDE', 116.38);
          _dg.setStorageSync('ADDRESS', '北京市');
          that.setData({
            latitude: _dg.getStorageSync('LATITUD'),
            longitude: _dg.getStorageSync('LONGITUDE')
          })
        },
        complete: function () {
          that.getGoodsList();
        }
      })
    }
  },
  //获取商品列表
  getGoodsList: function (page_index = 1) {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php?s=/addon/DgStore/StoreApi/getMarketGoods.html', { page_index: page_index, ws_lat: that.data.latitude, ws_lng: that.data.longitude, cate_id: that.data.select_category_id, keywords: that.data.keywords, sort_type: that.data.sort_type }, (data) => {

      //如果是下拉加载时 先将评论数组清空 
      if (page_index == 1) {
        //默认进来进来 或者刷新时调用
        that.data.goodsArr.splice(0, that.data.goodsArr.length);
        if (data.length > 0) {
          that.data.goodsArr = that.data.goodsArr.concat(data);
        }
      }
      else {
        //加载更多数据
        if (data.length > 0) {
          that.data.goodsArr = that.data.goodsArr.concat(data);
        }
      }
      that.setData({
        goodsArr: that.data.goodsArr,
        is_show_load_bg: false
      });
      that.data.page_index = parseInt(that.data.page_index) + 1;
    });
  },
  //获取商品列表
  getCategorys: function (page_index = 1) {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php?s=/addon/DgStore/StoreApi/getMarketGoodsCategorys.html', {}, (data) => {
      that.setData({
        categorys: data,
      });
    });
  },
  show_or_hide_cate_v: function () {
    var that = this;
    that.setData({ is_show_cates_v: !that.data.is_show_cates_v });
  },
  selectCategory: function (e) {
    var that = this;
    var cate_id = e.currentTarget.dataset.id;
    var cate_title = e.currentTarget.dataset.title;
    that.setData({
      select_category_id: cate_id,
      select_category_title: cate_title,
      is_show_load_bg: false,
      sort_type: 1
    });
    that.show_or_hide_cate_v();
    that.getGoodsList(1);

  },
  //点击热销产品 更改排序方式
  change_sort_type: function () {
    var that = this;
    that.setData({
      sort_type: 2
    });
    that.getGoodsList(1);
  },
  keyboardComplete: function (e) {
    //搜索框完成按键事件
    var that = this;
    this.setData({ keywords: e.detail.value, sort_type: 1 });
    that.getGoodsList(1);
  },
  push_to_store: function (e) {
    var store_id = e.currentTarget.dataset.store_id;
    var goods_id = e.currentTarget.dataset.goods_id;
    var cate_id = e.currentTarget.dataset.goods_category_id
    console.log(e.currentTarget.dataset);
    wx.navigateTo({
      url: '../store-goods-list/index?store_id=' + store_id + '&goods_id=' + goods_id + '&cate_id=' + cate_id
    });

  }

})