const app = getApp();
import _dg from '../../../utils/dg';

Page({
  data:{
    weburl:null
  },
  onLoad: function(options) {
    this.setData({
      weburl: decodeURIComponent(options.weburl)
    })
  }
})