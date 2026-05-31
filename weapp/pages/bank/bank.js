// 银行汇总
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
    var banks = store.getBankSummary(records);
    var total = 0;
    banks.forEach(function (b) { total += b.total; });
    this.setData({
      banks: banks,
      totalWan: util.fmtWan(total),
      totalMoney: util.fmtMoney(total)
    });
  }
})
