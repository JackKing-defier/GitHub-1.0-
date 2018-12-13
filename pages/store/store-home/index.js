// pages/index/index.js
const app = getApp();
const requestUtil = require('../../../utils/requestUtil');
const util = require('../../../utils/util');
const _DgData = require('../../../utils/data');
import WxParse from '../../../wxParse/wxParse';
import _ from '../../../utils/underscore';
import _dg from '../../../utils/dg';
const s_common = require('../store-common/common');
Page({
  data: {
    // ------------------------多店版数据start----------------------------------
    //用来限制自定义上啦下拉操作间隔 防止过于频繁触发
    reachBottom_delayTime: 0,
    store_type: '',
    store_cate: '',
    single_store_info: [],
    page_index: 1,
    storeListArr: [],
    is_toLoad: false,
    param: {
      keyword: '',
      type: 0
    },
    is_show_getLocation: false,
    isTabFixed: false,//用来控制排序栏置顶
    sort_index: 4,

    // -------------------------多店版数据end------------------------------------
    g_share_title: '',
    g_share_desc: '',
    is_show_load_bg: true,//控制整个界面显示，没有加载好则显示默认背景
    // -------------------------单店版数据start----------------------------------
    search_p: '搜索',
    source_data: {},
    goods_data_waimai: [],
    goods_data_diannei: [],
    store_data: false,
    tabTit: '',
    this_store_id: 0,
    //用来控制是立即购买 还是购物车选好了
    consume_type: '',
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
    goods_specification: '',
    goods_a_info: {},

    //930改版
    store_data: false,
    this_store_id: 0,
    is_show_back_home: false,
    home_home_position_control:0,
    storeSwiperNum: 0,
    is_show_all_intro: false,
    is_show_consult_view: false,
    user_pos: {},
    search_select_item: 1,
    search_select_show: false,
    search_select_item_current: 1,
    all_search_goods_list: [],
    search_goods_list: [],
    think_words_list: [],
    search_think_words: [],
    // ------------------------单店版数据end------------------------------------
  },
  //---------------------单门店和多门店公用部分 start-------------------------------------
  onLoad: function (options) {
    //获取配置  单店或多店等
    this.tabOffsetTop = null;
    this.getStoreConfig();
    this.getShareData();
    this.getMarketInfo();
    s_common.getAllStoreGoods();
  },
  //下拉动作
  onPullDownRefresh: function () {
    var that = this;
    that.data.page_index = 1;
    that.getStoreConfig();
    setTimeout(() => {
      _dg.stopPullDownRefresh()
    }, 1500);
  },
  //上拉
  onReachBottom: function () {
    var that = this;
    if (that.data.store_type == 2) {//多店
      if (that.data.page_index > 1) {
        that.getStoreList(that.data.page_index);
      }
    }
    else {
      // 单店

    }
  },
  //出现
  onShow: function () {
    var that = this;
    if (that.data.store_type == 1) {//单店
      that.setData({
        submitIsLoading: false
      });
      that.getStoreInfo();
    }
    else {
      //多店

    }
  },
  //获取分享信息
  getShareData: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_get_share_data_url, { mmodule: 'dg_store' }, (data) => {
      that.setData({
        g_share_title: data.title,
        g_share_desc: data.desc
      })
    });
  },
  //获取配置信息
  getStoreConfig: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/Api/getStoreConfig.html', {}, (info) => {
      that.data.store_type = info.store_type;
      if (info.market_config && info.market_config.market_status == 1) {
        var is_show_market = 1;
      }
      else {
        var is_show_market = 0;
      }
      that.setData({
        is_ruzhu: info.is_ruzhu,
        is_show_market: is_show_market,
        home_position_control: info.home_position_control
      });
      if (info.store_type == 1) {
        // 单门店
        that.data.this_store_id = info.store_id;
        that.setData({
          store_type: info.store_type
        });
        that.getStoreInfo();
      }
      else if (info.store_type == 2) {
        //多门店
        that.setData({
          store_type: info.store_type
        });
        var lat = _dg.getStorageSync('LATITUD')
        var lng = _dg.getStorageSync('LONGITUDE')
        var address = _dg.getStorageSync('ADDRESS')
        if (lat && lng && address && lat != 'undefined' && lng != 'undefined') {
          that.setData({
            address: address,
          });
        } else if(info.home_position_control==0){
          that.setData({
            is_show_load_bg: false,
            is_show_getLocation: true,
          });
          that.getLocation();
        }
        that.getManyStoresSource();
      }
    }, that, { isShowLoading: false });
  },
  //---------------------单门店和多门店公用部分 end-------------------------------------
  //------------------------------ 多门店首页 start-------------------------------------
  //跳转市集
  jump_market() {
    _dg.navigateTo({
      url: '../market-index/index'
    });
  },
  //门店排序 栏  控制顶部浮动
  onPageScroll(e) {
    if (this.tabOffsetTop !== null) {
      var distance = e.scrollTop - this.tabOffsetTop + 46;
      var isTabFixed = distance >= 0 ? true : false;
      if (this.data.isTabFixed != isTabFixed) {
        this.setData({ isTabFixed: isTabFixed });
      }

    }
  },
  /**
 * 更新tab距离顶部距离
 */
  updateTabOffsetTop() {
    const selectorQuery = _dg.createSelectorQuery();
    selectorQuery.select('#store_list').boundingClientRect();
    selectorQuery.selectViewport().scrollOffset();
    selectorQuery.exec((res) => {
      if (this.tabOffsetTop == null) {
        this.tabOffsetTop = res[0].top
      }
    });
  },
  //排序
  sort_select: function (e) {
    var that = this;
    let search_select_item_current = this.data.search_select_item_current
    var index = e.currentTarget.id;
    if (index==1){
      that.checkGetPosition(1)
    }
    this.setData({
      sort_index: index,
    });
    that.data.page_index = 1;
    if (search_select_item_current == 1) {
      that.getStoreList();
    } else if (search_select_item_current == 2) {
      that.sortGoods()
    }
  },

  //多店请求
  getManyStoresSource: function () {
    var that = this;
    //获取门店分类和广告图片
    requestUtil.get(_DgData.duoguan_host_api_url + "/index.php/addon/DgStore/Api/getStoreCategoryAndAdvert.html", {}, (info) => {
      var categoryList = info.categoryList;
      var advertList = info.advert;
      var advertCount = advertList.length;
      var is_indicatorDots = false;
      is_indicatorDots = info.category_num < 10 ? false : true;
      this.setData({
        is_show_load_bg: false,
        store_category_list: info.categoryList,
        store_category_num: info.category_num,
        advertList: advertList,
        advertCount: advertCount,
        indicatorDots: is_indicatorDots
      });
      if (_dg.createSelectorQuery) {
        setTimeout(this.updateTabOffsetTop, 500);
      }

    }, that, { isShowLoading: false });
    that.getStoreList();
  },
  //获取店铺列表
  getStoreList: function (page_index = 1) {
    var that = this;
    let home_home_position_control = this.data.home_home_position_control
    var lat = _dg.getStorageSync('LATITUD')
    var lng = _dg.getStorageSync('LONGITUDE')
    var address = _dg.getStorageSync('ADDRESS')
    if (!lat && !lng && that.data.sort_index == 1 && home_home_position_control==0) {
      that.setData({
        is_show_load_bg: false,
        is_show_getLocation: true,
      });
      that.getLocation();
    }
    //获取门店列表
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/Api/getStoreList.html', { version: 2, page_index: page_index, ws_lat: lat, ws_lng: lng, store_cate: that.data.store_cate, keywords: that.data.param.keyword, sort_type: that.data.sort_index}, (data) => {
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
        is_show_load_bg: false,
        store_list: that.data.storeListArr,
      });
      that.data.page_index = parseInt(that.data.page_index) + 1;
    }, that, { isShowLoading: false });
  },

  //获取定位
  getLocation: function () {
    var that = this;
    // 页面初始化 options为页面跳转所带来的参数
    _dg.getLocation({
      type: 'wgs84',
      success: function (res) {
        var qqmapsdk = util.getMapSdk()
        qqmapsdk.reverseGeocoder({
          location: {
            latitude: res.latitude,
            longitude: res.longitude
          },
          success: (res) => {
            var addressD = res.result.address_component;
            var addressS = '';
            if (addressD.street_number) {
              addressS = addressD.street_number;
            }
            else if (addressD.street) {
              addressS = addressD.street;
            }
            else if (addressD.city) {
              addressS = addressD.city;
            }
            res = res.result;
            _dg.setStorageSync('LATITUD', res.location.lat);
            _dg.setStorageSync('LONGITUDE', res.location.lng);
            _dg.setStorageSync('ADDRESS', addressS);
            that.setData({
              address: addressS,
              is_show_getLocation: false,
            });
            that.data.page_index = 1;
            that.getManyStoresSource();
          }
        });
      },
      fail: (error) => {
        _dg.setStorageSync('LATITUD', 39.90);
        _dg.setStorageSync('LONGITUDE', 116.38);
        _dg.setStorageSync('ADDRESS', '北京市');
        that.setData({
          address: '北京市',
          is_show_getLocation: false,
        });
        that.data.page_index = 1;
        that.getManyStoresSource();
      },
    })
  },
  /**
   * 用户点击右上角分享
   */
  //设置分享
  onShareAppMessage: function () {
    var that = this
    if (that.data.store_type == 2) {
      return {
        title: that.data.g_share_title,
        desc: that.data.g_share_desc,
        path: '/pages/store/store-home/index'
      }
    }
    else {
      return {
        title: that.data.store_data.store_name,
        desc: that.data.store_data.store_jieshao,
        path: '/pages/store/store-home/index'
      }
    }

  },
  //点击广告图
  advert_top_bind: function (e) {
    var that = this;
    _dg.navigateTo({
      url: e.currentTarget.dataset.url
    });
  },

  //用户点击分类
  store_category_click: function (e) {
    // var that = this;
    // that.data.param.keyword='';
    // that.data.store_cate = e.currentTarget.id;
    // var cate_name = e.currentTarget.dataset.cate_name;
    // if (cate_name == '全部') {
    //   that.data.store_cate = '';
    // }
    // that.data.page_index = 1;
    // that.getStoreList();
    // this.setData({
    //   toView: 'store_list'
    // })
    this.checkGetPosition()
    _dg.navigateTo({
      url: '../store-list/index?cate_id=' + e.currentTarget.id + '&cate_name=' + e.currentTarget.dataset.cate_name
    });

  },
  onShowSearchTap: function () {
    //显示搜索框
    this.setData({ searchShow: true, search_select_show:false });
  },
  onHideSearchBlur: function (e) {
    //隐藏搜索框
    // if (!e.detail.value)
    // var a = this.data.param;
    // a.keyword = '';
    // this.setData({
    //   searchShow: false,
    //   param: a
    // });
  },
  //绑定输入框和联想词
  search_words: function (e) {
    let keyword = e.detail.value
    let param_word = 'param.keyword'
    let search_type = this.data.search_select_item
    this.setData({
      [param_word]: keyword
    })
    if (typeof (keyword) !== 'string' || !keyword) {
      this.setData({
        search_think_words: []
      })
    } else {
      this.calculateThinkWords(keyword, search_type)
    }
  },
  onSearchSubmit: function (e) {
    //搜索操作
    var that = this;
    let keyword = e ? e.detail.value.keyword : that.data.param.keyword;
    that.setData({
      ['param.keyword']: keyword,
      search_think_words: []
    })
    let search_select_item = this.data.search_select_item
    this.setData({
      search_p: that.data.param.keyword,
      param: that.data.param,
      search_select_item_current: search_select_item,
      search_goods_list:[]
    })
    if (search_select_item == 1) {
      that.data.store_cate = '';
      that.data.page_index = 1;
      that.getStoreList();
    } else if (search_select_item == 2) {
      this.searchGoods(keyword, search_select_item)
    }
  },
  onClearKeywordTap: function () {
    //清除关键字
    this.data.param.keyword = '';
    this.setData({ param: this.data.param });
  },
  keyboardComplete: function (e) {
    //搜索框完成按键事件
    var that = this;
    this.setData({ searchShow: false, });
    that.data.param.keyword = e.detail.value;
    that.data.store_cate = '';
    that.data.page_index = 1;
    that.getStoreList();
  },
  /**
 * 打开地图
 */
  onOpenMapTap: function (e) {
    var that = this;
    _dg.chooseLocation({
      success: (res) => {
        that.setData({
          is_show_getLocation: false,
          address: res.name
        });
        _dg.setStorageSync('LATITUD', res.latitude);
        _dg.setStorageSync('LONGITUDE', res.longitude);
        _dg.setStorageSync('ADDRESS', res.name);
        that.data.page_index = 1;
        that.getManyStoresSource();
      },
      fail: (res) => {
        console.log(res);
      }
    });

    // _dg.chooseLocation({
    //   success: (e) => {
    //     that.data.page_index = 1;
    //     qqmapsdk.reverseGeocoder({
    //       location: {
    //         latitude: e.latitude,
    //         longitude: e.longitude
    //       },
    //       success: (res) => {
    //         var addressD = res.result.address_component;
    //         var addressS = '';
    //         if (addressD.street_number) {
    //           addressS = addressD.street_number;
    //         }
    //         else if (addressD.street) {
    //           addressS = addressD.street;
    //         }
    //         else if (addressD.city) {
    //           addressS = addressD.city;
    //         }
    //         res = res.result;
    //         _dg.setStorageSync('LATITUD', res.location.lat);
    //         _dg.setStorageSync('LONGITUDE', res.location.lng);
    //         _dg.setStorageSync('ADDRESS', addressS);
    //         that.setData({
    //           address: addressS
    //         });
    //         that.getManyStoresSource();
    //       }
    //     });
    //   }
    // });
  },
  //跳转店铺详情
  store_info_bind: function (e) {
    var that = this;
    var store_template_type = e.currentTarget.dataset.store_template_type
    var xcx_appid = e.currentTarget.dataset.xcx_appid
    //直接跳转店铺小程序
    if (xcx_appid) {
      wx.navigateToMiniProgram({
        appId: xcx_appid,
        path: '',
        extraData: {
          foo: 'bar'
        },
        envVersion: 'release',
        success(res) {
        },
        fail(res) {
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
  ruzhu_bind: function (e) {
    var that = this;
    _dg.navigateTo({
      url: '../store-ruzhu/index'
    });
  },
  //------------------------------ 多门店首页end-------------------------------------

  //-------------------------------单门店首页start-----------------------------------
  //快速买单
  rapid_pay_bind: function (e) {
    var that = this;
    _dg.navigateTo({
      url: '../store-rapid-pay/index?store_id=' + that.data.this_store_id
    });
  },
  //跳转优惠券列表
  coupon_list_bind: function (e) {
    var that = this;
    _dg.navigateTo({
      url: '../store-coupon/index?list_type=1&store_id=' + that.data.this_store_id
    });
  },
  //跳转商品详情
  goods_info_bind: function (e) {
    var that = this;
    _dg.navigateTo({
      url: '../store-goods-details/index?goods_id=' + e.currentTarget.id + '&store_id=' + that.data.this_store_id
    });
  },
  //跳转商品列表
  goods_list_bind: function (e) {
    var that = this;
    var consume_type = e.currentTarget.dataset.consume_type;
    _dg.navigateTo({
      url: '../store-goods-list/index?consume_type=' + consume_type + '&store_id=' + that.data.this_store_id
    });
  },
  //活动公告
  huodong_info_bind: function () {
    var that = this;
    _dg.navigateTo({
      url: '../store-active/index?&store_id=' + that.data.this_store_id
    });
  },
  //领券页面
  huodong_quan_info_bind: function () {
    var that = this;
    _dg.navigateTo({
      url: '../store-juan/index?&store_id=' + that.data.this_store_id
    });
  },
  //订单
  go_user_order_bind: function (e) {
    _dg.navigateTo({
      url: '/pages/store/store-order-list/index'
    });
  },
  //导航
  get_location_bind: function () {
    var that = this;
    var loc_lat = that.data.store_data.store_gps_lat;
    var loc_lng = that.data.store_data.store_gps_lng;
    _dg.openLocation({
      latitude: parseFloat(loc_lat),
      longitude: parseFloat(loc_lng),
      scale: 18,
      name: that.data.store_data.store_name,
      address: that.data.store_data.store_address
    });
  },
  //电话
  call_phone_bind: function () {
    var that = this;
    _dg.makePhoneCall({
      phoneNumber: that.data.store_data.store_con_mobile
    });
  },
  //获取店铺信息 包含店铺商品
  getStoreInfo: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/getStoreHomeInfo.html', { store_id: that.data.this_store_id, versions: 2 }, (info) => {
      var store_data = info;
      that.data.store_data = store_data;
      that.setData({
        is_show_load_bg: false,
        store_data: store_data,
        comment_data: store_data.recommend_comments,
        comment_title: '最新评价'
      });

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
      WxParse.wxParse('content', 'html', info.store_intro, handler);
      this.wxParseImgLoad = handler.wxParseImgLoad;
      this.wxParseImgTap = handler.wxParseImgTap;

      _dg.setNavigationBarTitle({
        title: store_data.store_name
      });

    }, that, { isShowLoading: false });
  },

  //立即购买
  buy_now: function (e) {
    var that = this;
    _dg.navigateTo({
      url: '../store-order-sure/index?store_id=' + that.data.this_store_id + '&consume_type=1&goods_id=' + e.currentTarget.id
    });
  },
  change_store_intro_show: function () {
    this.setData({
      is_show_all_intro: !this.data.is_show_all_intro
    });
  },
  change_consult_view_show: function () {
    this.setData({
      is_show_consult_view: !this.data.is_show_consult_view
    });

  },
  //表单
  formSubmit: function (e) {
    var that = this;
    var rdata = e.detail.value;
    rdata['store_id'] = that.data.this_store_id;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/postConsultMsg.html', rdata, (info) => {
      _dg.alert("提交成功，我们会尽快回复您！", function (res) {
        that.setData({
          is_show_consult_view: false
        });
      });
    }, that, { isShowLoading: false });
  },
  // 轮播图渲染数字
  storeSwiperChange: function (e) {
    this.setData({ storeSwiperNum: e.detail.current });
  },
  //-------------------------------单门店首页end-----------------------------------
  /* ***********获取集市配置************ */
  getMarketInfo: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/getMarketInfo.html', {}, (info) => {
      that.setData({
        market_config: info.config_info,
      });
    }, that, { isShowLoading: false });
  },

  //跳转到webview
  toWebView: function () {
    _dg.navigateTo({
      url: '/pages/store/store-webview/index?weburl=' + this.data.store_data.store_webview_url
    })
  },
  // 搜索下拉列表显示
  triggerSelect: function () {
    this.setData({
      search_select_show: !this.data.search_select_show,
      search_think_words: []
    })
  },
  //更改选择的搜索类型
  searchSelectItem: function (e) {
    let selectItemId = e.currentTarget.id
    this.setData({
      search_select_item: selectItemId,
      search_select_show: false,
      ['param.keyword']:null,
      search_think_words:[]
    })
  },
  //搜索商品
  searchGoods: function (keyword, search_select_item) {
    let all_stores_goods = _dg.getStorageSync('all_stores_goods')
    let all_search_goods_list = this.data.search_goods_list
    let all_goods = all_stores_goods.all_goods_list
    let all_stores = all_stores_goods.all_stores_list
    let search_word = this.data.param.keyword
    let search_goods_list = []
    let search_store_info = {}
    let goods_and_store_obj = {}
    let user_pos = this.data.user_pos
    if (!user_pos.user_lat) {
      let user_lat = _dg.getStorageSync('LATITUD')
      let user_lng = _dg.getStorageSync('LONGITUDE')
      user_pos = {
        user_lat: user_lat,
        user_lng: user_lng
      }
      this.data.user_pos = user_pos
    }
    if (all_search_goods_list.length == 0 || search_word) {
      all_goods.map((item) => {
        if (item.g_name) {
          search_store_info = this.calculateStoreInfo(all_stores, item.store_id, user_pos)
          goods_and_store_obj = Object.assign({}, search_store_info, item)
          all_search_goods_list.push(goods_and_store_obj)
        }
      })
      this.data.all_search_goods_list = all_search_goods_list
    }
    if (keyword) {
      all_search_goods_list.map((item) => {
        if (item.g_name.indexOf(keyword) !== -1) {
          search_goods_list.push(item)
        }
      })
      this.data.search_goods_list = search_goods_list
    } else {
      this.data.search_goods_list = all_search_goods_list
    }
    this.sortGoods()
  },
  //获取搜索商品结果的店铺信息
  calculateStoreInfo: function (all_stores, store_id, user_pos) {
    for (let i = 0; i < all_stores.length; i++) {
      if (all_stores[i].id == store_id) {
        all_stores[i].distance = s_common.calculateDistance(user_pos.user_lat, user_pos.user_lng, all_stores[i].store_gps_lat, all_stores[i].store_gps_lng)
        return all_stores[i]
      }
    }
  },
  sortGoods: function () {
    let sort_index = this.data.sort_index
    let search_goods_list = this.data.search_goods_list
    let notnull_item = []
    let null_item = []
    if (sort_index == 1) {
      search_goods_list.filter((item) => {
        if (!item.distance) {
          null_item.push(item)
          return false
        }
        if (typeof (item.distance) == 'number') {
          item.distance = item.distance.toFixed(2)
        }
        notnull_item.push(item)
        return true
      })
      notnull_item.sort((pre, aft) => {
        return pre.distance - aft.distance
      })
      search_goods_list = notnull_item.concat(null_item)
    }
    if (sort_index == 2) {
      search_goods_list.filter((item) => {
        if (!item.sale_all_num) {
          null_item.push(item)
          return false
        }
        notnull_item.push(item)
        return true
      })
      notnull_item.sort((pre, aft) => {
        return aft.sale_all_num - pre.sale_all_num
      })
      search_goods_list = notnull_item.concat(null_item)
    }
    if (sort_index == 3) {
      search_goods_list.sort((pre, aft) => {
        return aft.store_add_time - pre.store_add_time
      })
    }
    if (sort_index == 4) {
      search_goods_list.filter((item) => {
        if (!item.distance || !item.sale_all_num) {
          null_item.push(item)
          return false
        }
        if (typeof (item.distance) == 'number') {
          item.distance = item.distance.toFixed(2)
        }
        notnull_item.push(item)
        return true
      })
      notnull_item.sort((pre, aft) => {
        if (pre.distance != aft.distance) {
          return pre.distance - aft.distance
        } else {
          return aft.sale_all_num - pre.sale_all_num
        }
      })
      search_goods_list = notnull_item.concat(null_item)
    }
    this.setData({
      search_goods_list: search_goods_list
    })
  },
  //筛选输入的关键词联想
  calculateThinkWords: function (keyword, search_type) {
    let all_stores_goods = _dg.getStorageSync('all_stores_goods')
    let all_goods = all_stores_goods.all_goods_list
    let all_stores = all_stores_goods.all_stores_list
    let search_think_words = []
    if (search_type == 1) {
      all_stores.map((item) => {
        if (item.store_name.indexOf(keyword) !== -1) {
          item.search_type = 1
          search_think_words.push(item)
        }
      })
    } else if (search_type == 2) {
      all_goods.map((item) => {
        if (item.g_name.indexOf(keyword) !== -1) {
          item.search_type = 2
          search_think_words.push(item)
        }
      })
    }
    this.setData({
      search_think_words: search_think_words
    })
  },
  //开始查找联想关键词
  thinkSearch: function (e) {
    let click_item = e.currentTarget.dataset.contents
    let keyword = click_item.search_type == 1 ? click_item.store_name : click_item.g_name
    this.setData({
      ['param.keyword']: keyword,
      search_think_words: []
    })
    this.onSearchSubmit()
  },
  //判断必须需要位置的项目是否获取了位置
  checkGetPosition:function(type){
    let user_lat = _dg.getStorageSync('LATITUD')
    let user_lng = _dg.getStorageSync('LONGITUDE')
    if (!user_lat || !user_lng) {
      this.setData({
        is_show_load_bg: type==1?false:true,
        is_show_getLocation: type == 1 ? true : false,
      });
      this.getLocation();
    } else {
      let user_pos = {
        user_lat: user_lat,
        user_lng: user_lng
      }
      this.data.user_pos = user_pos
    }
  }
})