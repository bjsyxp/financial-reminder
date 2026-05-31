// 添加/编辑资产
var store = require('../../utils/store');
var util = require('../../utils/util');

Page({
  data: {
    editId: null,
    form: {
      type: 'deposit',
      inst: '',
      amount: '',
      rate: '',
      start: util.todayStr(),
      end: '',
      memo: ''
    }
  },

  onLoad: function (options) {
    if (options.id) {
      var record = store.getRecord(options.id);
      if (record) {
        wx.setNavigationBarTitle({ title: '编辑资产' });
        this.setData({
          editId: options.id,
          form: {
            type: record.type,
            inst: record.inst || '',
            amount: String(record.amount || ''),
            rate: String(record.rate || ''),
            start: record.start || '',
            end: record.end || '',
            memo: record.memo || ''
          }
        });
      }
    }
  },

  setType: function (e) {
    var type = e.currentTarget.dataset.type;
    var form = this.data.form;
    form.type = type;
    if (type === 'current') form.end = '';
    this.setData({ form: form });
  },

  onInput: function (e) {
    var field = e.currentTarget.dataset.field;
    var form = this.data.form;
    form[field] = e.detail.value;
    this.setData({ form: form });
  },

  onDateChange: function (e) {
    var field = e.currentTarget.dataset.field;
    var form = this.data.form;
    form[field] = e.detail.value;
    this.setData({ form: form });
  },

  onSave: function () {
    var form = this.data.form;
    if (!form.inst) { wx.showToast({ title: '请输入机构名称', icon: 'none' }); return; }
    if (!form.amount) { wx.showToast({ title: '请输入金额', icon: 'none' }); return; }
    if (!form.rate) { wx.showToast({ title: '请输入年利率', icon: 'none' }); return; }
    if (!form.start) { wx.showToast({ title: '请选择起息日', icon: 'none' }); return; }

    var record = {
      type: form.type,
      inst: form.inst,
      amount: parseFloat(form.amount),
      rate: parseFloat(form.rate),
      start: form.start,
      end: form.type === 'current' ? null : (form.end || ''),
      memo: form.memo || ''
    };

    if (this.data.editId) {
      store.updateRecord(this.data.editId, record);
      wx.showToast({ title: '已保存', icon: 'success' });
    } else {
      store.addRecord(record);
      wx.showToast({ title: '已添加', icon: 'success' });
    }

    setTimeout(function () {
      wx.navigateBack();
    }, 1000);
  },

  onCancel: function () {
    wx.navigateBack();
  }
})
