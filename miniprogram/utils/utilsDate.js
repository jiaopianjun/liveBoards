function intervalTime(startTime, endTime) {
  return endTime - startTime
}

function getNowTime(type) {
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
  if (second > 0 && second <= 9) {
    second = '0' + second;
  }
  if (type) {
    return year + "-" + month + "-" + date + ' ' + hour + ':' + minute + ':' + second;
  } else {
    return year + "-" + month + "-" + date;
  }
}


module.exports = {
  intervalTime,
  getNowTime
}