// 银行汇总 — 可展开查看明细，预计算显示值
var util = require('../../utils/util');
var store = require('../../utils/store');

Page({
  data: {
    banks: [],
    totalStr: '0.00万'
  },

  onShow: function () {
    this.refresh();
  },

  refresh: function () {
    var records = store.loadRecords();
    var map = {};
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var inst = r.inst || '未知';
      if (!map[inst]) map[inst] = { inst: inst, total: 0, count: 0, items: [], expanded: false, _totalWan: '', types: [] };
      map[inst].total += r.amount || 0;
      map[inst].count++;
      r._amountWan = util.fmtWan(r.amount);
      r._dateRange = (r.start ? util.fmtDate(r.start) : '?') + ' ~ ' + (r.end ? util.fmtDate(r.end) : '长期');
      r._dateLong = (r.start ? util.fmtDate(r.start) : '?') + ' ~ 长期';
      map[inst].items.push(r);
    }
    var banks = [];
    var keys = Object.keys(map).sort();
    for (var i = 0; i < keys.length; i++) {
      var b = map[keys[i]];
      b._totalWan = util.fmtWan(b.total);
      b._depositWan = util.fmtWan(b.deposit || 0);
      b._wealthWan = util.fmtWan(b.wealth || 0);
      b._currentWan = util.fmtWan(b.current || 0);
      banks.push(b);
    }
    var total = 0;
    for (var i = 0; i < banks.length; i++) total += banks[i].total;

    this.setData({
      banks: banks,
      totalStr: util.fmtWan(total)
    });
  },

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
