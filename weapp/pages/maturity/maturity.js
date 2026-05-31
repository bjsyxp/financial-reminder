// 到期详情页 — 仅保留1/2/3年分级，预计算显示值
var util = require('../../utils/util');
var store = require('../../utils/store');

Page({
  data: {
    groups: { y1: [], y2: [], y3: [], current: [] },
    stats: { y1: '0.00万', y2: '0.00万', y3: '0.00万', current: '0.00万', count: 0 }
  },

  onShow: function () {
    this.refresh();
  },

  refresh: function () {
    var records = store.loadRecords();
    var groups = { y1: [], y2: [], y3: [], current: [] };
    var stats = { y1: 0, y2: 0, y3: 0, current: 0, count: 0 };

    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if (r.type === 'current') {
        r._amountWan = util.fmtWan(r.amount);
        r._dateRange = util.fmtDate(r.start) + ' ~ 长期';
        groups.current.push(r);
        stats.current += r.amount || 0;
        continue;
      }
      var days = util.getDaysRemaining(r.end);
      if (days < 0 || days > 1095) continue;

      r._chip = util.getChip(days);
      r._amountWan = util.fmtWan(r.amount);
      r._dateRange = util.fmtDate(r.start) + ' ~ ' + util.fmtDate(r.end);

      if (days <= 365) { groups.y1.push(r); stats.y1 += r.amount || 0; }
      else if (days <= 730) { groups.y2.push(r); stats.y2 += r.amount || 0; }
      else { groups.y3.push(r); stats.y3 += r.amount || 0; }
      stats.count++;
    }

    function sortByEnd(arr) {
      arr.sort(function (a, b) { return (a.end || '').localeCompare(b.end || ''); });
    }
    if (groups.y1.length) sortByEnd(groups.y1);
    if (groups.y2.length) sortByEnd(groups.y2);
    if (groups.y3.length) sortByEnd(groups.y3);

    this.setData({
      groups: groups,
      stats: {
        y1: util.fmtWan(stats.y1),
        y2: util.fmtWan(stats.y2),
        y3: util.fmtWan(stats.y3),
        current: util.fmtWan(stats.current),
        count: stats.count
      }
    });
  },

  editRecord: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/add/add?id=' + id });
  }
})
