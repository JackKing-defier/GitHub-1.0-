const app = getApp();
const requestUtil = require('../../../utils/requestUtil');
const _DgData = require('../../../utils/data');
import _dg from '../../../utils/dg';
Page({
  data: {
    submitIsLoading: false,
    buttonIsDisabled: false,
    store_logo: [],
    store_imgs: [],
    zizhi_imgs: [],
    img_count_limit: 5,
    platform_data: [],
    cate_select: -1,
    store_cates: [],
    open_btime: '00:00',
    open_etime: '23:59',
    multiArray: [],
    multiIndex: [-1, -1],
    regionData: [],
    regionArray: [],
    regionIndex: [-1, -1, -1],
    is_checked: false, // 入驻协议checkbox状态

  },
  onLoad: function () {
    var that = this;
    that.getStoreConfig();
    that.getRegionInfo();
    that.getStoreCate();
  },
  //获取门店分类
  getStoreCate: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/getStoreCates.html', {}, (data) => {
      that.data.store_cates = data;
      var all_cates = [];
      all_cates.push(data);
      if (data[0])
      {
        all_cates.push(data[0]['c_cates']);
      }
     
      that.data.multiArray = all_cates;
      if (data != null && data.length > 0) {
        that.data.cate_select = 0;
        that.setData({
          store_cates: data,
          multiArray: all_cates,
          picker_index: that.data.cate_select
        });
      }
    });
  },
  //获取省市区 列表
  getRegionInfo: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/StoreApi/getRegionInfo.html', {}, (data) => {
      that.data.regionData=data;
      var countrys = data['countrys'];
      var provinces = data['provinces'];
      var citys = data['citys'];
      var districts = data['districts'];
      var regionArray = that.dealRegionInfo(countrys[0]['REGION_ID'],provinces[0]['REGION_ID'], citys[0]['REGION_ID']);
      that.setData({
        regionArray: regionArray
      });

    });
  },
  //处理地区选择器数据
  dealRegionInfo: function (country_id=null,province_id = null, city_id = null) {
    var that = this;
    var regionData = that.data.regionData;
    var all_countrys = regionData['countrys'];
    var all_provinces = regionData['provinces'];
    var all_citys = regionData['citys'];
    var all_districts = regionData['districts'];
    if (country_id == null&&province_id == null && city_id == null) {
      return [[], [], [],[]];
    }
    else if (country_id != null &&province_id == null && city_id == null) {

      var provinces = [];
      for (var i in all_provinces) {
        var vo = all_provinces[i];
        if (vo['PARENT_ID'] == country_id) {
          provinces.push(vo);
        }
      }
      var citys = [];
      for (var i in all_citys) {
        var vo = all_citys[i];
        if (vo['PARENT_ID'] == provinces[0]['REGION_ID']) {
          citys.push(vo);
        }
      }
      var districts = [];
      for (var i in all_districts) {
        var vo = all_districts[i];
        if (vo['PARENT_ID'] == citys[0]['REGION_ID']) {
          districts.push(vo);
        }
      }
    }
    else if (country_id == null &&province_id != null && city_id == null) {
      var provinces = that.data.regionArray[1];
      var citys = [];
      for (var i in all_citys) {
        var vo = all_citys[i];
        if (vo['PARENT_ID'] == province_id) {
          citys.push(vo);
        }
      }
      var districts = [];
      for (var i in all_districts) {
        var vo = all_districts[i];
        if (vo['PARENT_ID'] == citys[0]['REGION_ID']) {
          districts.push(vo);
        }
      }
    }
    else if (country_id == null && province_id == null && city_id != null) {
      var provinces = that.data.regionArray[1];
      var citys = that.data.regionArray[2];;
      var districts = [];
      for (var i in all_districts) {
        var vo = all_districts[i];
        if (vo['PARENT_ID'] == city_id) {
          districts.push(vo);
        }
      }
    }
    else
    {
      var provinces = [];
      for (var i in all_provinces) {
        var vo = all_provinces[i];
        if (vo['PARENT_ID'] == country_id) {
          provinces.push(vo);
        }
      }
      var citys = [];
      for (var i in all_citys) {
        var vo = all_citys[i];
        if (vo['PARENT_ID'] == province_id) {
          citys.push(vo);
        }
      }
      var districts = [];
      for (var i in all_districts) {
        var vo = all_districts[i];
        if (vo['PARENT_ID'] == city_id) {
          districts.push(vo);
        }
      } 
    }
    var regionArray = [];
    regionArray.push(all_countrys,provinces, citys, districts);
    return regionArray;
  },

  //表单
  formSubmit: function (e) {
    var that = this;
    that.setData({ submitIsLoading: true, buttonIsDisabled: true });
    var rdata = e.detail.value;
    var platform_d = that.data.platform_data;
    if (parseFloat(platform_d['enter_price']) > 0) {
      rdata['store_status'] = 4;
    }
    else {
      rdata['store_status'] = 0;
    }

    if (!rdata['store_name']) {
      return that.showModel('请输入门店名称');
    }
    if (!rdata['store_con_mobile']) {
      return that.showModel('请输入门店电话');
    }
  
    if (!rdata['store_cate_id'] && that.data.data.category_need==1) {
      return that.showModel('请选择门店分类');
    }
    var store_Logos = that.data.store_logo;
    if (store_Logos.length <= 0) {
      return that.showModel('请上传门店logo');
    }
    if (!rdata['province_id']) {
      return that.showModel('请选择商家地址');
    }
    if (!rdata['store_gps_lng']) {
      return that.showModel('请标注门店坐标');
    }
  
    if (!rdata['store_address']) {
      return that.showModel('请输入详细地址');
    }
    if (!rdata['store_open_btime[]'] || !rdata['store_open_etime[]']) {
      return that.showModel('请输入营业时间');
    }
    if (!that.data.is_checked) {
      return that.showModel('请阅读入驻协议');
    }
    var store_imgs = that.data.store_imgs;
    // if (store_imgs.length <= 0) {
    //   return that.showModel('请上传门店实景');
    // }
    var zizhi_imgs = that.data.zizhi_imgs;
    // if (zizhi_imgs.length <= 0) {
    //   return that.showModel('请上传资质图片');
    // }

    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/Api/storeEnter', rdata, (info) => {
      //如果有图片就上传
      if (that.data.store_logo.length > 0 || that.data.zizhi_imgs.length > 0 || that.data.store_imgs.length > 0) {
        _dg.showToast({
          title: '图片上传中',
          icon: 'loading',
          duration: 10000
        })
      }
      if (that.data.store_logo.length > 0) {
        var imgA = [];
        imgA = imgA.concat(that.data.store_logo);
        that.syncUploadImgs(imgA, 'store_logo', info['id']);
      }
      if (that.data.zizhi_imgs.length > 0) {
        var imgB = [];
        imgB = imgB.concat(that.data.zizhi_imgs);
        that.syncUploadImgs(imgB, 'store_zizhi', info['id']);
      }
      if (that.data.store_imgs.length > 0) {
        var imgC = [];
        imgC = imgC.concat(that.data.store_imgs)
        that.syncUploadImgs(imgC, 'store_shijing', info['id']);
      }

      //如果入驻需要交钱就直接生成订单，不支付则不生成订单
      var platform_d = that.data.platform_data;
      if (parseFloat(platform_d['enter_price']) > 0) {
        var post_data = {};
        post_data['id'] = info['id'];
        post_data['enter_price'] = platform_d['enter_price'];
        that.makeOrder(post_data);
      }
      else {
        wx.showModal({
          title: '提示',
          content: "申请提交成功，请等待审核",
          showCancel: false,
          success: function (res) {
            if (res.confirm == true) {
              _dg.navigateBack(1);
            }
          }
        });
      }

    }, this, { isShowLoading: false, completeAfter: function () { that.setData({ submitIsLoading: false, buttonIsDisabled: false }); } });
  },
  showModel: function (hint_s) {
    var that = this;
    that.setData({ submitIsLoading: false, buttonIsDisabled: false });
    _dg.showToast({
      title: hint_s,
      image: '/images/view_hint.png',
      duration: 1000
    })

  },
  //生成入驻订单（仅对需要支付的情况）
  makeOrder: function (order_info) {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/OrderApi/makeEnterOrder.html', { oinfo: order_info }, (data) => {
      // console.log(data);
      _dg.hideToast();
      that.setData({
        btn_submit_disabled: false,
        submitIsLoading: false
      });
      wx.requestPayment({
        'timeStamp': data.timeStamp,
        'nonceStr': data.nonceStr,
        'package': data.package,
        'signType': 'MD5',
        'paySign': data.paySign,
        'success': function (res) {
          wx.showModal({
            title: '提示',
            content: "申请提交成功，请等待审核",
            showCancel: false,
            success: function (res) {
              if (res.confirm == true) {
                _dg.navigateBack(1);
              }
            }
          });
        },
        'fail': function (res) {

        }
      })
    }, { complete: that.makeOrderComplete() });
  },
  makeOrderComplete: function () {
    var that = this;
    that.setData({
      btn_submit_disabled: false,
      submitIsLoading: false
    });
  },
  //分类picker选择事件
  bindPickerChange: function (e) {
    var that = this;
    var value = e.detail.value;
    var o_select_index = value[0];
    var t_select_two = value[1];
    var cates = that.data.store_cates;
    var store_cate = cates[o_select_index]['c_cates'][t_select_two];
    var multiIndex = that.data.multiIndex;
    multiIndex[0] = o_select_index;
    multiIndex[1] = t_select_two;
    if (store_cate) {
      var store_cate_id = store_cate['id'];
    }
    else {
      var store_cate_id = cates[o_select_index]['id'];
    }
    that.setData({
      multiIndex: multiIndex,
      store_cate_id: store_cate_id
    });

  },
  //分类选择器滑动事件
  bindMultiPickerColumnChange: function (e) {

    var that = this;
    var column = e.detail.column;
    var value = e.detail.value;
    if (column == 0) {
      var all_cates = that.data.multiArray;
      var store_cates = that.data.store_cates;
      all_cates[1] = store_cates[value]['c_cates'];
      that.setData({
        multiArray: all_cates,
      });
    }

  },
  //地区选择器滑动事件
  bindRegionPickerColumnChange: function (e) {
    var that = this;
    var column = e.detail.column;
    var value = e.detail.value;
    var regionData = that.data.regionData;
    var regionIndex = that.data.regionIndex;
    var regionArray=that.data.regionArray;
    var countrys = regionArray[0];
    var provinces = regionArray[1];
    var citys = regionArray[2];
    var districts = regionArray[3];
    if (column == 0) {
      regionIndex[0] = value;
      regionIndex[1] = 0;
      regionIndex[2] = 0;
      regionIndex[3] = 0;
      var regionArray = that.dealRegionInfo(countrys[value]['REGION_ID']);
    }
    else if (column == 1) {
      regionIndex[1] = value;
      regionIndex[2] = 0;
      regionIndex[3] = 0;
      var regionArray = that.dealRegionInfo(null,provinces[value]['REGION_ID']);
    }
    else if (column == 2) {
      regionIndex[2] = value;
      regionIndex[3] = 0;
      var regionArray = that.dealRegionInfo(null, null, citys[value]['REGION_ID']);
    }
    else
    {
      regionIndex[3] = value;
    }
    that.setData({
      regionIndex:regionIndex,
      regionArray: regionArray
    });

  },
   //地区picker选择事件
  bindRegionChange: function (e) {
    var that = this;
    var value = e.detail.value;
    console.log(value);
    var a_select = value[0];
    var b_select = value[1];
    var c_select = value[2];
    var d_select = value[3];

    var regionArray = that.data.regionArray;
    var countrys = regionArray[0];
    var provinces = regionArray[1];
    var citys = regionArray[2];
    var districts = regionArray[3];
   
  


    var regionIndex = that.data.regionIndex;
    regionIndex[0] = a_select;
    regionIndex[1] = b_select;
    regionIndex[2] = c_select;
    regionIndex[3] = d_select;
    that.setData({
      regionIndex: regionIndex,
      country_id: countrys[a_select]['REGION_ID'],
      province_id: provinces[b_select]['REGION_ID'],
      city_id: citys[c_select]['REGION_ID'],
      district_id: districts[d_select]['REGION_ID'],
    });
  },
  //时间picker选择事件
  bindTimeChange: function (e) {
    var id = e.currentTarget.id

    if (id == 1) {
      this.setData({
        open_btime: e.detail.value
      })
    }
    else {
      this.setData({
        open_etime: e.detail.value
      })
    }

  },
  //删除
  del_pic_bind: function (e) {
    var that = this
    var index = e.currentTarget.id;
    if (e.currentTarget.dataset.index == 2) {
      var datas = that.data.store_imgs;
      datas.splice(index, 1)
      that.setData({
        store_imgs: datas
      })
    } else if (e.currentTarget.dataset.index == 3) {
      var datas = that.data.zizhi_imgs;
      datas.splice(index, 1)
      that.setData({
        zizhi_imgs: datas
      })
    }


  },
  //选择图片
  chooseimg_bind: function (e) {
    var that = this
    var sheng_count = 5;
    var c_index = e.currentTarget.id;
    if (c_index == 2) {
      //store_imgs
      sheng_count = that.data.img_count_limit - that.data.store_imgs.length
    }
    else if (c_index == 3) {
      //zizhi_imgs
      sheng_count = that.data.img_count_limit - that.data.zizhi_imgs.length
    }
    if (sheng_count <= 0) {
      wx.showModal({
        title: '提示',
        content: '对不起，最多可上传五张图片',
        showCancel: false
      })
      return false
    }
    _dg.chooseImage({
      count: sheng_count,
      sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
      sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
      success: function (res) {
        // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
        if (c_index == 1) {
          //logo
          that.data.store_logo.splice(0, that.data.store_logo.length);
          that.data.store_logo.push(res.tempFilePaths[0]);
          that.setData({
            store_logo: that.data.store_logo
          })
        }
        else if (c_index == 2) {
          //store_imgs
          that.setData({
            store_imgs: that.data.store_imgs.concat(res.tempFilePaths)
          })
        }
        else if (c_index == 3) {
          //zizhi_imgs
          that.setData({
            zizhi_imgs: that.data.zizhi_imgs.concat(res.tempFilePaths)
          })
        }

      }
    })
  },
  //上传图片
  syncUploadImgs: function (imgs, parameter, id, ) {
    var that = this;
    var img = imgs.pop();
    _dg.uploadFile({
      url: _DgData.duoguan_host_api_url + '/index.php/addon/DgStore/Api/imgUpload.html',
      filePath: img,
      name: 'file',
      formData: {
        token: _DgData.duoguan_user_token,
        utoken: _dg.getStorageSync("utoken"),
        table_name: 'dg_stores',
        parameter: parameter,
        id: id
      },
      success: function (res) {
        if (imgs.length > 0) {
          that.syncUploadImgs(imgs, parameter, id, );
        }
        else {
          _dg.hideToast();
        }
        console.log('上传成功');
      },
      fail: function (res) {
        console.log('上传失败');

      }
    })
  },

  //获取获取配置信息
  getStoreConfig: function () {
    var that = this;
    requestUtil.get(_DgData.duoguan_host_api_url + '/index.php/addon/DgStore/Api/getStoreConfig.html', {}, (info) => {
      that.data.platform_data = info;
      that.setData({
        data: info,
      });
      // if (info.store_type == 1) {
      //   // 单门店
      // }
      // else if (info.store_type == 2) {

      // }
    });
  },
  //地图选择位置
  onOpenMapTap: function (e) {
    var that = this;
    _dg.chooseLocation({
      success: (res) => {
        that.setData({
          store_address: res.address,
          store_gps_lng: res.longitude,
          store_gps_lat: res.latitude
        });
      }
    });
  },
  readPrototol: function () {
    wx.navigateTo({
      url: '../store-ruzhu-rule/index'
    });
  },
  changeChecked: function () {
      this.setData({
        is_checked : !this.data.is_checked
      })
  }
})