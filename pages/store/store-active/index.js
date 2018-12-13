const app = getApp();
const requestUtil = require('../../../utils/requestUtil');
const _DuoguanData = require('../../../utils/data');
Page({
    data: {
        this_store_info: {},
    },
    onLoad: function (options) {
        var that = this;
        var store_id = options.store_id;
        that.setData({ this_store_id: store_id });
        requestUtil.get(_DuoguanData.duoguan_host_api_url + '/index.php?s=/addon/DgStore/Api/getStoreOneInfo.html', { store_id: store_id }, (info) => {
            that.setData({ this_store_info:info});
        }, this, {});
    },
    go_back_bind:function(){
        wx.navigateBack(1);
    }
})