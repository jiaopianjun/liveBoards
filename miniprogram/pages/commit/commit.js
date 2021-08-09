let App = getApp();
import {
  intervalTime,
  getNowTime
} from '../../utils/utilsDate.js'
//连接数据库
const db = wx.cloud.database();
const message = db.collection("message");
const author = db.collection("author");
const noticeInfo = App.globalData.noticeInfo;

Page({
  data: {
    maxNumber: 140, //可输入最大字数
    number: 0, //已输入字数
    showPopup: false, //是否弹出留言面板
    showReply: false, //是否弹出回复面板
    authority: false, //鉴权
    loading: true, //是否正在加载
    textValue: "",
    len: 0,
    replyMsgId: "",
    code: "",
    userId: "", //用户openid

    //留言数据
    isUser: false,
    pageId: "",
    name: "",
    imageSrc: "",
    goodCount: 0,

    showCode: false,
    liveInfo: {}
  },
  // 置顶
  setTop: function (e) {
    wx.showLoading({
      title: '请稍候',
    })
    wx.cloud.callFunction({
      name: 'setTop',
      data: {
        id: e.currentTarget.dataset.msgid,
        top: !e.currentTarget.dataset.msgdata.top ? true : false
      }
    }).then(res => {
      wx.hideLoading({
        success: (hres) => {
          wx.showToast({
            title: `${!e.currentTarget.dataset.msgdata.top ? '置顶成功' : '取消成功'}`,
            icon: "success",
            success: sres => {
              this.getData();
            }
          })
        },
      })
    })
  },
  // 删除
  deleteData: function (e) {
    wx.showLoading({
      title: '请稍候',
    })
    wx.cloud.callFunction({
      name: 'deleteData',
      data: {
        id: e.currentTarget.dataset.msgid,
      }
    }).then(res => {
      wx.hideLoading({
        success: (hres) => {
          wx.showToast({
            title: "删除成功",
            icon: "success",
            success: sres => {
              this.getData();
            }
          })
        },
      })
    })
  },
  getInfo: function (e) {
    if (this.data.hasUserInfo) {
      this.showPopup()
    }
  },

  authentication: function () {
    wx.cloud.callFunction({
      name: 'login',
      complete: res => {
        this.setData({
          userId: res.result.openid
        })
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


  // 管理员回复
  reSubmit: function (e) {
    wx.showLoading({
      title: '请稍候',
    })
    //订阅消息推送数据
    const item = {
      thing1: {
        value: this.data.liveInfo.articleTitle
      },
      name2: {
        value: this.data.liveInfo.accountName
      },
      thing3: {
        value: e.detail.value.msgInput
      },
      time4: {
        value: getNowTime()
      }
    }
    //回复
    wx.cloud.callFunction({
      name: 'reply',
      data: {
        id: this.data.replyMsgId,
        reply: e.detail.value.msgInput,
      }
    }).then(res => {
      wx.hideLoading({
        success: (res) => {
          wx.showToast({
            title: "回复成功",
            icon: "success",
            success: reply => {
              this.setData({
                textValue: "",
                showReply: false
              });
              this.getData();
            }
          });
        },
      })
    })
    
    // 订阅消息推送
    wx.cloud.callFunction({
      name: 'replyPush',
      data: {
        data: item,
        templateId: noticeInfo.tempId,
        id: this.data.replyMsgId,
        userId: this.data.userId,
        page: `pages/commit/commit?id=${this.data.pageId}`
      }
    })
  },
  // 获取accessToken
  getAccessToken() {
    wx.request({
      url: 'https://qyapi.weixin.qq.com/cgi-bin/gettoken',
      data: {
        "corpid": noticeInfo.corpId,
        "corpsecret": noticeInfo.corpsecret
      },
      method: 'post',
      header: {
        'Content-Type': 'application/json'
      },
      dataType: 'jsonp',
      jsonp: 'callback',
      success: function (res) {
        var res = res.data
        res = JSON.parse(res)
        wx.setStorageSync('access_token', res.access_token);
        wx.setStorageSync('expires_in', Date.parse(new Date()) / 1000)
      },
      error: function (res) {}
    })
  },
  // 收到留言企业微信提醒
  wechatNotice(e) {
    let accessToken = wx.getStorageSync('access_token');
    let bodyData = {
      "toparty": 1,
      "msgtype": "miniprogram_notice",
      "agentid": noticeInfo.agentId,
      "miniprogram_notice": {
        "appid": noticeInfo.appId,
        "page": `pages/commit/commit?id=${this.data.pageId}`,
        "title": "你收到一个新的留言！",
        "description": getNowTime(2),
        "emphasis_first_item": false,
        "content_item": [{
            "key": "评论主题",
            "value": this.data.liveInfo.articleTitle
          },
          {
            "key": "公众号",
            "value": this.data.liveInfo.accountName
          },
          {
            "key": "评论内容",
            "value": e.detail.value.msgInput
          },
          {
            "key": "评论用户",
            "value": wx.getStorageSync('userInfo').nickName,
          }
        ]
      },
      "enable_id_trans": 0,
      "enable_duplicate_check": 0,
      "duplicate_check_interval": 1800
    }
   
    wx.request({
      url: 'https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=' + accessToken,
      data: bodyData,
      method: 'post',
      header: {
        'Content-Type': 'application/json'
      },
      dataType: 'jsonp',
      jsonp: 'callback',
      success: function (res) {
       console.log('发送成功')
      },
      error: function (res) {}
    })

  },
  // 用户留言
  subMessage: function (e) {
    wx.requestSubscribeMessage({
      tmplIds: [noticeInfo.tempId],
      success: res => {
        if (res[noticeInfo.tempId] == "accept") {
          wx.showToast({
            title: "留言成功",
            icon: "success",
            success: sub => {
              this.setData({
                textValue: "",
                showPopup: false
              });
              this.getData();
            }
          })
        }

      }
    })
  },
  onSubmit: function (e) {
    message.add({
      data: {
        imageSrc: wx.getStorageSync('userInfo').avatarUrl,
        name: wx.getStorageSync('userInfo').nickName,
        text: e.detail.value.msgInput,
        pageId: this.data.pageId,
        good: false,
      }
    })
    this.wechatNotice(e)
  },
  // 点赞
  setLike: function (e) {
    wx.showLoading({
      title: '请稍候',
    })
    wx.cloud.callFunction({
      name: 'getCount',
      data: {
        id: e.currentTarget.dataset.msgid,
      }
    }).then(res => {
      if (res.result.data.goodCount == null) {
        res.result.data.goodCount = 0;
      }
      wx.cloud.callFunction({
        name: 'setLike',
        data: {
          id: e.currentTarget.dataset.msgid,
          count: res.result.data.good ? Number(res.result.data.goodCount) - 1 : Number(res.result.data.goodCount) + 1,
          good: res.result.data.good ? false : true
        }
      }).then(tmp => {
        wx.hideLoading({
          success: (hp) => {
            wx.showToast({
              title: `${res.result.data.good ? '取消成功' : '点赞成功！'}`,
            })
          },
        })
        this.getData()
      })
    })
  },
  getData: function (e) {
    wx.cloud.callFunction({
      name: 'getData',
      data: {
        id: this.data.pageId,
        db: 'message',
      }
    }).then(res => {
      this.setData({
        liveList: res.result.data,
        loading: false
      })
    })
  },
  getLiveInfo: function (e) {
    wx.cloud.callFunction({
      name: 'getLiveInfo',
      data: {
        id: this.data.pageId,
        db: 'msgpages',
      }
    }).then(res => {
      this.setData({
        liveInfo: res.result.data[0]
      })
    })
  },
  inputText: function (e) {
    let value = e.detail.value;
    let len = value.length;
    this.setData({
      'number': len,
      'textValue': e.detail.value
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
  showRe(e) {
    if (this.data.name) {
      this.setData({
        showReply: true,
        replyMsgId: e.currentTarget.dataset.msgid
      });
    } else {
      wx.showToast({
        icon: 'none',
        title: "请先在上方授权昵称头像！",
      })
    }
  },
  closeRe() {
    this.setData({
      showReply: false
    });
  },
  getCode: function (e) {
    let _this = this;
    wx.showLoading({
      title: '生成中...',
    })
    wx.cloud.callFunction({
      name: 'getCode',
      data: {
        path: `pages/commit/commit?id=${this.data.pageId}`,
        id: this.data.pageId,
      }
    }).then(res => {
      wx.hideLoading({
        success: (htp) => {
          _this.setData({
            code: res.result.fileID,
            showCode: true,
          })
        },
      })
    })
  },
  copyPage: function (e) {
    wx.setClipboardData({
      data: `pages/commit/commit?id=${this.data.pageId}`,
      success(res) {
        wx.getClipboardData({
          success(res) {
            console.log(res.data) // data
          }
        })
      }
    })
  },
  getUserProfile(e) {
    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: (res) => {
        wx.setStorageSync('userInfo', res.userInfo)
        wx.setStorageSync('hasUserInfo', true)
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    })
  },
  onPullDownRefresh: function () {
    this.setData({
      loading: true
    });
    this.getData();
  },
  closeDialog() {
    this.setData({
      showCode: false
    })
  },
  downLoadCode() {
    let _this = this
    wx.showLoading({
      title: '保存中...',
      mask: true,
    });
    wx.getImageInfo({
      src: _this.data.code,
      success: (tmp) => {
        wx.saveImageToPhotosAlbum({
          filePath: tmp.path,
          success(res) {
            wx.showToast({
              title: '保存成功',
              icon: 'success',
              duration: 2000
            });
          },
          fail(res) {
            wx.showToast({
              title: '保存失败',
              icon: 'success',
              duration: 2000
            });
          }
        });
      }
    });
  },
  readLink(e) {
    wx.navigateTo({
      url: '../read/read?wxlink=' + e.currentTarget.dataset.link
    })
  },
  onLoad: function (options) {
    let _this = this;
    this.authentication();
    this.setData({
      pageId: options.id
    })
    this.getData();
    this.getLiveInfo()
    if (wx.getStorageSync('hasUserInfo')) {
      this.setData({
        imageSrc: wx.getStorageSync('userInfo').avatarUrl,
        name: wx.getStorageSync('userInfo').nickName,
        hasUserInfo: true
      })
    }
    
    let expiresIn = wx.getStorageSync('expires_in')
    let accessToken = wx.getStorageSync('access_token')
    console.log(intervalTime(expiresIn, Date.parse(new Date())/1000))
    if (accessToken) {
      if (intervalTime(expiresIn, Date.parse(new Date()) / 1000) > 7200) {
        this.getAccessToken()
      }
    } else {
      this.getAccessToken()
    }

  },
})