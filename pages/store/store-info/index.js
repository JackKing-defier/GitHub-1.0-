const app = getApp();
const requestUtil = require('../../../utils/requestUtil');
const _DgData = require('../../../utils/data');
import WxParse from '../../../wxParse/wxParse';
import _ from '../../../utils/underscore';
import _dg from '../../../utils/dg';
const s_common = require('../store-common/common');

Page({
  data: {
    store_data: false,
    this_store_id: 0,
    is_show_load_bg: true,//没有加载好则显示默认背景
    is_show_back_home: true,
    storeSwiperNum: 0,
    store_type: 2,
    is_show_all_intro: false,
    is_show_consult_view: false,
    coupon_num:0,
  },
  // 轮播图渲染数字
  storeSwiperChange: function (e) {
    this.setData({ storeSwiperNum: e.detail.current });
  },
  onShareAppMessage: function () {
    var that = this
    return {
      title: that.data.store_data.store_name,
      desc: that.data.store_data.store_jieshao,
      path: 'pages/store/store-info/index?store_id=' + that.data.this_store_id
    }
  },
  onLoad: function (options) {
    var that = this;
    var store_id = options.store_id || 0;
    if (store_id == 0) {
      that.getStoreConfig();
    } else {
      that.setData({
        this_store_id: store_id,
      });
      that.getStoreInfo();
    }

  },
  onShow:function(){
    let requestData = { store_id: this.data.this_store_id, from:'store-info'}
    s_common.getCoupons(requestData).then((data)=>{
      this.setData({
        coupon_num:data
      })
    })
  },
  //活动公告
  huodong_info_bind: function () {
    var that = this;
    wx.navigateTo({
      url: '../store-active/index?&store_id=' + that.data.this_store_id
    });
  },

  //获取配置信息
  getStoreConfig: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/Api/getStoreConfig.html', {}, (info) => {
      that.setData({
        store_type: info.store_type,
        this_store_id: info.store_id,
      });
      that.getStoreInfo();
    }, that, { isShowLoading: false });
  },
  //跳转外链小程序
  jump_xcx: function (e) {
    var appid = e.currentTarget.id;
    _dg.navigateToMiniProgram({
      appId: appid,
      path: '',
      extraData: {
        foo: 'bar'
      },
      envVersion: 'develop',
      success(res) {

      }
    })
  },
  //快速买单
  rapid_pay_bind: function (e) {
    var that = this;
    _dg.navigateTo({
      url: '../store-rapid-pay/index?store_id=' + that.data.this_store_id
    });
  },
  //跳转优惠券列表
  coupon_list_bind: function (e) {
    var that = this;
    _dg.navigateTo({
      url: '/pages/store/store-coupon/index?list_type=1&store_id=' + that.data.this_store_id
    });
  },
  //跳转商品详情
  goods_info_bind: function (e) {
    var that = this;
    _dg.navigateTo({
      url: '../store-goods-details/index?goods_id=' + e.currentTarget.id + '&store_id=' + that.data.this_store_id
    });
  },
  //跳转商品列表
  goods_list_bind: function (e) {
    var that = this;
    _dg.navigateTo({
      url: '../store-goods-list/index?store_id=' + that.data.this_store_id
    });
  },
  //活动公告
  huodong_info_bind: function () {
    var that = this;
    _dg.navigateTo({
      url: '../store-active/index?&store_id=' + that.data.this_store_id
    });
  },
  //领券页面
  huodong_quan_info_bind: function () {
    var that = this;
    _dg.navigateTo({
      url: '../store-juan/index?&store_id=' + that.data.this_store_id
    });
  },
  //订单
  go_user_order_bind: function (e) {
    _dg.navigateTo({
      url: '/pages/store/store-order-list/index'
    });
  },
  //导航导航
  get_location_bind: function () {
    var that = this;
    var loc_lat = that.data.store_data.store_gps_lat;
    var loc_lng = that.data.store_data.store_gps_lng;
    _dg.openLocation({
      latitude: parseFloat(loc_lat),
      longitude: parseFloat(loc_lng),
      scale: 18,
      name: that.data.store_data.store_name,
      address: that.data.store_data.store_address
    });
  },
  //电话
  call_phone_bind: function () {
    var that = this;
    _dg.makePhoneCall({
      phoneNumber: that.data.store_data.store_con_mobile
    });
  },
  //获取店铺信息 包含店铺商品
  getStoreInfo: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/getStoreHomeInfo.html', { store_id: that.data.this_store_id, versions: 2 }, (info) => {
      var store_data = info;
      console.log(info)
      that.data.store_data = store_data;
      that.setData({
        is_show_load_bg: false,
        store_data: store_data,
        comment_data: store_data.recommend_comments,
        comment_title: '最新评价'
      });


      var handler = {
        setData: (bindData) => {
          _.each(bindData.content.images, (item, index) => {
            if (item.attr.src.indexOf('http') !== 0) {
              item.attr.src = _data.DUOGUAN_HOST_URL + item.attr.src;
              bindData.content.imageUrls[index] = item.attr.src;
            }
          });
          this.setData(bindData);
        }
      };
      if (info.store_intro != null && info.store_intro != '') {
        WxParse.wxParse('content', 'html', info.store_intro, handler);
        this.wxParseImgLoad = handler.wxParseImgLoad;
        this.wxParseImgTap = handler.wxParseImgTap;

        _dg.setNavigationBarTitle({
          title: store_data.store_name
        });
      }

    }, this);
  },

  //立即购买
  buy_now: function (e) {
    var that = this;
    _dg.navigateTo({
      url: '../store-order-sure/index?store_id=' + that.data.this_store_id + '&buy_type=1&goods_id=' + e.currentTarget.id
    });
  },
  backHome: function () {
    var that = this;
    _dg.switchTab({
      url: _DgData.duoguan_app_index_path
    });
  },
  //下拉刷新
  onPullDownRefresh: function () {
    var that = this;
    that.getStoreInfo();
    setTimeout(() => {
      _dg.stopPullDownRefresh()
    }, 1000);
  },
  onShareAppMessage: function () {
    var that = this
    return {
      title: that.data.store_data.store_name,
      desc: that.data.store_data.store_jieshao,
      path: 'pages/store/store-info/index?store_id=' + that.data.this_store_id
    }
  },
  change_store_intro_show: function () {
    this.setData({
      is_show_all_intro: !this.data.is_show_all_intro
    });
  },
  change_consult_view_show: function () {
    this.setData({
      is_show_consult_view: !this.data.is_show_consult_view
    });

  },
  //表单
  formSubmit: function (e) {
    var that = this;
    var rdata = e.detail.value;
    rdata['store_id'] = that.data.this_store_id;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/postConsultMsg.html', rdata, (info) => {
      _dg.alert("提交成功，我们会尽快回复您！", function (res) {
        that.setData({
          is_show_consult_view: false
        });
      });
    }, that, { isShowLoading: false });
  },

  //跳转到webview
  toWebView: function () {
    _dg.navigateTo({
      url: '/pages/store/store-webview/index?weburl=' + encodeURIComponent(this.data.store_data.store_webview_url)
    })
  },
}) 