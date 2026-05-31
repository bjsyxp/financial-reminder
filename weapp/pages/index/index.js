// 首页
var util = require('../../utils/util');
var store = require('../../utils/store');

Page({
  data: {
    locked: true,
    hasPassword: false,
    pwdInput: '',
    pwdError: '',
    showPwd: false,
    lockFocus: true,
    filter: 'all',
    records: [],
    filteredRecords: [],
    stats: { totalWan: '0.00万', totalMoney: '¥0.00', interestWan: '0.00万', interestMoney: '¥0.00', count: 0 },
    byType: { all: { count: 0 }, deposit: { count: 0 }, wealth: { count: 0 }, current: { count: 0 } }
  },

  onLoad: function () {
    var hash = store.getStoredHash();
    this.setData({ hasPassword: !!hash });
    if (!hash) {
      this.setData({ locked: false });
      this.refreshData();
    }
  },

  onShow: function () {
    if (!this.data.locked) {
      this.refreshData();
    }
  },

  onPwdInput: function (e) {
    this.setData({ pwdInput: e.detail.value, pwdError: '' });
  },

  togglePwdShow: function () {
    this.setData({ showPwd: !this.data.showPwd });
  },

  onPwdConfirm: function () {
    var hash = store.getStoredHash();
    var input = this.data.pwdInput;
    if (!input) { this.setData({ pwdError: '请输入密码' }); return; }
    if (util.sha256(input) === hash) {
      this.setData({ locked: false, pwdError: '' });
      this.refreshData();
    } else {
      this.setData({ pwdError: '密码错误，请重试' });
    }
  },

  onSetPwd: function () {
    var input = this.data.pwdInput;
    if (!input || input.length < 4) { this.setData({ pwdError: '密码至少4位' }); return; }
    store.setStoredHash(util.sha256(input));
    this.setData({ hasPassword: true, locked: false, pwdError: '✅ 密码设置成功' });
    this.refreshData();
  },

  // 刷新数据 — 预计算所有显示值
  refreshData: function () {
    var records = store.loadRecords();
    var stats = store.getStats(records);
    var byType = store.statsByType(records);

    // 给每条记录附加格式化后的显示字段
    var totalDaily = 0;
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var days = util.getDaysRemaining(r.end);
      var c = util.calcInterest(r.amount, r.rate, r.start, r.end);
      totalDaily += c.daily;
      r._chip = util.getChip(days);
      r._profit = util.fmtMoney(c.interest);
      r._daily = util.fmtMoney(c.daily);
      r._amountWan = util.fmtWan(r.amount);
      r._dateRange = util.fmtDate(r.start) + ' ~ ' + (r.end ? util.fmtDate(r.end) : '长期');
    }

    this.setData({
      records: records,
      filteredRecords: records,
      stats: {
        totalWan: util.fmtWan(stats.total),
        totalMoney: util.fmtMoney(stats.total),
        interestWan: util.fmtWan(stats.totalInterest),
        interestMoney: util.fmtMoney(stats.totalInterest),
        dailyWan: util.fmtWan(totalDaily * 365),
        dailyMoney: util.fmtMoney(totalDaily),
        count: stats.count
      },
      byType: {
        all: { count: records.length },
        deposit: byType.deposit,
        wealth: byType.wealth,
        current: byType.current
      }
    });
  },

  setFilter: function (e) {
    var filter = e.currentTarget.dataset.filter;
    var records = this.data.records;
    var filtered = filter === 'all' ? records : [];
    if (filter !== 'all') {
      filtered = [];
      for (var i = 0; i < records.length; i++) {
        if (records[i].type === filter) filtered.push(records[i]);
      }
    }
    this.setData({ filter: filter, filteredRecords: filtered });
  },

  addRecord: function () {
    wx.navigateTo({ url: '/pages/add/add' });
  },

  editRecord: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/add/add?id=' + id });
  },

  deleteRecord: function (e) {
    var id = e.currentTarget.dataset.id;
    var self = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: function (res) {
        if (res.confirm) {
          store.deleteRecord(id);
          self.refreshData();
          self.setData({ filter: self.data.filter });
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  }
})
