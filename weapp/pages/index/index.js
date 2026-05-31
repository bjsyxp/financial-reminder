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
    byType: { all: { count: 0 }, deposit: { count: 0 }, wealth: { count: 0 }, current: { count: 0 } },
    chipData: {},
    profitData: {},
    profitDaily: {},
    util: util
  },

  onLoad: function () {
    var hash = store.getStoredHash();
    this.setData({ hasPassword: !!hash });
    if (!hash) {
      // 无密码，直接进入
      this.setData({ locked: false });
      this.refreshData();
    }
  },

  onShow: function () {
    if (!this.data.locked) {
      this.refreshData();
    }
  },

  // 密码输入
  onPwdInput: function (e) {
    this.setData({ pwdInput: e.detail.value, pwdError: '' });
  },

  togglePwdShow: function () {
    this.setData({ showPwd: !this.data.showPwd });
  },

  onPwdConfirm: function () {
    var hash = store.getStoredHash();
    var input = this.data.pwdInput;
    if (!input) {
      this.setData({ pwdError: '请输入密码' });
      return;
    }
    var inputHash = util.sha256(input);
    if (inputHash === hash) {
      this.setData({ locked: false, pwdError: '' });
      this.refreshData();
    } else {
      this.setData({ pwdError: '密码错误，请重试' });
    }
  },

  onSetPwd: function () {
    var input = this.data.pwdInput;
    if (!input || input.length < 4) {
      this.setData({ pwdError: '密码至少4位' });
      return;
    }
    store.setStoredHash(util.sha256(input));
    this.setData({ hasPassword: true, locked: false, pwdError: '✅ 密码设置成功' });
    this.refreshData();
  },

  // 刷新数据
  refreshData: function () {
    var records = store.loadRecords();
    var stats = store.getStats(records);
    var byType = store.statsByType(records);

    // 到期标签和收益
    var chipData = {}, profitData = {}, profitDaily = {};
    records.forEach(function (r) {
      var days = util.getDaysRemaining(r.end);
      chipData[r.id] = util.getChip(days);
      var c = util.calcInterest(r.amount, r.rate, r.start, r.end);
      profitData[r.id] = c.interest;
      profitDaily[r.id] = c.daily;
    });

    this.setData({
      records: records,
      filteredRecords: records,
      stats: {
        totalWan: util.fmtWan(stats.total),
        totalMoney: util.fmtMoney(stats.total),
        interestWan: util.fmtWan(stats.totalInterest),
        interestMoney: util.fmtMoney(stats.totalInterest),
        count: stats.count
      },
      byType: {
        all: { count: records.length },
        deposit: byType.deposit,
        wealth: byType.wealth,
        current: byType.current
      },
      chipData: chipData,
      profitData: profitData,
      profitDaily: profitDaily
    });
  },

  // 筛选
  setFilter: function (e) {
    var filter = e.currentTarget.dataset.filter;
    var records = this.data.records;
    var filtered = filter === 'all' ? records : records.filter(function (r) { return r.type === filter; });
    this.setData({ filter: filter, filteredRecords: filtered });
  },

  // 添加
  addRecord: function () {
    wx.navigateTo({ url: '/pages/add/add' });
  },

  // 编辑
  editRecord: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/add/add?id=' + id });
  },

  // 删除
  deleteRecord: function (e) {
    var id = e.currentTarget.dataset.id;
    var self = this;
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？',
      success: function (res) {
        if (res.confirm) {
          var records = store.deleteRecord(id);
          self.refreshData();
          // 重新应用筛选
          self.setData({ records: records });
          self.setFilter({ currentTarget: { dataset: { filter: self.data.filter } } });
          wx.showToast({ title: '已删除', icon: 'success' });
        }
      }
    });
  }
})
