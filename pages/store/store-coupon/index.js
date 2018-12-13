// pages/index/index.js
const app = getApp();
const requestUtil = require('../../../utils/requestUtil');
const _DgData = require('../../../utils/data');
const util = require('../../../utils/util');
import _ from '../../../utils/underscore';
import WxParse from '../../../wxParse/wxParse';
import _dg from '../../../utils/dg';
Page({
  /**
   * 页面的初始数据
   */
  data: {
    store_id: 0,
    list_type: '',
    coupon_data:false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this;
    //1表示可领取优惠券列表 2表示我的优惠券列表
    var list_type = options.list_type
    this.data.list_type = list_type;
    that.setData({
      list_type: list_type
    });
    var store_id = options.store_id
    if (!store_id) {
      that.getSingleStoreId();
    }
    else {
      this.data.store_id = store_id;
      that.getSource();
    }
  },
  getSingleStoreId: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/getSingleStoreId', {}, (info) => {
      that.setData({
        store_id: info.store_id,
      });
      that.getSource();
    }, this, { isShowLoading: false });
  },
  getSource:function(){
    var that=this;
    if(that.data.list_type==1){
      that.getCoupons();

    } else if (that.data.list_type == 2) {
      that.getMyCoupons();
    }

  },
  //获取优惠券列表
  getCoupons: function () {
    var that = this;
    var store_id=that.data.store_id;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/getCoupons.html',{store_id:store_id}, (info) => {
      that.data.coupon_data=info;
      that.setData({
      coupon_data:info
      });
      // _dg.setNavigationBarTitle({
      //   title: store_data.store_name
      // });

    }, this);
  },
  //获取我的优惠券 /index.php?s=/addon/Card/CardApi/getMyCoupons.html
  getMyCoupons:function(){
    var that=this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/getMyCoupons.html', {available:1}, (info) => {
      that.onDataHandler(info);
      that.setData({
      coupon_data:info
      });
    });
  },
  //领取优惠券
  receiveCoupon: function (e) {
    var that = this;
    var id = e.currentTarget.dataset.id;
    requestUtil.get(_DgData.duoguan_host_api_url + "/index.php/addon/Card/CardApi/goCoupon.html", {id:id}, (data) => {
      that.getSource();
      _dg.showToast({ title: '领取成功！', icon: 'success', });
    }, that, {isShowLoading: false });
  },
  //核销优惠券
  writeOffCoupon: function (e) {
  var that=this;
    var id = e.currentTarget.dataset.id;
    _dg.confirm('确认在线下使用该优惠券吗？',function(res){
      if (res.confirm) {
        requestUtil.get(_DgData.duoguan_host_api_url + "/index.php/addon/Card/CardApi/writeOff.html", { id: id }, (data) => {
          that.getSource();
          _dg.showToast({ title: '使用成功', icon: 'success', });

        });
      } 
    })
  },
  /**
 * 数据处理
 */
  onDataHandler: function (data) {
    _(data).map((item) => {
      item.use_start_date = util.format(item.use_start_time * 1000, "yyyy-MM-dd");
      item.use_end_date = util.format(item.use_end_time * 1000, "yyyy-MM-dd");
      return item;
    });
  },
  /**
   * 是否显示优惠券详情
   */
  show_card_info:function(e){
    var that=this;
    var index = e.currentTarget.dataset.index;
   var coupon_data= that.data.coupon_data;
   if (coupon_data[index]['is_show_info'] &&coupon_data[index]['is_show_info']==1){
     for (var key in coupon_data) {
       coupon_data[key]['is_show_info'] = 0;
     } 
    }
    else
    {
     for (var key in coupon_data) {
       if(key!=index){
         coupon_data[key]['is_show_info'] = 0;
       }
     } 
     coupon_data[index]['is_show_info']= 1;
    }
   that.data.coupon_data = coupon_data;
   that.setData({
     coupon_data: that.data.coupon_data
   });
  },
  onShareAppMessage: function () {
    var that = this
    return {
      title:"优惠券",
      desc: "优惠券",
      path: 'pages/store/store-coupon/index?list_type=1&store_id='.that.data.store_id
    }

  },

})