const app = getApp();
const requestUtil = require('../../../utils/requestUtil');
const _DgData = require('../../../utils/data');
import _dg from '../../../utils/dg';

Page({
  data: {
    store_data: false,
    goods_data: false,
    this_store_id: 0,
    select_cate_id: '',
    tabTit: 1,
    goods_cates: [],
    comments: [],
    //用来控制是立即购买 还是购物车选好了

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

    scroll_to_goods_id: '',
    is_show_load_bg: true,//控制整个界面显示，没有加载好则显示默认背景

    template_id: 0
  },
  //设置分享
  onShareAppMessage: function () {
    var that = this
    return {
      title: '',
      desc: '',
      path: '/pages/store/store-goods-list/index?store_id=' + that.data.this_store_id
    }
  },
  onLoad: function (options) {
    var that = this;
    var store_id = options.store_id || 0;
    that.setData({
      this_store_id: store_id,
    });
    var cate_id = options.cate_id;
    if (cate_id) {
      _dg.setStorage({
        key: "select_cate_id",
        data: cate_id
      })
    }
    var scroll_to_goods_id = options.goods_id;
    if (scroll_to_goods_id) {
      that.setData({
        'scroll_to_goods_id': 'goods_' + scroll_to_goods_id
      });
    }
  },
  onShow: function () {
    var that = this;
    if (that.data.this_store_id <= 0 || !that.data.this_store_id) {
      that.getSingleStoreId();
    }
    else {
      this.getSourceData();
    }


  },
  scanCode: function () {
    var that = this;
    wx.scanCode({
      success: (res) => {
        // that.data.order_number = res.result;
        console.log(res.result);


      }
    })
  },
  //获取商品信息
  getGoodsInfo: function (bar_code) {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + "/index.php/addon/DgStore/storeApi/getGoodsDetails.html", { bar_code: bar_code, store_id: this.data.this_store_id }, (data) => {
      var that = this;
      console.log(data);
      // that.setData({
      //   goods_info: data,
      //   is_show_load_bg: false
      // });
    });
  },
  getSingleStoreId: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/getSingleStoreId', {}, (info) => {
      that.setData({
        this_store_id: info.store_id,
      });
      this.getSourceData();
    }, this, { isShowLoading: false });
  },
  //获取商品和购物车数据
  getSourceData: function () {
    var that = this;
    that.getStoreInfo();
    that.getGoodsCates();
  },
  //获取店铺商品分类列表
  getGoodsCates: function () {
    var that = this;
    var store_id = that.data.this_store_id;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/getGoodsCates', { store_id: store_id }, (info) => {
      that.data.goods_cates = info;
      that.setData({
        goods_cates: that.data.goods_cates,
        is_show_load_bg: false
      });
      if (!that.data.select_cate_id) {
        try {
          var value = _dg.getStorageSync('select_cate_id')
          var is_include = 0;
          for (var i in that.data.goods_cates) {
            var cate_info = that.data.goods_cates[i];
            if (cate_info['id'] == value) {
              is_include = 1;
            }
          }
          if (value && is_include == 1) {
            that.setData({
              select_cate_id: value,
            });
          }
          else {
            that.setData({
              select_cate_id: info[0]['id'],
            });
          }
        } catch (e) {
          // Do something when catch error
          if (!that.data.select_cate_id) {
            that.setData({
              select_cate_id: info[0]['id'],
            });
          }
        }
      }
      //获取默认第一个分类商品

      that.getStoreGoods();
    }, this, { isShowLoading: false });
  },
  //获取商品列表
  getStoreGoods: function () {
    var that = this;
    var store_id = that.data.this_store_id;
    var cate_id = that.data.select_cate_id;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/getStoreGoods', { store_id: store_id, cate_id: cate_id, consume_type: 1 }, (info) => {
      that.data.goods_data = info;
      that.setData({
        goods_data: that.data.goods_data,
        is_show_load_bg: false,
        scroll_to_view: that.data.scroll_to_goods_id
      });
      if (that.data.scroll_to_goods_id) {
        that.setData({
          scroll_to_view: 'goods_' + that.data.scroll_to_goods_id
        });
      }
    });
  },
  //获取店铺信息 
  getStoreInfo: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/getStoreBasicInfo.html', { store_id: that.data.this_store_id }, (info) => {
      var store_data = info;
      that.data.store_data = store_data;
      that.setData({
        template_id: info.goods_list_template_id,
        store_data: store_data,
        is_show_load_bg: false
      });
      //外卖 获取商品和购物车
      that.getCartList();
      //获取评论
      that.getComments();
    }, this, { isShowLoading: false });
  },
  //获取店铺评论列表
  getComments: function () {
    var that = this;
    var store_id = that.data.this_store_id;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/getComments', { store_id: store_id, }, (info) => {
      that.data.comments = info;
      that.setData({
        comments: that.data.comments,
      });
    }, this, { isShowLoading: false });
  },
  //跳转商品详情
  goods_info_bind: function (e) {
    var that = this;
    _dg.navigateTo({
      url: '../store-goods-details/index?goods_id=' + e.currentTarget.id + '&store_id=' + that.data.this_store_id
    });
  },
  //切换导航  商品或评价
  tabSubBind: function (e) {
    var that = this;
    var this_target = e.target.id;
    that.setData({
      tabTit: this_target
    });
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
  //获取购物车
  getCartList: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + "/index.php/addon/DgStore/Api/getCartList.html", { store_id: that.data.this_store_id }, (data) => {
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
  //删除购物车
  deleteCartList: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/Api/deleteCartList.html', { store_id: that.data.this_store_id }, (data) => {
      that.getSourceData();
    }, this, { isShowLoading: false });
  },
  //类别选择
  changeCate: function (e) {
    var that = this;
    var id = e.currentTarget.dataset.cate_id;
    _dg.setStorage({
      key: "select_cate_id",
      data: id
    })
    that.setData({
      select_cate_id: id,
      goods_data: that.data.goods_data
    });
    //获取该分类的商品
    that.getStoreGoods();
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
    //为了使用户感到比较快，先修改本地数据，再请求加载数据库数据
    var goodsindex = e.currentTarget.dataset.goodsindex;
    var type = e.currentTarget.dataset.type;
    var cart_id = e.currentTarget.dataset.cid;
    var this_goods_id = e.currentTarget.id;
    if (goodsindex >= 0) {
      var goods_data = that.data.goods_data;
      var goods_number = goods_data[goodsindex]['cart_goods_num'];
      if (goods_number >= 1) {
        goods_data[goodsindex]['cart_goods_num'] = parseInt(goods_number) - 1;
      }



      if (goods_data[goodsindex].shop_repertory !== null) {
        if (goods_data[goodsindex].shop_repertory < goods_data[goodsindex].real_repertory) {
          goods_data[goodsindex].shop_repertory = goods_data[goodsindex].shop_repertory + 1
        }
      }
      that.setData({
        goods_data: goods_data,
      });
    }
      var requestData = {};
      requestData.store_id = that.data.this_store_id;
      requestData.gid = this_goods_id;
      requestData.cart_id = cart_id;
      requestData.gnumber = -1;
      requestData.gattr = that.data.goods_attr_select;
      requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/Api/addGoodsCart.html', requestData, (info) => {
        that.getCartList();
        if (type == 1) {
          that.getStoreGoods();
        }
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
      console.log(goods_attr_select);
      console.log(goods_specification);

      var select_attr_length = Object.keys(goods_attr_select).length;
      if (select_attr_length < goods_specification.length) {
        _dg.alert('请选择属性!');
        return;
      }

    }
    //为了使用户感到比较快，先修改本地数据，再请求加载数据库数据
    var goodsindex = e.currentTarget.dataset.goodsindex;
    var type = e.currentTarget.dataset.type;
    var this_goods_id = e.currentTarget.id;
    var cart_id = e.currentTarget.dataset.cid;
    if (goodsindex >= 0) {
      var goods_data = that.data.goods_data;
      var goods_number = goods_data[goodsindex]['cart_goods_num'];
      goods_data[goodsindex]['cart_goods_num'] = parseInt(goods_number) + 1;
      if (goods_data[goodsindex].shop_repertory !== null) {
        if (goods_data[goodsindex].shop_repertory < 1) {
          _dg.alert('库存不够啦~~')
          return
        } else if (goods_data[goodsindex].shop_repertory > 0) {
          goods_data[goodsindex].shop_repertory = goods_data[goodsindex].shop_repertory - 1
        }
      }
      that.setData({
        goods_data: goods_data,
      });
    }
      var requestData = {};
      requestData.store_id = that.data.this_store_id;
      requestData.gid = this_goods_id;
      requestData.cart_id = cart_id;
      requestData.gnumber = 1;
      requestData.gattr = that.data.goods_attr_select;
      requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/Api/addGoodsCart.html', requestData, (info) => {
        that.getCartList();
        if (type == 1) {
          that.getStoreGoods();
        }
      }, this, { isShowLoading: false });

  },
  select_goods_num(e) {
    console.log(e)
    const that = this
    let goods_num = e.detail.value
    if (!goods_num || goods_num < 0) {
      return
    }
    let goodsindex = e.currentTarget.dataset.goodsindex
    let cartindex = e.currentTarget.dataset.cartindex
    let goods_data = that.data.goods_data
    var type = e.currentTarget.dataset.type

    let this_goods_id = e.currentTarget.id
    let cart_id = e.currentTarget.dataset.cid;
    let change_num
    if (parseInt(goodsindex) >= 0) {
      let current_cart_num = goods_data[goodsindex]['cart_goods_num'];
      change_num = goods_num - current_cart_num
      goods_data[goodsindex]['cart_goods_num'] = parseInt(current_cart_num) + change_num
      if (goods_data[goodsindex]['shop_repertory'] !== null) {
        if (goods_data[goodsindex]['cart_goods_num'] > goods_data[goodsindex]['real_repertory']) {
          _dg.alert('库存不够啦~~')
          return
        } else {
          goods_data[goodsindex]['shop_repertory'] = goods_data[goodsindex]['real_repertory'] - goods_data[goodsindex]['cart_goods_num']
        }
      }
      that.setData({
        goods_data: goods_data,
      });
    } else {
      let cart_list = that.data.cart_list
      let current_cart_num = cart_list[cartindex]['goods_number']
      change_num = goods_num - current_cart_num
      cart_list[cartindex]['goods_number'] = parseInt(current_cart_num) + change_num
      if (cart_list[cartindex]['shop_repertory'] !== null) {
        if (cart_list[cartindex]['cart_goods_num'] > cart_list[cartindex]['real_repertory']) {
          _dg.alert('库存不够啦~~')
          return
        } else {
          cart_list[cartindex]['shop_repertory'] = cart_list[cartindex]['real_repertory'] - cart_list[cartindex]['cart_goods_num']
        }
      }
      that.setData({
        cart_list: cart_list,
      })
    }

    let requestData = {};
    requestData.store_id = that.data.this_store_id
    requestData.gid = this_goods_id
    requestData.cart_id = cart_id
    requestData.gnumber = change_num
    requestData.gattr = that.data.goods_attr_select
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/Api/addGoodsCart.html', requestData, (info) => {
      that.getCartList();
      if (type == 1) {
        that.getStoreGoods();
      }
    }, this, { isShowLoading: false });
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
  //外卖购物车下单
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
          requestData.store_id = that.data.this_store_id;
          requestData.ws_lat = res.latitude;
          requestData.ws_lng = res.longitude;
          that.comfirm_goods_order();
          /* requestUtil.get(_DgData.duoguan_host_api_url + '/index.php?s=/addon/DgStore/Api/checkPeisongLimit.html', requestData, (juliInfo) => {
            that.comfirm_goods_order();
          }, that, {}); 
          不在此请求当前用户定位地址
          */
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
  //跳转优惠券列表
  coupon_list_bind: function (e) {
    var that = this;
    _dg.navigateTo({
      url: '/pages/store/store-coupon/index?list_type=1&store_id=' + that.data.this_store_id
    });
  },
  //活动公告
  huodong_info_bind: function () {
    var that = this;
    _dg.navigateTo({
      url: '../store-active/index?&store_id=' + that.data.this_store_id
    });
  },
  redirectToStoreHome: function () {
    var that = this;
    _dg.reLaunch({
      url: '/pages/store/store-info/index?&store_id=' + that.data.this_store_id
    });
  },
  //配送验证手机号
  comfirm_goods_order: function () {
    var that = this;
    _dg.navigateTo({
      url: '../store-order-sure/index?store_id=' + that.data.this_store_id + '&buy_type=2'
    });

    // //是否需要手机验证
    // if (that.data.store_data.store_is_sms_check == 1) {
    //   //读取用户手机号是否已验证
    //   requestUtil.get(_DgData.duoguan_host_api_url + '/index.php?s=/addon/DgUser/Api/getUserInfo.html', {}, (userinfodata) => {
    //     if (userinfodata.u_phone_status == 0) {
    //       //跳转到手机认证
    //       _dg.navigateTo({
    //         url: '../phone-binding/index'
    //       });
    //       return false;
    //     } else {
    //       that.setData({
    //         submitIsLoading: true,
    //       });
    //       _dg.navigateTo({
    //         url: '../store-order-sure/index?store_id=' + that.data.this_store_id + '&consume_type=2'
    //       });
    //     }
    //   }, that, {});
    // } else {
    //   that.setData({
    //     submitIsLoading: true,
    //   });
    //   _dg.navigateTo({
    //     url: '../store-order-sure/index?store_id=' + that.data.this_store_id + '&consume_type=2'
    //   });
    // }
  },
  //图片放大
  img_max_bind: function (e) {
    var that = this;
    var img_max_url = e.currentTarget.dataset.url;
    var this_img_key = e.currentTarget.dataset.key;
    var all_img_num = that.data.source_data.comment_list[this_img_key].imglist.length;
    var durls = [];
    for (var i = 0; i < all_img_num; i++) {
      durls[i] = that.data.source_data.comment_list[this_img_key].imglist[i].imgurl;
    }
    _dg.previewImage({
      current: img_max_url,
      urls: durls
    })
  },
  //下拉刷新
  onPullDownRefresh: function () {
    var that = this;
    that.setData({
      submitIsLoading: false,
    })
    that.getSourceData();
    setTimeout(() => {
      _dg.stopPullDownRefresh()
    }, 1000);
  },

})