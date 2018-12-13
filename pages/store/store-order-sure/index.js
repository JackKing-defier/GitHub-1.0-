const requestUtil = require('../../../utils/requestUtil');
import _util from '../../../utils/util';
const _DgData = require('../../../utils/data');
const $ = require('../../../utils/underscore');
const s_common = require('../store-common/common');
var app = getApp();
Page({
  data: {
    goods_id: '',
    source_data: [],
    store_info: [],
    data_list: [],
    this_store_id: 0,
    this_table_id: 0,
    buy_type: 0,//1单个商品购买2购物车购买 
    order_type: 0,//1自提订单2外卖订单
    all_g_number: 0,
    is_show_address: false,
    pay_type_index: 1,
    u_lat: '',
    u_lng: '',
    peisong:false,

    btn_submit_disabled: false,
    submitIsLoading: false,
    glo_is_load: true,
    select_pay_type: false,
    is_show_remark: 1,

    address_info: '',
    goodsNum: 1,


    is_show_load_bg: true,//控制整个界面显示，没有加载好则显示默认背景

    shop_amount: 0,//购物金额
    pay_amount: 0,//实际支付金额
    //优惠券部分
    mycard: null,
    usecard: null,

    is_show_myCards: false,
    select_card_index: -1,
    can_peisong: false,
  },
  onShow: function (options) {

  },
  onLoad: function (options) {
    var that = this;
    _util.trySyncWechatInfo();
    that.getStoreConfig();
    var buy_type = options.buy_type;//2
    var store_id = options.store_id;

    //获取默认地址信息
    var address_info = {};
    _util.getDefaultAddress(function (e) {
      if (e.length != 0) {
        that.data.address_info = e;
      }
    },true);


    var name = wx.getStorageSync('USERNAME')
    var tel = wx.getStorageSync('USERTEL')
    that.setData({
      this_store_id: store_id,
      buy_type: buy_type,
      name: name,
      tel: tel,
    });

    //
    //1单个商品2购物车商品
    if (buy_type == 2) {
      that.getStoreInfo();
    }
    else {
      //单个商品购买目前只有团购
      var goods_id = options.goods_id;
      that.getGoodsInfo();
    }
    //获取卡券列表
    that.getmycard();
  },
  //配送方式选择
  delivery_method_select(e) {
    var that = this;
    var order_type = e.currentTarget.dataset.delivery_type

    if (order_type == 2) {
      var addressInfo = that.data.address_info;
      if (addressInfo.latitude && addressInfo.longitude) {
        let requestData = {}
        requestData.store_id = that.data.this_store_id
        requestData.ws_lng = addressInfo.longitude
        requestData.ws_lat = addressInfo.latitude
        that.getPeisongCharge(requestData)
      }
      if (addressInfo['mobile'] && addressInfo['name'] && addressInfo['longitude'] && addressInfo['latitude']) {
        that.setData({
          address_info: addressInfo
        });
          let requestData = {}
          requestData.store_id = that.data.this_store_id
          requestData.ws_lng = addressInfo.longitude
          requestData.ws_lat = addressInfo.latitude
          that.getPeisongCharge(requestData)
        /* var qqmapsdk = _util.getMapSdk()
        qqmapsdk.geocoder({
          address: addressInfo.all_address,
          success: function (res) {
            that.data.u_lat = res.result.location.lat
            that.data.u_lng = res.result.location.lng
          },
          fail: function (res) {
            wx.getLocation({
              type: 'wgs84',
              success: function (res) {
                that.data.u_lat = res.latitude
                that.data.u_lng = res.longitude
              }
            })
          },

        }); */
      }
      else
      {
        that.select_address_bind();
      }


    }
    that.setData({
      order_type: order_type
    });
    that.calculatePayTotal();
  },
  getStoreConfig: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php?s=/addon/DgStore/Api/getStoreConfig.html', {}, (info) => {
      that.setData({
        store_type: info.store_type,
        is_member: info.is_open_member
      });
    });
  },
  // 获取商品详情
  getGoodsInfo: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php?s=/addon/DgStore/Api/getGoodsInfo.html', { store_id: that.data.this_store_id, goods_id: that.data.goods_id }, (data) => {
      var shop_price = data.shop_price
      that.data.shop_amount = parseFloat(shop_price).toFixed(2);
      var pay_amount = parseFloat(shop_price).toFixed(2);
      that.setData({
        goods_data: data,
        glo_is_load: false,
        pay_amount: pay_amount,
        shop_amount: parseFloat(that.data.shop_amount)
      });
    });
  },
  //显示支付类型选择
  go_select_paytype_bind: function () {
    var that = this;
    if (that.data.order_type == 0 || that.data.order_type == undefined) {
      wx.showModal({
        title: '提示',
        content: "请选择同城配送或者到店自提",
        showCancel: false,
        success: function (res) {
        }
      });
      return;
    }
    if (that.data.select_pay_type == true) {
      that.setData({
        select_pay_type: false,
        is_show_remark: 1
      });
    } else {
      that.setData({
        select_pay_type: true,
        is_show_remark: 0
      });
    }
  },
  //支付方式选择
  payTypeChange: function (e) {
    var index = e.detail.value;
    this.setData({
      pay_type_index: index,
    });
  },
  //店内商品改变商品数量
  goods_number_change: function (e) {
    var that = this;
    that.setData({
      usecard: null,
      select_card_index: -1,
    })
    if (e.currentTarget.id == 'jia') {
      var num = that.data.goodsNum + 1;
      var shop_price = that.data.goods_data.shop_price
      that.data.shop_amount = parseFloat(shop_price).toFixed(2) * parseInt(num);
      that.setData({
        goodsNum: num,
      });
    }
    else {
      if (that.data.goodsNum > 1) {
        var num = that.data.goodsNum - 1;
        var shop_price = that.data.goods_data.shop_price
        that.data.shop_amount = parseFloat(shop_price).toFixed(2) * parseInt(num);
        that.setData({
          goodsNum: num,
        });
      }

    }
    that.calculatePayTotal();
  },
  // 计算配送费用
  getPeisongCharge: function (requestData) {
    let that = this;
    that.setData({
      can_peisong: false
    })
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php?s=/addon/DgStore/Api/getPeisongCharge.html', requestData, (juliInfo) => { 
        let waimai_peisong_jiner = 'store_info.waimai_peisong_jiner';
        if (juliInfo >= 0) {
          that.setData({
            can_peisong: true
          })
        }
        that.setData({
          [waimai_peisong_jiner]: juliInfo,
          peisong: true
        })
      that.calculatePayTotal(); // 获取配送费用，能获取地址经纬度的时候
    }, that, {isShowLoading: true})
  },
  //选择收货地址
  select_address_bind: function () {
    var that = this;
    _util.chooseAddress(function (e) {
      that.setData({ address_info: e });
      if (e.latitude && e.longitude) {
        let requestData = {}
        requestData.store_id = that.data.this_store_id
        requestData.ws_lng = e.longitude
        requestData.ws_lat = e.latitude
        that.getPeisongCharge(requestData)
      }
      console.log(e)

    },true);

  },
  //提交订单并支付
  order_formSubmit: function (e) {
    var that = this;
    var order_info = e.detail.value;
    order_info.store_id = that.data.this_store_id;
    order_info.order_type = that.data.order_type;
    if (that.data.order_type == 1) {
      //自提需要填写取货人手机号姓名
      var addressInfo = {};
      addressInfo.telNumber = order_info.tel
      addressInfo.userName = order_info.name
      if (!addressInfo.telNumber || !addressInfo.userName) {
        wx.showModal({
          title: '提示',
          content: "请填写取货人信息",
          showCancel: false,
          success: function (res) {
          }
        });
        return;
      }
      else {
        var name = wx.setStorageSync("USERNAME", addressInfo.userName)
        var tel = wx.setStorageSync('USERTEL', addressInfo.telNumber)
      }
      // order_info.wx_address = JSON.stringify(addressInfo);
      order_info.wx_address = addressInfo;
    }
    else if (that.data.order_type == 2) {
      var addressInfo = that.data.address_info;
      if (!addressInfo['mobile'] || !addressInfo['name']) {
        wx.showModal({
          title: '提示',
          content: "请填写收货人信息",
          showCancel: false,
          success: function (res) {
          }
        });
        return;
      }
      if (!that.data.can_peisong) {
        wx.showModal({
          title: '提示',
          content: "收货地址不在配送范围内",
          showCancel: false,
          success: function (res) {
          }
        });
        return;
      }
      //外卖
      var address_info = that.data.address_info;
      let longitude = Number(address_info.longitude)
      let latitude = Number(address_info.latitude)
      if (!longitude || !latitude){
        wx.showModal({
          title: '提示',
          content: "收货地址定位不准确请重新选择地址",
          showCancel: false,
          success: function (res) {
          }
        });
        return;
      }
       var address_data={};
      address_data['userName'] = address_info['name'];
      address_data['provinceName'] = address_info['province'];
      address_data['cityName'] = address_info['city'];
      address_data['countyName'] = address_info['area'];
      address_data['detailInfo'] = address_info['all_address'];
      address_data['nationalCode'] = address_info['postcode'];
      address_data['telNumber'] = address_info['mobile'];

      order_info.wx_address = address_data;
      order_info.u_lat = address_info.latitude;
      order_info.u_lng = address_info.longitude;
    }
    that.setData({
      btn_submit_disabled: true,
      submitIsLoading: true
    });
    var select_card_index = that.data.select_card_index;
    var shop_amount = parseFloat(that.data.shop_amount).toFixed(2);
    var pay_amount = parseFloat(that.data.pay_amount).toFixed(2)
    order_info.pay_amount = pay_amount;
    order_info.shop_amount = shop_amount;


    //如果选择了优惠券传优惠券信息
    if (select_card_index >= 0) {
      order_info.coupon_discount = that.data.usecard['discount'];
      order_info.coupon_id = that.data.usecard['id'];
      order_info.coupon_type = that.data.usecard['type'];
      order_info.is_coupon = 1;
    }
    var alert_content ='确定支付吗';
    if (order_info['pay_type']==3){
      var alert_content = '确定货到付款吗';
    }
    wx.showModal({
      title: '提示',
      content: alert_content,
      success: function (res) {
        if (res.confirm) {
          that.makeOrder(order_info);
        }
        else {
          that.setData({
            btn_submit_disabled: false,
            submitIsLoading: false
          });
        }

      }
    });

  },
  //生成订单
  makeOrder: function (order_info) {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php?s=/addon/DgStore/StorePayApi/postOrder.html', order_info, (data) => {
      wx.hideToast();
      that.setData({
        btn_submit_disabled: false,
        submitIsLoading: false
      });
      if (data['type'] == 1) {
        //使用优惠券直接0元购买
        wx.showModal({
          title: '提示',
          content: "订单支付成功",
          confirmText: "查看订单",
          showCancel: false,
          success: function (res) {
            wx.redirectTo({
              url: '../store-order-list/index'
            });
          }
        });
      }
      else if (data['type'] == 2) {
        //余额不足去充值
        wx.navigateTo({
          url: '/pages/user/mcard/recharge',
        });
      }
      else if (data['type'] == 3) {
        //余额支付
        wx.showModal({
          title: '提示',
          content: "订单支付成功",
          confirmText: "查看订单",
          showCancel: false,
          success: function (res) {
            wx.redirectTo({
              url: '../store-order-list/index'
            });
          }
        });
      }
      else if (data['type'] == 4) {
        //使用优惠券直接0元购买
        wx.showModal({
          title: '提示',
          content: "下单成功",
          confirmText: "查看订单",
          showCancel: false,
          success: function (res) {
            wx.redirectTo({
              url: '../store-order-list/index'
            });
          }
        });
      }
      else {
        //微信支付
        wx.requestPayment({
          'timeStamp': data.timeStamp,
          'nonceStr': data.nonceStr,
          'package': data.package,
          'signType': 'MD5',
          'paySign': data.paySign,
          'success': function (res) {
            wx.showModal({
              title: '提示',
              content: "订单支付成功",
              confirmText: "查看订单",
              showCancel: false,
              success: function (res) {
                wx.redirectTo({
                  url: '../store-order-list/index'
                });
              }
            });
          },
          'fail': function (res) {
            wx.showModal({
              title: '提示',
              content: "支付失败,请稍后到我的订单中可继续支付",
              showCancel: false,
              success: function (res) {
                wx.redirectTo({
                  url: '../store-order-list/index'
                });
                // wx.redirectTo({
                //   url: '../store-order-info/index?oid=' + data.order_id
                // });
              }
            });
          }
        })
      }

    }, { completeAfter: that.makeOrderComplete() });
  },
  makeOrderComplete: function () {
    var that = this;
    that.setData({
      btn_submit_disabled: false,
      submitIsLoading: false
    });
  },
  //获取店铺信息 包含店铺商品
  getStoreInfo: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php?s=/addon/DgStore/StoreApi/getStoreInfo.html', { store_id: that.data.this_store_id }, (data) => {

      data.store_info.waimai_peisong_jiner = parseInt(data.store_info.waimai_peisong_jiner);
      var store_info = data.store_info;
      if (store_info.store_is_waimai == 1 && store_info.store_is_diannei == 0) {
        var order_type = 2;
        that.select_address_bind();
      }
      else if (store_info.store_is_waimai == 0 && store_info.store_is_diannei == 1) {
        var order_type = 1;
      }
      else {
        var order_type = 0;
      }

      that.setData({
        is_show_load_bg: false,
        source_data: data,
        store_info: store_info,
        order_type: order_type,
        store_yingye_status_val: data.store_info.is_yingye_status
      });
      //请求购物车信息
      that.getCartList();
    });
  },
  //获取购物车
  getCartList: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + "/index.php?s=/addon/DgStore/StoreApi/getShopCart", { store_id: that.data.this_store_id }, (data) => {
      var that = this;
      var more_need_maney = parseFloat(that.data.store_info.waimai_limit_jiner).toFixed(2) - data.all_g_price.toFixed(2)
      that.setData({
        data_list: data,
        all_g_number: data.all_g_number,
        glo_is_load: false,
        shop_amount: data.all_g_price,
        more_need_maney: more_need_maney
      });
      that.calculatePayTotal();
    });
  },
  //计算支付金额
  calculatePayTotal: function () {

    // var pay_amount = parseFloat(shop_price * num).toFixed(2);
    var that = this;
    var usecard = that.data.usecard;
    var shop_amount = parseFloat(that.data.shop_amount);
    if (usecard != null && shop_amount > 0) {
      var discount = parseFloat(usecard['discount']);
      //使用优惠券
      if (usecard.type == 0) {
        // 代金券
        parseFloat(that.data.store_info.waimai_limit_jiner).toFixed(2)
        if (that.data.order_type == 2) {
          //外卖商品还要加上运费
          var yunfei = that.data.store_info.waimai_peisong_jiner;
          var amount = parseFloat(shop_amount) + parseFloat(yunfei);
        }
        else {
          var amount = parseFloat(shop_amount);
        }

        var amount = amount - parseFloat(discount);

        //如果用券后金额小于0则为0
        if (amount < 0) {
          amount = 0;
        }

      }
      else if (usecard.type == 1) {
        // 折扣券
        var amount = parseFloat(shop_amount) * parseFloat(discount / 10);

        if (that.data.order_type == 2) {
          //外卖还要加上运费
          var yunfei = that.data.store_info.waimai_peisong_jiner;
          var amount = amount + parseFloat(yunfei);
        }

      }
    }
    else {
      //不使用优惠券
      var amount = shop_amount;
      if (that.data.order_type == 2) {
        //外卖还要加上运费
        var yunfei = that.data.store_info.waimai_peisong_jiner;
        var amount = amount + parseFloat(yunfei);
      }
    }

    if (amount <= 0) {
      amount = 0;
    }

    var amount = new Number(amount + 10).toFixed(2);//四舍五入之前加10解决toFixed函数四舍五入的bug  
    var amount = new Number(amount - 10).toFixed(2);

    var shop_amount = new Number(shop_amount + 10).toFixed(2);//四舍五入之前加1  
    var shop_amount = new Number(shop_amount - 10).toFixed(2);
    that.setData({
      pay_amount: amount,
      shop_amount: shop_amount
    })
  },
  // ---------------------------优惠券部分 start-------------------------------
  //选取优惠券
  selectCard: function (e) {
    var that = this;
    var index = e.currentTarget.dataset.index
    if (index != -1) {

    }
    if (index == -1) {
      that.setData({
        usecard: null
      })
    }
    else {
      var shop_amount = parseFloat(that.data.shop_amount);
      var mycard = that.data.mycard;
      var usetype = parseInt(mycard[index]['type']);
      var discount = parseFloat(mycard[index]['discount']);
      var full_available = parseFloat(mycard[index]['full_available']);
      if (shop_amount < full_available) {
        var title = '满' + full_available + '元才能使用哦';
        wx.showModal({
          title: '提示',
          content: title,
        })
        return;
      }
      that.setData({
        usecard: mycard[index]
      })
    }
    that.setData({
      select_card_index: index
    })
    that.calculatePayTotal();
  },
  //获取我的卡券
  getmycard: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + "/index.php?s=/addon/DgStore/StoreApi/getMyCoupons.html", { available: 1, _r: 100, store_id: that.data.this_store_id }, (data) => {
      $(data).map((item) => {
        item.use_start_date = _util.format(item.use_start_time * 1000, "yyyy-MM-dd");
        item.use_end_date = _util.format(item.use_end_time * 1000, "yyyy-MM-dd");
        return item;
      });
      that.setData({
        mycard: data
      })
    });
  },
  // 隐藏我的卡券选择
  hideMyCards: function () {
    var that = this;
    that.setData({
      is_show_myCards: false,
      is_show_remark: 1
    })
  },
  //显示我的卡券
  showMyCards: function (e) {
    var couponid = e.currentTarget.dataset.id
    var that = this;
    that.setData({
      is_show_myCards: true,
      is_show_remark: 0
    })
  },
  // --------------------------优惠券部分 end-------------------------------
})