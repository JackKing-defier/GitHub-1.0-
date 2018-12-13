const requestUtil = require('../../../utils/requestUtil');
const _DgData = require('../../../utils/data');
var app = getApp()
Page({
    data:{
        score_arr:[
            {
                'val':1,
                'ischeck':true
            },
            {
                'val':2,
                'ischeck': true
            },
            {
                'val':3,
                'ischeck': true
            },
            {
                'val':4,
                'ischeck': true
            },
            {
                'val':5,
                'ischeck': true
            }
        ],
        this_order_id:0,
        oinfo:[],
        glo_is_load:true,
        img_count_limit:5,
        this_img_i:0,
        this_img_max:0,
        postimg:[],
        submitIsLoading:false,
        buttonIsDisabled:false,
        this_score_val:5
    },
    onLoad:function(options){
        var that = this;
        var order_id = options.oid;
        that.setData({
          this_order_id:order_id,
        })
      //请求订单详情
      that.getOrderInfo();
    },
    //获取订单详情
    getOrderInfo: function () {
      var that = this;
      requestUtil.get(_DgData.duoguan_host_api_url + '/index.php?s=/addon/DgStore/OrderApi/getOrderInfo.html', { oid: that.data.this_order_id }, (data) => {
        that.setData({
          oinfo: data,
          glo_is_load: false
        });
        wx.hideToast();
      });
    },
    set_score_bind:function(e){
        var that = this;
        var max_val = e.currentTarget.id;
        var datas = that.data.score_arr;
        for(var i=0;i<datas.length;i++){
            if(i < max_val){
                datas[i].ischeck = true
            }else{
                datas[i].ischeck = false
            }
        }
        that.setData({
            score_arr:datas,
            this_score_val:max_val
        });
    },
    //删除
    del_pic_bind:function(e){
        var that = this
        var index = e.currentTarget.id;
        var datas = that.data.postimg;
        datas.splice(index,1)
        that.setData({
            postimg:datas
        })
    },
    //上传图片
    chooseimg_bind:function(){
        var that = this
        var img_lenth = that.data.postimg.length
        var sheng_count = that.data.img_count_limit - img_lenth
        if(sheng_count <= 0){
            wx.showModal({
                title: '提示',
                content: '对不起，最多可上传五张图片',
                showCancel:false
            })
            return false
        }
        wx.chooseImage({
            count: sheng_count,
            sizeType: ['compressed'], // 可以指定是原图还是压缩图，默认二者都有
            sourceType: ['album', 'camera'], // 可以指定来源是相册还是相机，默认二者都有
            success: function (res) {
                // 返回选定照片的本地文件路径列表，tempFilePath可以作为img标签的src属性显示图片
                that.setData({
                    postimg:that.data.postimg.concat(res.tempFilePaths)
                })
            }
        })
    },
    //发表评论
    formSubmit:function(e){
        var that = this;
        var t_data = e.detail.value;
        that.setData({
            buttonIsDisabled:true,
            submitIsLoading:true
        })
      that.makeComment(e);
    },
    makeComment: function (e) {
      var that = this;
      requestUtil.get(_DgData.duoguan_host_api_url + '/index.php?s=/addon/DgStore/OrderApi/postComment.html', { oid: that.data.this_order_id, fval: that.data.this_score_val, fcon:e.detail.value.post_content}, (data) => {
        var comment_id = data
        //如果发表成功，则进行上传图片接口
        var g_data = that.data.postimg
        if (g_data.length > 0) {
          that.setData({
            this_img_max: g_data.length,
            this_comment_id: comment_id
          })
          wx.showToast({
            title: '图片上传中',
            icon: 'loading',
            duration: 10000
          })
          that.imgUploadTime();
        } else {
          wx.hideToast();
          wx.showModal({
            title: '提示',
            content: '评价成功',
            showCancel: false,
            success: function (res) {
              wx.navigateBack({
                delta: 1
              })
            }
          });
        }
      },{complete:that.makeCommentComplete()});
    },
    makeCommentComplete:function(){
      var that = this
      that.setData({
        buttonIsDisabled: false,
        submitIsLoading: false
      })
    },
    imgUploadTime:function(){
        var that = this
        var this_img_len = that.data.this_img_i
        var this_img_max_len = that.data.this_img_max
        if(this_img_len < this_img_max_len){
              wx.uploadFile({
                url: _DgData.duoguan_host_api_url + '/index.php?s=/addon/DgStore/OrderApi/imgUpload.html',
                filePath: that.data.postimg[this_img_len],
                name: 'file',
                formData: {
                  token: _DgData.duoguan_user_token,
                  utoken: wx.getStorageSync("utoken"),
                  pid: that.data.this_comment_id
                },
                success: function (res) {
                  console.log('上传成功');
                  that.initImgUploadData(res.data)
                },
                fail: function (res) {
                  console.log('上传失败');
                  console.log(res);
                }
              })
      
        }else{
            wx.hideToast();
            wx.showModal({
                title: '提示',
                content: '评价成功',
                showCancel:false,
                success:function(res){
                  wx.navigateBack({
                    delta: 1
                  })
                }
            });
        }
    },
    initImgUploadData(data){
        var that = this;
        that.setData({
            this_img_i:that.data.this_img_i + 1
        });
        that.imgUploadTime();
    },
    //商品点赞
    goods_zan_bind:function(e){
        var goods_id = e.currentTarget.id;
    }
})