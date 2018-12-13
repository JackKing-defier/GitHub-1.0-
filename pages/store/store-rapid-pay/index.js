const app = getApp();
const util = require('../../../utils/util');
const requestUtil = require('../../../utils/requestUtil');
const $ = require('../../../utils/underscore');
const _DgData = require('../../../utils/data');
const WxParse = require('../../../wxParse/wxParse.js');// pages/details/details.js
const s_common = require('../store-common/common');
import _dg from '../../../utils/dg';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    store_id: 0,
    mycard: null,
    usecard: null,
    shop_amount: 0,//购物金额
    pay_amount: 0,//实际支付金额
    is_show_myCards: false,
    select_card_index: -1,
    disabled: false,
    pay_type_index: 1,

  },

  /**
   * 生命周期函数--监听页面加载  
   */
  onLoad: function (e) {
    var that = this;
    this.data.store_id = e.store_id||0;
    this.getStoreConfig();
  },
  getSingleStoreId: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/getSingleStoreId', {}, (info) => {
      that.setData({
        store_id: info.store_id,
      });
      util.trySyncWechatInfo();
      this.getmycard();
    }, this, { isShowLoading: false });
  },
  getStoreConfig: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/Api/getStoreConfig.html', {}, (info) => {
      that.setData({
        store_type: info.store_type,
        is_member: info.is_open_member
      });
      if (that.data.store_id <= 0 || !that.data.store_id) {
        if(info.store_type==1){
          //单门店
          that.getSingleStoreId();
        }else{
          //多门店  直接报错
          _dg.alert('信息错误请联系技术支持');
      
        }
      }
      else {
        util.trySyncWechatInfo();
        this.getmycard();
      }
   
    });
  },
  //计算支付金额
  calculatePayTotal: function () {
    var that = this;
    var usecard = that.data.usecard;
    var shop_amount = parseFloat(that.data.shop_amount);
    if (usecard != null && shop_amount > 0) {
      var discount = parseFloat(usecard['discount']);
      //使用优惠券
      if (usecard.type == 0) {
        // 代金券
        // parseFloat(that.data.store_data.waimai_limit_jiner).toFixed(2)
        var amount = parseFloat(shop_amount) - parseFloat(discount);
        //如果用券后金额小于0则为0
        if (amount < 0) {
          amount = 0;
        }
        that.setData({
          pay_amount: amount.toFixed(2)
        })
      }
      else if (usecard.type == 1) {
        // 折扣券
        var amount = parseFloat(shop_amount) * parseFloat(discount / 10);
        that.setData({
          pay_amount: amount.toFixed(2)
        })
      }
    }
    else {
      //不使用优惠券
      if (shop_amount <= 0) {
        that.setData({
          pay_amount: 0
        })
      }
      else {
        that.setData({
          pay_amount: parseFloat(shop_amount).toFixed(2)
        })
      }

    }
  },
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
        _dg.alert(title);
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
    requestUtil.get(_DgData.duoguan_host_api_url + "/index.php/addon/DgStore/StoreApi/getMyCoupons.html", { available: 1, _r: 100, store_id: that.data.store_id }, (data) => {
      $(data).map((item) => {
        item.use_start_date = util.format(item.use_start_time * 1000, "yyyy-MM-dd");
        item.use_end_date = util.format(item.use_end_time * 1000, "yyyy-MM-dd");
        return item;
      });
      that.setData({
        mycard: data
      })
    });
  },

  //支付方式选择
  payTypeChange: function (e) {
    var index = e.detail.value;
    this.setData({
      pay_type_index: index,
    });
  },
  //支付
  pay: function (e) {
    var that = this;
    var fromdata = e.detail.value;
    var select_card_index = that.data.select_card_index;
    var shop_amount = parseFloat(that.data.shop_amount).toFixed(2);
    var pay_amount = parseFloat(that.data.pay_amount).toFixed(2);

    if (pay_amount <= 0 && select_card_index == -1) {
      _dg.alert('支付金额必须大于0元');
      return;
    }
    fromdata['pay_type'] = that.data.pay_type_index;
    if (select_card_index == -1) {
      fromdata['pay_amount'] = pay_amount;

      fromdata['total_amount'] = shop_amount;
      fromdata['store_id'] = that.data.store_id;
    }
    else {
      fromdata['pay_amount'] = pay_amount;
      fromdata['coupon_discount'] = that.data.usecard['discount'];
      fromdata['coupon_id'] = that.data.usecard['id'];
      fromdata['is_coupon'] = 1;
      fromdata['total_amount'] = shop_amount;
      fromdata['store_id'] = that.data.store_id;
    }
    _dg.confirm("确定支付吗", function (res){
      if (res.confirm) {

        requestUtil.post(_DgData.duoguan_host_api_url + "/index.php/addon/DgStore/StorePayApi/payinfo.html", fromdata, (info) => {
          if (info.type == 1) {
            //微信支付
            if (_dg.os.isWechat()) {
              info.data = $.extend({
                success: function (res) {
                  _dg.navigateTo({
                    url: '/pages/store/store-pay-success/index',
                  });
                },
              }, info.data);
              wx.requestPayment(info.data);
            }
            //支付宝支付
            if (_dg.os.isAlipay()) {
              my.tradePay({
                tradeNO: info.data.trade_no,
                success: (res) => {
                  if (res.resultCode == 9000) {
                    my.redirectTo({
                      url: '/pages/store/store-pay-success/index',
                    });
                  }
                },
                fail: (res) => {
                  my.alert({
                    content: JSON.stringify(res),
                  });
                }
              });
            }


          }
          else if (info.type == 2) {
            //余额支付 余额不足
            //余额不足去充值
            _dg.navigateTo({
              url: '/pages/user/mcard/recharge',
            });
          }
          else if (info.type == 3 || info.type == 4) {
            //3优惠券直接抵扣4余额支付  
            _dg.navigateTo({
              url: '/pages/store/store-pay-success/index',
            });
          }


        });
      }
    })
  },
  getpre: function (e) {
    var that = this;
    console.log(e.detail);
    var text_value = e.detail.value
    if (text_value == "") {
      text_value = 0;
    }
    that.setData({
      disabled: false,
      usecard: null,
      shop_amount: text_value,//购物金额
      pay_amount: text_value,//实际支付金额
      select_card_index: -1,
    })
    that.calculatePayTotal();

    // var paytotal = parseFloat(e.detail.value);
    // requestUtil.post(_DgData.duoguan_host_api_url + "/index.php?s=/addon/DuoguanMeiFa/DuoguanMeiFaApi/getpre.html", { paytotal: paytotal }, (info) => {
    //   that.setData({
    //     usecard: info.coupon,
    //     paytotal: info.paytotal,
    //   })
    // });
  },
  // getpreid: function (id, callback) {
  //   var that = this;
  //   var couponid = id;
  //   var paytotal = parseFloat(that.data.paytotal);
  //   requestUtil.post(_DgData.duoguan_host_api_url + "/index.php?s=/addon/DuoguanMeiFa/DuoguanMeiFaApi/getpreid.html", { paytotal: paytotal, couponid: id }, callback);
  // },
  // 隐藏我的卡券选择
  hideMyCards: function () {
    var that = this;
    that.setData({
      is_show_myCards: false
    })
  },
  //显示我的卡券
  showMyCards: function (e) {
    var couponid = e.currentTarget.dataset.id
    var that = this;
    that.setData({
      is_show_myCards: true
    })
  },
  //获取会员余额等信息，多门店暂不用余额
  getmycardinfo: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + "/index.php/addon/Card/CardApi/getMyCardInfo.html", {}, (data) => {
      that.setData({
        myblance: data
      })
    });
  },
})