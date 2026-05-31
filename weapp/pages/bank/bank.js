// 银行汇总 — 可展开查看明细
var util = require('../../utils/util');
var store = require('../../utils/store');

Page({
  data: {
    banks: [],
    totalWan: '0.00万',
    totalMoney: '¥0.00',
    util: util
  },

  onShow: function () {
    this.refresh();
  },

  refresh: function () {
    var records = store.loadRecords();
    var map = {};
    records.forEach(function (r) {
      var inst = r.inst || '未知';
      if (!map[inst]) map[inst] = { inst: inst, total: 0, count: 0, deposit: 0, wealth: 0, current: 0, items: [], expanded: false };
      map[inst].total += r.amount || 0;
      map[inst].count++;
      if (map[inst][r.type] !== undefined) map[inst][r.type] += r.amount || 0;
      map[inst].items.push(r);
    });
    var banks = Object.keys(map).sort().map(function (k) { return map[k]; });
    var total = 0;
    banks.forEach(function (b) { total += b.total; });
    this.setData({
      banks: banks,
      totalWan: util.fmtWan(total),
      totalMoney: util.fmtMoney(total)
    });
  },

  // 展开/收起银行明细
  toggleBank: function (e) {
    var inst = e.currentTarget.dataset.inst;
    var banks = this.data.banks;
    for (var i = 0; i < banks.length; i++) {
      if (banks[i].inst === inst) {
        banks[i].expanded = !banks[i].expanded;
        break;
      }
    }
    this.setData({ banks: banks });
  }
})
