const cloud = require('wx-server-sdk')

cloud.init()

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  try {
    return await db.collection('message').doc(event.id).update({
        data: {
          reply: _.push({
            text: event.reply
          })
        }
      })
  } catch (e) {
    console.error(e)
  }
}