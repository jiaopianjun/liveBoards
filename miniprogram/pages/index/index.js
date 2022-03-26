//连接数据库
const db = wx.cloud.database();
const commit = db.collection("msgpages");
const author = db.collection("author");
const app = getApp();
Page({
  data: {
    authority: false,
    showPopup: false, //是否弹出留言面板
    textValue: "",
    loading: true, //是否正在加载

    pageList: []
  },
  getNowTime() {
    let now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth() + 1;
    var date = now.getDate();
    var hour = now.getHours();
    var minute = now.getMinutes();
    var second = now.getSeconds();
    if (month > 0 && month <= 9) {
      month = '0' + month;
    }
    if (date > 0 && date <= 9) {
      date = '0' + date;
    }
    return year + "-" + month + "-" + date ;
  },
  //提交创建新页面
  onSubmit: function (e) {
    let _this = this;
    wx.showLoading({
      title: '创建中...',
    })
    commit.add({
      data: {
        accountName: e.detail.value.accountName,
        articleTitle: e.detail.value.articleTitle,
        articleDesc: e.detail.value.articleDesc,
        articleLink: e.detail.value.articleLink,
        createTime: _this.getNowTime()
      }
    }).then(res => {
      wx.hideLoading({
        success: (res) => {
          wx.showToast({
            title: "新建成功",
            icon: "success",
            success: res2 => {
              this.setData({
                textValue: "",
                showPopup: false
              });
              this.getData();
            }
          })
        },
      })
    })
  },

  // 页面刷新获取数据
  getData: function (e) {
    wx.cloud.callFunction({
      name: 'getData',
      data: {
        db: 'msgpages',
        id: null,
      }
    }).then(res => {
      console.log(res.result.data)
      wx.stopPullDownRefresh();
      this.setData({
        pageList: res.result.data,
        loading: false
      })
    })
  },

  //判断用户权限
  authentication: function () {
    app.getOpenId();
    wx.cloud.callFunction({
      name: 'login',
      complete: res => {
        db.collection('author').get().then(res2 => {
          if (res2.data.length > 0) {
            if (res.result.openid === res2.data[0]._openid) {
              this.setData({
                authority: true
              })
            }
          }
        })
      }
    })
  },

  //弹出面板设置
  showPopup() {
    this.setData({
      showPopup: true
    });
  },
  onClose() {
    this.setData({
      showPopup: false
    });
  },

  onLoad: function (options) {
    this.getData();
    this.authentication();
  },

  onPullDownRefresh: function () {
    this.setData({
      loading: true
    });
    this.getData();
  },
})