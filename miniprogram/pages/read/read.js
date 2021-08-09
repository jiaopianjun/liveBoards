Page({
  data: {
    link:'',
  },

  onLoad: function (options) {
    let _this = this
    _this.setData({
      link: options.wxlink,
    })
  },
})
