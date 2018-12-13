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
        input_password:'111',//输入密码
        input_mobile_disabled: false,
        message_auth_code: '122', // 输入短信验证码
        reload_verify_time: '获取验证码',
    },



    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {
        let mobile = this.data.mobile;
        this.fireEventListener(mobile != '' ? {mobile: mobile} : {});
    },

    /**
     * 绑定用户信息
     */
    bindUserMobile: function(e) {
        if (!e.detail.encryptedData) return ;
        
        let that = this;
        dg.authLogin({
            success: function(res) {
                let requestUrl = that.data.baseUrl + '/CardApi/openCardByWechatPhone.html';
                let requestData = {
                    encryptedData: e.detail.encryptedData,
                    iv: e.detail.iv,
                    code: res.code,
                    name: '',
                    ver: '0.0.1',
                    is_open_card: 'no', // 兼容参数                    
                };

                request.post(requestUrl, requestData, function(info){
                    // 不做处理
                }, that, {
                    isShowLoading: true, loadingText: '获取中', completeAfter: function(res){
                        let data = res.data.data;
                        if (data.phone) {
                            that.save(data.phone, that);
                        }
                    }
                });
            },
        });
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
        let requestUrl =_Config.register_with_phone_url;
        let requestData = {
            phone: this.data.input_mobile,
            password:this.data.input_password,
            code: this.data.message_auth_code,
        };
        request.mypost(requestUrl, requestData, function(res){
            // 此处不处理
            console.log(res)
            //跳转到登录页面
            var jwtoken=res.jwtoken;
            //绑定微信
            wx.setStorageSync('jwtoken', res.jwtoken);

        }, this, {
            isShowLoading: true, 
            loadingText: '验证中', 
            completeAfter: function (res) {
                let data = res.data.data;
                if (data.phone) {
                    //that.save(data.phone, that);
                }
            }
        });
    },

    /**
     * 获取手机验证码
     */
    getVerifyCode: function (e) {
        let that = this;
        let requestUrl = _Config.get_user_phone_code_url;
        let requestData = {
            phone: this.data.input_mobile
        };
        request.mypost(requestUrl, requestData, function(res){
            dg.showToast({ title: '验证码发送成功，请注意查收！', });
            let reload_verify_time = 60;
            that.setData({
                input_mobile_disabled: true,
            })
            const handler = () => {
                if (reload_verify_time > 0) {
                    that.setData({
                        reload_verify_time: reload_verify_time--
                    });
                    setTimeout(handler, 1000);
                } else {
                    that.setData({
                        reload_verify_time: "获取验证码",
                        input_mobile_disabled: false,
                    });
                }
            };
            handler();
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