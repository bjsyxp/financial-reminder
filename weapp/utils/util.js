// 理财提醒 - 工具函数
// 微信小程序兼容写法（不使用ES2017+的padStart/toLocaleString等）

/* 补零 helper */
function pad2(n) {
  return (n < 10 ? '0' : '') + n;
}

function padStart(str, len, ch) {
  str = String(str);
  ch = ch || '0';
  while (str.length < len) str = ch + str;
  return str;
}

// 万元格式化：将元转为万元显示，保留2位小数
function fmtWan(n) {
  if (n === undefined || n === null) return '0.00万';
  var wan = n / 10000;
  var neg = wan < 0;
  var abs = neg ? -wan : wan;
  var intPart = Math.floor(abs);
  var decPart = Math.round((abs - intPart) * 100);
  return (neg ? '-' : '') + intPart + '.' + pad2(decPart) + '万';
}

// 金额格式化 ¥xx.xx
function fmtMoney(n) {
  if (n === undefined || n === null) return '¥0.00';
  var neg = n < 0;
  var abs = neg ? -n : n;
  var intPart = Math.floor(abs);
  var decPart = Math.round((abs - intPart) * 100);
  // 千分位
  var intStr = String(intPart);
  var result = '';
  for (var i = intStr.length - 1, j = 0; i >= 0; i--, j++) {
    if (j > 0 && j % 3 === 0) result = ',' + result;
    result = intStr[i] + result;
  }
  return (neg ? '-' : '') + '¥' + result + '.' + pad2(decPart);
}

// 日期格式化 YYYY/MM/DD
function fmtDate(s) {
  if (!s) return '-';
  var d = new Date(s + 'T00:00:00');
  return d.getFullYear() + '/' + pad2(d.getMonth() + 1) + '/' + pad2(d.getDate());
}

// 今天 YYYY-MM-DD
function todayStr() {
  var d = new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

// 天数差（UTC避免夏令时）
function calcDaysBetween(d1, d2) {
  var utc1 = Date.UTC(d1.getFullYear(), d1.getMonth(), d1.getDate());
  var utc2 = Date.UTC(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return Math.floor((utc2 - utc1) / 86400000);
}

// 计算收益
function calcInterest(amount, rate, start, end) {
  var daily = amount * (rate / 100) / 365;
  if (!end) {
    var daysSinceStart = calcDaysBetween(new Date(start), new Date());
    var interest = daysSinceStart > 0 ? +(daily * daysSinceStart).toFixed(2) : 0;
    return { interest: interest, daily: +daily.toFixed(4), days: daysSinceStart };
  }
  var days = calcDaysBetween(new Date(start), new Date(end));
  if (days <= 0) return { interest: 0, daily: +daily.toFixed(4), days: 0 };
  return { interest: +(daily * days).toFixed(2), daily: +daily.toFixed(4), days: days };
}

// 剩余天数
function getDaysRemaining(end) {
  if (!end) return Infinity;
  var t = new Date(); t.setHours(0, 0, 0, 0);
  var e = new Date(end); e.setHours(0, 0, 0, 0);
  if (isNaN(e.getTime())) return Infinity;
  return calcDaysBetween(t, e);
}

// 到期标签 — 按年分级
function getChip(days) {
  if (days < 0)   return { cls: 'tag-expired', text: '已到期 ' + (-days) + ' 天' };
  if (days <= 365) return { cls: 'tag-y1', text: days + ' 天后到期（1年内）' };
  if (days <= 730) return { cls: 'tag-y2', text: days + ' 天后到期（2年内）' };
  if (days <= 1095) return { cls: 'tag-y3', text: days + ' 天后到期（3年内）' };
  return { cls: 'tag-y4', text: days + ' 天后到期' };
}

// 类型标签
var TYPE_LABELS = { deposit: '定期存款', wealth: '理财产品', current: '活期存款' };
var TYPE_COLORS = { deposit: '#059669', wealth: '#2563eb', current: '#8b5cf6' };

// SHA-256 哈希（用于密码）
function sha256(str) {
  var hash = 0;
  for (var i = 0; i < str.length; i++) {
    var char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  var hex = Math.abs(hash).toString(16);
  // 补到16位
  while (hex.length < 16) hex = '0' + hex;
  return hex + hex + hex + hex;
}

module.exports = {
  fmtWan: fmtWan,
  fmtMoney: fmtMoney,
  fmtDate: fmtDate,
  todayStr: todayStr,
  calcDaysBetween: calcDaysBetween,
  calcInterest: calcInterest,
  getDaysRemaining: getDaysRemaining,
  getChip: getChip,
  TYPE_LABELS: TYPE_LABELS,
  TYPE_COLORS: TYPE_COLORS,
  sha256: sha256
}
