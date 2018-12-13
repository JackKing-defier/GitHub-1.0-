const requestUtil = require('../../../utils/requestUtil');
const _DgData = require('../../../utils/data');
import _dg from '../../../utils/dg';
const util = require('../../../utils/util');
module.exports = {
  getAllStoreGoods: function () {
    const that = this
    let requestData = {}
    requestData.searchType = 2
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/searchGoods.html', requestData, (info) => {
      if (info) {
        _dg.setStorage({
          key: "all_stores_goods",
          data: info
        })
      }
    }, that, { isShowLoading: false });
  },
  calculateDistance: function (lat1, lng1, lat2, lng2) {
    if (!lat1 || !lng1 || !lat2 || !lng2) {
      return null
    }
    var radLat1 = lat1 * Math.PI / 180.0;
    var radLat2 = lat2 * Math.PI / 180.0;
    var a = radLat1 - radLat2;
    var b = lng1 * Math.PI / 180.0 - lng2 * Math.PI / 180.0;
    var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
    s = s * 6378.137;
    s = Math.round(s * 10000) / 10000;
    return s
  },
  // 获取退款状态
  getRefundInfo: function (requestData) {
    return new Promise((resolve, reject) => {
      requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/OrderApi/getRefundInfo.html', requestData, (data) => {
        if (data) {
          resolve(data)
        } else {
          reject
        }
      });
    })
  },
  //取消退款
  cancleRefund: function (requestData) {
    return new Promise((resolve, reject) => {
      requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/OrderApi/cancleRefund.html', requestData, (data) => {
        if (data) {
          resolve(data)
        } else {
          reject
        }
      });
    })
  },
  //获取优惠券列表 /index.php?s=/addon/Card/CardApi/getCoupons.html
  getCoupons: function (requestData) {
    var that = this;
    return new Promise((resolve,reject)=>{
      requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/getCoupons.html', requestData, (data) => {
        if (data){
          resolve(data)
        }else{
          reject()
        }
      });
    })
  },


}