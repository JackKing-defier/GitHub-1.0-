// pages/user/bindMobile/bindMobile.js
import dg from '../../../utils/dg.js';
import request from '../../../utils/requestUtil.js';
import _Config, { host_api_url as API_HOST } from '../../../utils/config.js';
import listener from '../../../utils/listener.js';
import _ from '../../../utils/underscore.js';

Page({

    /**
     * 页面的初始数据
     */
    data: {
        mobile: '', // 返回的手机号
        input_mobile: '18189156130', // 输入的手机号
        input_password:'123456',//输入密码
        input_mobile_disabled: false,
    },



    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
        let mobile = this.data.mobile;
        this.fireEventListener(mobile != '' ? {mobile: mobile} : {});
    },

    /**
     * 触发input事件
     */
    input: function (e) {
        let field = e.target.dataset.field;
        let value = e.detail.value;
        let info = {};
        if (field == 'input_mobile') {
            info.input_mobile = value;
        } else if (field == 'message_auth_code') {
            info.message_auth_code = value;
        }else if (field == 'input_password') {
            info.input_password = value;
        }
        this.setData({
            ...info,
        });
    },

    /**
     * 提交保存
     */
    submit: function (e) {
        let that = this;
        let requestUrl =_Config.login_with_password_url;
        let requestData = {
            phone: this.data.input_mobile,
            password:this.data.input_password,
            code: this.data.message_auth_code,
        };
        request.mypost(requestUrl, requestData, function(res){
            wx.setStorageSync('jwtoken', res.jwtoken);
            wx.setStorageSync('_userinfo', res);
            //导航到个人页
            wx.navigateBack();
            
            console.log("回到上一页")
        }, this, {
            isShowLoading: true, 
            loadingText: '登录中', 
        });
    },

    /**
     * 触发监听器
     * @param info {mobile: '18812341234'}
     */
    fireEventListener: function (info) {
        listener.fireEventListener('user.mobile.action', [info]);
        // dg.navigateBack();
    },

})