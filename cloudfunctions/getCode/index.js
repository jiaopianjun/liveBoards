const cloud = require('wx-server-sdk')
const {
  WXMINIUser,
  WXMINIQR
} = require('wx-js-utils');

cloud.init()

const appId = 'wxaae48a78ed6066d8'; // 小程序 appId
const secret = '9e54a8b783a58e30ebc4d73d6be1f2eb'; // 小程序 secret


exports.main = async (event, context) => {

  // 获取小程序码，A接口
  let wXMINIUser = new WXMINIUser({
    appId,
    secret
  });

  // 一般需要先获取 access_token
  let access_token = await wXMINIUser.getAccessToken();
  let wXMINIQR = new WXMINIQR();

  let qrResult = await wXMINIQR.getMiniQRLimit({
    access_token,
    path: event.path
  });

  return await cloud.uploadFile({
    cloudPath: `${event.id}.jpg`,
    fileContent: qrResult
  })
}