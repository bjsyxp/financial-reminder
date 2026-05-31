// 到期详情页
var util = require('../../utils/util');
var store = require('../../utils/store');

Page({
  data: {
    groups: { expired: [], today: [], urgent: [], soon: [], safe: [], current: [] },
    chipData: {},
    util: util
  },

  onShow: function () {
    this.refresh();
  },

  refresh: function () {
    var records = store.loadRecords();
    var groups = { expired: [], y1: [], y2: [], y3: [], y4: [], current: [] };
    var chipData = {};

    records.forEach(function (r) {
      if (r.type === 'current') {
        groups.current.push(r);
        return;
      }
      var days = util.getDaysRemaining(r.end);
      chipData[r.id] = util.getChip(days);

      if (days < 0) groups.expired.push(r);
      else if (days <= 365) groups.y1.push(r);
      else if (days <= 730) groups.y2.push(r);
      else if (days <= 1095) groups.y3.push(r);
      else groups.y4.push(r);
    });

    // 每组内部按到期日排序（最早在前）
    function sortByEnd(arr) {
      arr.sort(function (a, b) { return (a.end || '').localeCompare(b.end || ''); });
    }
    sortByEnd(groups.expired);
    sortByEnd(groups.today);
    sortByEnd(groups.urgent);
    sortByEnd(groups.soon);
    sortByEnd(groups.safe);

    this.setData({ groups: groups, chipData: chipData });
  },

  editRecord: function (e) {
    var id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/add/add?id=' + id });
  }
})
