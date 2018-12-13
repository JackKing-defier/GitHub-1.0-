const app = getApp();
const requestUtil = require('../../../utils/requestUtil');
const _DgData = require('../../../utils/data');
import _dg from '../../../utils/dg';
Page({
  /**
   * 页面的初始数据
   */
  data: {
    page_index: 1,
    storeListArr: [],
    store_list:[false],
    latitude: "",
    longitude: "",
    search_value: '',
    cates:[],
    select_cate_id:'',//选中的分类id，可能是一级也可能是二级
    p_cate_select_index: 0,//一级分类选中索引
    p_cate_select_id: -1,//一级分类选中的id
    c_cate_select_index: -1,//二级分类选中索引
    c_cate_select_id: 0,//二级分类选中索引
    c_cate_select_title: "全部",//二级分类选中标题
    is_show_cates: false,
    is_show_sort:false,
    sort_index:1,
    sort_title:'距离最近',
    is_show_load_bg:true
  },
  //生命周期函数--监听页面加载
  onLoad: function (options) {
    var that = this;
    that.setData({
      p_cate_select_id: options.cate_id,
      select_cate_id:options.cate_id,
      c_cate_select_title: options.cate_name
    });
    that.data.search_value = options.search_value;
    that.getStoreCates();
    that.getLocation();
  },
  //跳转店铺详情
  store_info_bind: function (e) {
    var that = this;
    var store_template_type = e.currentTarget.dataset.store_template_type
    var xcx_appid = e.currentTarget.dataset.xcx_appid
    //直接跳转店铺小程序
    if (xcx_appid) {
      _dg.navigateToMiniProgram({
        appId: xcx_appid,
        path: '',
        extraData: {
          foo: 'bar'
        },
        envVersion: 'release',
        success(res) {
          console.log(res);
        },
        fail(res) {
          console.log(res);
        }
      })
    }
    else if (store_template_type == 1 || store_template_type == 2 || store_template_type == 3 || store_template_type == 4) {
      _dg.navigateTo({
        url: '../store-info/index?store_id=' + e.currentTarget.id
      });
    }
    else {
      _dg.navigateTo({
        url: '../store-goods-list/index?store_id=' + e.currentTarget.id
      });
    }


  },
  // 页面相关事件处理函数--监听用户下拉动作
  onPullDownRefresh: function () {
    var that = this;
    that.data.page_index = 1;
    that.getLocation();
    setTimeout(() => {
      _dg.stopPullDownRefresh()
    }, 1000);
  },

  //页面上拉触底事件的处理函数
  onReachBottom: function () {
    var that = this;
    if(that.data.page_index>1){
      that.getStoreList(that.data.page_index);
    }
  },
  //获取定位
  getLocation: function () {
    var that = this;
    // 页面初始化 options为页面跳转所带来的参数
    var latitude = 0;
    var longitude = 0;
    _dg.getLocation({
      type: 'wgs84',
      success: function (res) {
        that.data.latitude = res.latitude
        that.data.longitude = res.longitude
      },
      fail:function(){
        that.data.latitude = _dg.getStorageSync('LATITUD')
        that.data.longitude =_dg.getStorageSync('LONGITUDE')
      },
      complete: function () {
        that.getStoreList(that.data.page_index);
      }
    })
  },
  //获取店铺列表
  getStoreList: function (page_index=1) {
    var that = this;
    //获取门店列表
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/Api/getStoreList.html', { version:2,page_index:page_index, ws_lat: that.data.latitude, ws_lng: that.data.longitude, store_cate: that.data.select_cate_id, search_vlue: that.data.search_value, sort_type: that.data.sort_index}, (data) => {

      //如果是下拉加载时 先将评论数组清空 
      if (page_index == 1) {
        //默认进来进来 或者刷新时调用
        that.data.storeListArr.splice(0, that.data.storeListArr.length);
        if (data.length > 0) {
          that.data.storeListArr = that.data.storeListArr.concat(data);
        }
      }
      else {
        //加载更多数据
        if (data.length > 0) {
          that.data.storeListArr = that.data.storeListArr.concat(data);
        }
      }
      that.setData({
        store_list: that.data.storeListArr,
        is_show_load_bg:false
      });
      that.data.page_index = parseInt(page_index) + 1;
    });
  },
  //获取门店列表
  getStoreCates: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/getStoreCates.html', {}, (data) => {
      console.log(data);
      var p_cate_select_index=0;
      for(var i=0;i<data.length;i++){
        if (data[i]['id'] == that.data.p_cate_select_id){
          p_cate_select_index=i;
        }
      }
  
      that.setData({
        p_cate_select_index: p_cate_select_index,
        cates: data
      });

    });
  },
  //门店分类选择
  clickCate: function (e) {
    var that = this;
    var type = e.currentTarget.dataset.type;
    var id = e.currentTarget.id;
    var index = e.currentTarget.dataset.index;
    if (type == 1) {
      that.setData({
        p_cate_select_id: id,
        p_cate_select_index: index,
        c_cate_select_id:0
      });
      if (index == -1) {
        that.setData({
          select_cate_id:'',
          is_show_cates: false,
          c_cate_select_title: "全部"
        });
        that.onPullDownRefresh();
      }
    }
    else if (type == 2) {
      that.setData({
        c_cate_select_id: id,
        c_cate_select_index: index,
        is_show_cates: false
      });
      var p_index = that.data.p_cate_select_index;
      var cates = that.data.cates;
      if (index == -1) {
        that.setData({
          c_cate_select_title: cates[p_index]['title'],
          select_cate_id: cates[p_index]['id']
        });
      }
      else {
        that.setData({
          c_cate_select_title: cates[p_index]['c_cates'][index]['title'],
          select_cate_id: cates[p_index]['c_cates'][index]['id']
        });
      }
      that.onPullDownRefresh();
    }
 
  },
  //顶部栏功能选择
  top_nav_select: function (e) {
    var that = this;
    var id = e.currentTarget.id;//1显示分类2销量排序3距离
    if (id == 1) {
      that.setData({
        is_show_sort:false, 
        is_show_cates: !that.data.is_show_cates
      });

    }
    else if (id == 2) {
      that.setData({
        is_show_cates:false,
        is_show_sort: !that.data.is_show_sort
      });
    }
    else if (id == 66) {
      that.setData({
        is_show_cates: false,
        is_show_sort: false
      });

    }

  },
  //筛选排序
  sort_select:function(e){
    var that=this;
    var index = e.currentTarget.id;//1距离最近2销量最高
    var title = e.currentTarget.dataset.title;
    that.setData({
      is_show_sort: false,
      sort_index: index,
      sort_title:title
    });
    that.onPullDownRefresh();
  },
 

})