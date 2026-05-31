// 到期详情页 — 仅保留1/2/3年分级，去除已过期和4年+
var util = require('../../utils/util');
var store = require('../../utils/store');

Page({
  data: {
    groups: { y1: [], y2: [], y3: [], current: [] },
    chipData: {},
    stats: { y1: 0, y2: 0, y3: 0, current: 0, count: 0 },
    totalCount: 0,
    util: util
  },

  onShow: function () {
    this.refresh();
  },

  refresh: function () {
    var records = store.loadRecords();
    var groups = { y1: [], y2: [], y3: [], current: [] };
    var chipData = {};
    var stats = { y1: 0, y2: 0, y3: 0, current: 0, count: 0 };
    var totalCount = 0;

    records.forEach(function (r) {
      totalCount++;
      if (r.type === 'current') {
        groups.current.push(r);
        stats.current += r.amount || 0;
        return;
      }
      var days = util.getDaysRemaining(r.end);
      if (days < 0 || days > 1095) return; // 跳过已过期和4年+
      chipData[r.id] = util.getChip(days);

      if (days <= 365) { groups.y1.push(r); stats.y1 += r.amount || 0; }
      else if (days <= 730) { groups.y2.push(r); stats.y2 += r.amount || 0; }
      else { groups.y3.push(r); stats.y3 += r.amount || 0; }
      stats.count++;
    });

    function sortByEnd(arr) {
      arr.sort(function (a, b) { return (a.end || '').localeCompare(b.end || ''); });
    }
    sortByEnd(groups.y1);
    sortByEnd(groups.y2);
    sortByEnd(groups.y3);

    this.setData({ groups: groups, chipData: chipData, stats: stats, totalCount: totalCount });
  },

  editRecord: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/add/add?id=' + id });
  }
})
