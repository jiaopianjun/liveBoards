import check from './utils/testVersion.js';
import utils from './utils/utils';
App({
  onLaunch: function () {
    let _this = this;
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'liveboard-7g1q8b5ka5cf730b', // 换成自己的云环境ID
        traceUser: true,
      })
    }
    _this.globalData = {};
    _this.globalData.noticeInfo = utils;
    // 版本自动更新代码
    check.checkUpdateVersion()
  },
  getOpenId() {
    var that = this;
    wx.showLoading({
      title: '正在加载',
    })
    wx.cloud.callFunction({
      name: 'login',
      success(res) {
        wx.hideLoading()
        that.globalData.openid = res.result.openid
        wx.setStorageSync('openid', res.result.openid);
      },
    })
  },
})
