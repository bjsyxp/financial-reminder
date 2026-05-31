// 理财提醒 - 数据存储
var util = require('./util');

var STORAGE_KEY = 'mengmeng_deposits_v2';
var PWD_KEY = 'mengmeng_pwd_v1';

// ID统一为字符串（兼容源程序Date.now()数字ID）
function normalizeId(id) {
  return String(id);
}

// 查找记录索引（兼容数字/字符串ID）
function findIndex(records, id) {
  var nid = normalizeId(id);
  for (var i = 0; i < records.length; i++) {
    if (normalizeId(records[i].id) === nid) return i;
  }
  return -1;
}

// 加载所有记录
function loadRecords() {
  try {
    var raw = wx.getStorageSync(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// 保存所有记录
function saveRecords(records) {
  try {
    wx.setStorageSync(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch (e) {
    return false;
  }
}

// 添加记录
function addRecord(record) {
  var records = loadRecords();
  record.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  record.createdAt = new Date().toISOString();
  records.push(record);
  saveRecords(records);
  return records;
}

// 更新记录
function updateRecord(id, data) {
  var records = loadRecords();
  var idx = findIndex(records, id);
  if (idx === -1) return null;
  // 兼容note/memo字段
  if (data.note !== undefined) data.memo = data.note;
  if (data.memo !== undefined) data.note = data.memo;
  records[idx] = Object.assign(records[idx], data);
  saveRecords(records);
  return records;
}

// 删除记录
function deleteRecord(id) {
  var records = loadRecords();
  var nid = normalizeId(id);
  records = records.filter(function (r) { return normalizeId(r.id) !== nid; });
  saveRecords(records);
  return records;
}

// 获取单条记录
function getRecord(id) {
  var records = loadRecords();
  var nid = normalizeId(id);
  for (var i = 0; i < records.length; i++) {
    if (normalizeId(records[i].id) === nid) return records[i];
  }
  return null;
}

// 统计
function getStats(records) {
  var total = 0, count = 0, totalInterest = 0;
  records.forEach(function (r) {
    total += r.amount || 0;
    count++;
    var int = util.calcInterest(r.amount, r.rate, r.start, r.end);
    totalInterest += int.interest;
  });
  return { total: total, count: count, totalInterest: totalInterest };
}

// 按类型统计
function statsByType(records) {
  var byType = { deposit: { total: 0, count: 0 }, wealth: { total: 0, count: 0 }, current: { total: 0, count: 0 } };
  records.forEach(function (r) {
    if (byType[r.type]) {
      byType[r.type].total += r.amount || 0;
      byType[r.type].count++;
    }
  });
  return byType;
}

// 按银行汇总
function getBankSummary(records) {
  var map = {};
  records.forEach(function (r) {
    var inst = r.inst || '未知';
    if (!map[inst]) map[inst] = { inst: inst, total: 0, count: 0, deposit: 0, wealth: 0, current: 0, items: [] };
    map[inst].total += r.amount || 0;
    map[inst].count++;
    if (map[inst][r.type] !== undefined) map[inst][r.type] += r.amount || 0;
    map[inst].items.push(r);
  });
  return Object.keys(map).sort().map(function (k) { return map[k]; });
}

// 密码
function getStoredHash() {
  try { return wx.getStorageSync(PWD_KEY) || null; } catch (e) { return null; }
}
function setStoredHash(hash) {
  try { wx.setStorageSync(PWD_KEY, hash); return true; } catch (e) { return false; }
}
function removeStoredHash() {
  try { wx.removeStorageSync(PWD_KEY); return true; } catch (e) { return false; }
}

// 导入时规范化数据
function normalizeForImport(records) {
  return records.map(function (r) {
    // 确保字段名兼容
    if (r.note && !r.memo) r.memo = r.note;
    if (r.memo && !r.note) r.note = r.memo;
    // 确保ID是字符串
    if (r.id !== undefined && r.id !== null) r.id = normalizeId(r.id);
    return r;
  });
}

module.exports = {
  loadRecords: loadRecords,
  saveRecords: saveRecords,
  addRecord: addRecord,
  updateRecord: updateRecord,
  deleteRecord: deleteRecord,
  getRecord: getRecord,
  getStats: getStats,
  statsByType: statsByType,
  getBankSummary: getBankSummary,
  getStoredHash: getStoredHash,
  setStoredHash: setStoredHash,
  removeStoredHash: removeStoredHash,
  normalizeForImport: normalizeForImport,
  STORAGE_KEY: STORAGE_KEY
}
