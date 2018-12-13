// pages/store/store-goods_details/index.js
const app = getApp();
import WxParse from '../../../wxParse/wxParse';
import _ from '../../../utils/underscore';
const requestUtil = require('../../../utils/requestUtil');
const _DgData = require('../../../utils/data');
import _dg from '../../../utils/dg';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    store_id: 0,
    store_data: false,
    //控制购物车显示
    cart_list_isshow: false,
    cart_list: [],
    store_yingye_status_text: '未营业',
    store_yingye_status_val: 2,
    store_button_status: true,
    //提交btn loading
    submitIsLoading: false,
    //显示规格
    guigeIsShow: false,
    //商品属性选择
    goods_attr_select: {},
    goods_specification: {},
    goods_a_info: {},
    is_show_load_bg: true,//控制整个界面显示，没有加载好则显示默认背景
    goods_info: {},
    goods_id: 0
  },
  //设置分享
  onShareAppMessage: function () {
    var that = this
    return {
      title: that.data.goods_info.g_name,
      desc: '',
      path: '/pages/store/store-goods-details/index?store_id=' + that.data.store_id + '&goods_id=' + that.data.goods_id
    }

  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var goods_id = options.goods_id || 0;
    var store_id = options.store_id || 0;
    this.data.store_id = store_id;
    this.data.goods_id = goods_id;
    this.getGoodsInfo(goods_id);
  },
  onShow: function (options) {
    this.getStoreInfo();
  },
  //获取商品信息
  getGoodsInfo: function (goods_id) {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + "/index.php/addon/DgStore/storeApi/getGoodsDetails.html", { goods_id: goods_id, store_id: this.data.store_id }, (data) => {
      var that = this;
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
      WxParse.wxParse('content', 'html', data.g_description, handler);
      this.wxParseImgLoad = handler.wxParseImgLoad;
      this.wxParseImgTap = handler.wxParseImgTap;
      data.real_repertory = data.shop_repertory
      that.setData({
        goods_info: data,
        is_show_load_bg: false
      });
    });
  },
  //获取购物车
  getCartList: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + "/index.php/addon/DgStore/Api/getCartList.html", { store_id: that.data.store_id }, (data) => {
      var that = this;
      var more_need_maney = parseFloat(that.data.store_data.waimai_limit_jiner).toFixed(2) - data.all_g_price.toFixed(2)
      that.setData({
        cart_list: data.glist,
        all_g_number: data.all_g_number,
        all_g_price: data.all_g_price.toFixed(2),
        all_g_yunfei: data.all_g_yunfei.toFixed(2),
        more_need_maney: more_need_maney.toFixed(2)
      });
      if (data.all_g_number == 0) {
        that.setData({
          cart_list_isshow: false
        });
      }
      _dg.hideToast();
    }, this, { isShowLoading: false });
  },
  //获取店铺信息 
  getStoreInfo: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/getStoreBasicInfo.html', { store_id: that.data.store_id }, (info) => {
      var store_data = info;
      that.data.store_data = store_data;
      that.setData({
        store_data: store_data,
        is_show_load_bg: false
      });
      //外卖 获取商品和购物车
      that.getCartList();
    }, this, { isShowLoading: false });
  },
  //删除购物车
  deleteCartList: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/Api/deleteCartList.html', { store_id: that.data.store_id }, (data) => {
      that.getCartList();
    }, this, { isShowLoading: false });
  },

  //显示隐藏购物车
  cart_list_show_bind: function () {
    var that = this;
    if (that.data.cart_list_isshow == true) {
      that.setData({
        cart_list_isshow: false
      });
    } else {
      that.setData({
        cart_list_isshow: true
      });
    }
  },
  //减少数量
  bind_cart_number_jian: function (e) {
    var that = this;
    var type = e.currentTarget.dataset.type;
    var cart_id = e.currentTarget.dataset.cid;
    var this_goods_id = e.currentTarget.id;
    let goods = that.data.goods_info;
    if (goods.shop_repertory !== null) {
      if (goods.shop_repertory < goods.real_repertory){
        let change_repertory = 'goods_info.shop_repertory'
        that.setData({
          [change_repertory]: goods.shop_repertory + 1
        })
      }
    }
    var requestData = {};
    requestData.store_id = that.data.store_id;
    requestData.gid = this_goods_id;
    requestData.cart_id = cart_id;
    requestData.gnumber = -1;
    requestData.gattr = that.data.goods_attr_select;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/Api/addGoodsCart.html', requestData, (info) => {
      that.getCartList();
    }, this, { isShowLoading: false });
  },
  //增加数量
  bind_cart_number_jia: function (e) {
    var that = this;
    //is_attr==1 是添加有属性的商品，要判断是否有选属性
    var is_attr = e.currentTarget.dataset.is_attr;
    if (is_attr == 1) {
      var goods_attr_select = that.data.goods_attr_select;
      var goods_specification = that.data.goods_specification;
      var is_have_attr = 0;
      for (var value in goods_specification) {
        is_have_attr = 1;
      }
      if (is_have_attr == 1) {
        var is_have_select_attr = 0;
        for (var value in goods_attr_select) {
          is_have_select_attr = 1;
        }
        if (is_have_select_attr != 1) {
          _dg.alert('请选择属性!');
          return;
        }
      }

    }
    //为了使用户感到比较快，先修改本地数据，再请求加载数据库数据
    var type = e.currentTarget.dataset.type;
    var this_goods_id = e.currentTarget.id;
    var cart_id = e.currentTarget.dataset.cid;
    let shop_repertory = that.data.goods_info.shop_repertory;
    if (shop_repertory !== null) {
      if (shop_repertory < 1) {
        _dg.alert('库存不够啦~~')
        return
      } else if (shop_repertory > 0) {
        let change_repertory = 'goods_info.shop_repertory'
        that.setData({
          [change_repertory]: shop_repertory - 1
        })
      }
    }
    var requestData = {};
    requestData.store_id = that.data.store_id;
    requestData.gid = this_goods_id;
    requestData.cart_id = cart_id;
    requestData.gnumber = 1;
    requestData.gattr = that.data.goods_attr_select;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/Api/addGoodsCart.html', requestData, (info) => {
      that.getCartList();
    }, this);
  },
  //清空购物车Click
  cart_delete_bind: function () {
    var that = this;
    _dg.confirm('确认要清空购物车吗?', function (res) {
      if (res.confirm == true) {
        _dg.showToast({
          title: '加载中',
          icon: 'loading',
          duration: 10000
        });
        that.deleteCartList();
      }
    })
  },
  //选择规格
  guige_select_bind: function (e) {
    var that = this;
    var this_g_goods_id = e.currentTarget.id;
    var goods_index = e.currentTarget.dataset.goodsindex;
    that.setData({ goods_attr_select: {} });
    //动态获取商品规格
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/Api/getOneGoodsAttr.html', { goods_id: this_g_goods_id }, (info) => {
      that.setData({
        goods_specification: info.good_attr,
        goods_a_info: info.good_a_info,
        guigeIsShow: true,
        goods_index: goods_index
      });
    }, this, { isShowLoading: false });
  },
  attr_select_clost_bind: function () {
    this.setData({ guigeIsShow: false, goods_attr_select: {} });
  },
  //属性选择
  select_attr_bind: function (e) {
    var that = this;
    var this_attr_id = e.currentTarget.id;
    var this_attr_name = e.currentTarget.dataset.type;

    var datas = that.data.goods_specification;

    var this_spec_price = 0;
    var a_datas = that.data.goods_attr_select;
    var g_datas = that.data.goods_a_info;
    for (var i = 0; i < datas.length; i++) {
      //首先判断进入对应的属性类  
      if (datas[i].name == this_attr_name) {
        a_datas[datas[i].name] = null;
        for (var j = 0; j < datas[i].values.length; j++) {
          datas[i].values[j].ischeck = false;
          if (datas[i].values[j].id == this_attr_id) {
            datas[i].values[j].ischeck = true;
            a_datas[datas[i].name] = this_attr_id;
          }
        }
      }
    }

    for (var i = 0; i < datas.length; i++) {
      for (var j = 0; j < datas[i].values.length; j++) {
        if (datas[i].values[j].ischeck == true) {
          if (datas[i].values[j].format_price > 0) {
            this_spec_price = this_spec_price + datas[i].values[j].format_price;
          }
        }
      }
    }
    g_datas.shop_price = this_spec_price;
    that.setData({
      goods_specification: datas,
      goods_attr_select: a_datas,
      goods_a_info: g_datas
    })


  },
  //购物车下单
  goods_order_bind: function () {
    var that = this;
    //如果是外卖 则限制配送区域
    if (that.data.store_data.waimai_limit_juli > 0) {
      //获取位置信息
      _dg.showToast({
        title: '配送区域验证中',
        icon: 'loading',
        duration: 10000
      });
      _dg.getLocation({
        type: 'gcj02',
        success: function (res) {
          _dg.hideToast();
          var requestData = {};
          requestData.store_id = that.data.

            store_id;
          requestData.ws_lat = res.latitude;
          requestData.ws_lng = res.longitude;
          requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/Api/checkPeisongLimit.html', requestData, (juliInfo) => {
            that.comfirm_goods_order();
          }, that, {});
        },
        fail: function () {
          //弹出系统设置
          _dg.openSetting({
            success: (res) => {
              if (res.authSetting['scope.userLocation'] == false) {
                _dg.alert("请允许地理位置授权", function (res) {
                  that.goods_order_bind();
                })
              } else {
                that.goods_order_bind();
              }
            }
          });
          return false;
        }
      });
    } else {
      that.comfirm_goods_order();
    }
  },

  //外卖购物车下单
  comfirm_goods_order: function () {
    var that = this;
    _dg.navigateTo({
      url: '../store-order-sure/index?store_id=' + that.data.store_id + '&buy_type=2'
    });

  },
  select_goods_num(e) {
    console.log(e)
    const that = this
    let goods_num = e.detail.value
    if (!goods_num || goods_num < 0) {
      return
    }
    let cartindex = e.currentTarget.dataset.cartindex
    let this_goods_id = e.currentTarget.id
    let cart_id = e.currentTarget.dataset.cid;
    let change_num
    let cart_list = that.data.cart_list
    let current_cart_num = cart_list[cartindex]['goods_number']
    change_num = goods_num - current_cart_num

    let requestData = {};
    requestData.store_id = that.data.store_id
    requestData.gid = this_goods_id
    requestData.cart_id = cart_id
    requestData.gnumber = change_num
    requestData.gattr = that.data.goods_attr_select
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/Api/addGoodsCart.html', requestData, (info) => {
      that.getCartList()
    }, this, { isShowLoading: false });
  },
})