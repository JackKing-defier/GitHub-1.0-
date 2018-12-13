var app = getApp()
var _function = require('../../../utils/functionData.js');
const requestUtil = require('../../../utils/requestUtil');
const _DgData = require('../../../utils/data');
const QR = require('../../../utils/qrcode');
const s_common = require('../store-common/common');
import _dg from '../../../utils/dg';
const OK = 'OK' // 倒计时改变订单状态成功的返回码
const count_down_time = 3600 // 暂时设置未付款订单有效期为1小时

Page({
    data:{
        this_order_id:0,
        oinfo:[],
        store_data:[],
        store_id:0,
        glo_is_load:true,
        is_show_pay_type:false,
        pay_type_index:1,
        count_down:{}
       
    },
    onLoad: function (options) {
      var that = this;
      var order_id = options.oid;
      that.setData({
        this_order_id: order_id,
      })
      //请求订单详情
      that.getOrderInfo();
      that.getStoreConfig();
    },
    //获取配置信息
    getStoreConfig: function () {
      var that = this;
      requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/Api/getStoreConfig.html', {}, (info) => {
        that.setData({
          store_type: info.store_type,
          is_member: info.is_open_member
        });
      });
    },
    //跳转店铺
    go_store_info_bind:function(e){
        var that = this;
        var store_id = e.currentTarget.id;
        _dg.navigateTo({
            url: '../store-info/index?store_id='+store_id
        });
    },
    //获取订单信息
    getOrderInfo:function(){
      var that = this;
      requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/OrderApi/getOrderInfo.html', {oid:that.data.this_order_id}, (data) => {
        if (data.order_status == 0) {
          let time = new Date()
          let currentTime = Math.round(time.getTime() / 1000)
          let differTime = count_down_time - (currentTime - data.add_time)
          if (differTime > 0) {
            that.setCountDown(differTime)
          }
        }
        console.log(data)
        that.createQrCode(`ST${data.order_sn}`, "mycanvas");
        that.setData({
          oinfo: data,
          glo_is_load: false
        });
        that.data.store_id=data.store_id;
        that.getStoreInfo();
        
      });
    },
    //获取店铺信息 
    getStoreInfo: function () {
      var that = this;
      requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/getStoreBasicInfo.html', { store_id: that.data.store_id }, (info) => {
        var store_data = info;
        that.data.store_data = store_data;
        that.setData({
          store_data: store_data,
          is_show: true
        });
      }, this, { isShowLoading: false });
    },
    //拨号
    call_phone_bind:function(){
      var that = this;
      _dg.makePhoneCall({
        phoneNumber: that.data.store_data.store_con_mobile
      })
    },
    //评价
    order_go_comment_bind: function (e) {
      var oid = e.currentTarget.id;
      _dg.navigateTo({
        url: '../store-order-comment/index?oid=' + oid
      });
    },
    //改变订单状态
    change_order_status_or_show: function (e) {
      var that = this
      var oid = e.currentTarget.id;
      var change_type = e.currentTarget.dataset.change_type;
      let refund = e.currentTarget.dataset.refund
      let refund_status = e.currentTarget.dataset.refundstatus
      let item_store_id = e.currentTarget.dataset.store_id
      if (refund) {
        let url = refund_status == 0 ? '../store-refund-write/index?order_id=' + oid + '&store_id=' + item_store_id : '../store-refund-detail/index?order_id=' + oid
        _dg.navigateTo({
          url: url
        })
        return
      }
      var content = '';
      if (change_type == 1) {
        //取消订单
        content = '确认要取消订单吗？';
      }
      else if (change_type == 2) {
        // 确认已送达
  
        if (that.data.oinfo.order_type==1){
          content = '确认已领取吗？';
        }
        else{
          content = '确认送达吗？';
        }

      }
      else if (change_type == 3) {
        content = '确定要删除订单吗？';
      }
      _dg.confirm(content,function(res){
        if (res.confirm == true) {
          if (change_type == 3) {
            _dg.navigateBack({
              delta: 1
            })

          } else {
            requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/OrderApi/changeOrderStatusOrShow.html', { oid: oid, change_type: change_type }, (info) => {
              that.setData({
                page_index: 1
              })
              that.getOrderInfo();
            });
          }
        }
      })
    },
    //开始支付
    order_go_pay_bind: function (e) {
      var that = this;
      var this_order_id = e.currentTarget.id;
      that.setData({
        buttonIsDisabled: true,
        submitIsLoading: true
      })
      that.orderPay(this_order_id);
    },
    //订单支付
    orderPay: function (oid) {
      var that = this;
      var pay_id=that.data.pay_type_index
      _dg.confirm("确定支付吗", function (res) {
        if (res.confirm) {
          requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StorePayApi/order_pay.html', { oid: oid, pay_id: pay_id }, (data) => {
            if (data['type'] == 2) {
              //余额不足去充值
              _dg.navigateTo({
                url: '/pages/user/mcard/recharge',
              });
            }
            else if (data['type'] == 3 || data['type'] == 1) {
              //3余额支付 2卡券直接抵用
              _dg.alert("订单支付成功!");
            }
            else {
              wx.requestPayment({
                'timeStamp': data.timeStamp,
                'nonceStr': data.nonceStr,
                'package': data.package,
                'signType': 'MD5',
                'paySign': data.paySign,
                'complete': function () {
                  that.orderPayComplete()
                }
              });
            }
            //支付完成 刷新
            that.getOrderInfo();
          }, { complete: that.orderPayComplete() });
        }
        else {
          that.setData({
            btn_submit_disabled: false,
            submitIsLoading: false
          });
        }
      })
    },
    //支付完成
    orderPayComplete: function () {
      var that = this;
      that.setData({
        buttonIsDisabled: false,
        submitIsLoading: false,
        is_show_pay_type: false,
      });
      //支付完成 刷新
      that.getOrderInfo();
    },
    //下拉刷新
    onPullDownRefresh:function(){
      var that = this;
      that.setData({
        this_page:1
      });
      that.getOrderInfo();
      setTimeout(()=>{
        _dg.stopPullDownRefresh()
      },1000)
    },
    //创建二维码
    createQrCode: function (url, canvasId) {
      //调用插件中的draw方法，绘制二维码图片
      QR.qrApi.init(url,canvasId,10, 10, 120, 120);

    },
      //导航导航
  get_location_bind: function () {
      var that = this;
      var loc_lat = that.data.oinfo.store_gps_lat;
      var loc_lng = that.data.oinfo.store_gps_lng;
      _dg.openLocation({
        latitude: parseFloat(loc_lat),
        longitude: parseFloat(loc_lng),
        scale: 18,
        name: that.data.oinfo.store_name,
        address: that.data.oinfo.store_address
      });
    },
  //显示支付类型选择
  show_paytype_bind: function () {
    var that = this;
    that.setData({
      is_show_pay_type: !that.data.is_show_pay_type
    });
  },
  //支付方式选择
  payTypeChange: function (e) {
    var index = e.detail.value;
    this.setData({
      pay_type_index: index,
    });
  },
  /* ******待付款倒计时倒计时结束改变订单状态为失效***** */
  CountDown(time) {
    let countDownSecond = time
    let hours_first = 'count_down.hours_first'
    let hours_second = 'count_down.hours_second'
    let minutes_first = 'count_down.minutes_first'
    let minutes_second = 'count_down.minutes_second'
    let second_first = 'count_down.second_first'
    let second_second = 'count_down.second_second'

    let hours_first_num = Math.floor(countDownSecond/3600%24/10)
    let hours_second_num = Math.floor(countDownSecond/3600%24%10)
    let minutes_first_num = Math.floor(countDownSecond/60%60/10)
    let minutes_second_num = Math.floor(countDownSecond/60%60%10)
    let second_first_num = Math.floor(countDownSecond%60/10)
    let second_second_num = Math.floor(countDownSecond%60%10)

    this.setData({
      [hours_first]: hours_first_num,
      [hours_second]: hours_second_num,
      [minutes_first]: minutes_first_num,
      [minutes_second]: minutes_second_num,
      [second_first]: second_first_num,
      [second_second]: second_second_num
    })
  },
  setCountDown(time) {
    let that=this
    let timer = setInterval(()=>{
      that.CountDown(time--)
      if(time<=0) {
        clearInterval(timer)
        that.changeOrderToDisabled()
      }
    },1000)
  },
  changeOrderToDisabled() {
    let options = {}
    options.oid = this.data.this_order_id
    let that = this
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/OrderApi/changeOrderToDisabled.html', { oid:             that.data.this_order_id }, (data) => {
      console.log(data)
      if (data.code == OK) {
        that.onLoad(options)
      } else {
        _dg.navigateBack({
          delta: 1
        })
      }
    }) 
  }
  /* ******待付款倒计时倒计时结束改变订单状态为失效***** */

})