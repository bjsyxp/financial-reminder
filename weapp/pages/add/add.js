// 添加/编辑 — 完全对照源程序设计
var util = require('../../utils/util');
var store = require('../../utils/store');

var TERM_OPTIONS = [
  { label: '手动填写', value: '' },
  { label: '3 个月', value: '3m' },
  { label: '6 个月', value: '6m' },
  { label: '1 年', value: '1y' },
  { label: '2 年', value: '2y' },
  { label: '3 年', value: '3y' },
  { label: '5 年', value: '5y' }
];

var COMMON_BANKS = [
  '工商银行','农业银行','建设银行','长安银行','众邦银行',
  '兴业银行','新网银行','微众银行','亿联银行','百信银行','富民银行','蓝海银行'
];

Page({
  data: {
    editId: null,
    termList: TERM_OPTIONS.map(function(t) { return t.label; }),
    termValues: TERM_OPTIONS.map(function(t) { return t.value; }),
    commonBanks: COMMON_BANKS,
    form: {
      type: 'deposit',
      inst: '',
      amountStr: '',
      rate: '',
      monthlyIncome: '',
      start: util.todayStr(),
      end: '',
      termIdx: 0,
      note: ''
    },
    previewShow: false,
    previewText: ''
  },

  onLoad: function (options) {
    if (options.id) {
      var record = store.getRecord(options.id);
      if (record) {
        wx.setNavigationBarTitle({ title: '编辑资产' });
        var amountWan = record.amount ? (record.amount / 10000).toFixed(4).replace(/\.?0+$/, '') : '';
        this.setData({
          editId: options.id,
          form: {
            type: record.type || 'deposit',
            inst: record.inst || '',
            amountStr: amountWan,
            rate: String(record.rate || ''),
            monthlyIncome: '',
            start: record.start || '',
            end: record.end || '',
            termIdx: 0,
            note: record.note || record.memo || ''
          }
        });
        this.setTimeoutCalcPreview();
      }
    }
  },

  // 选择银行
  pickBank: function (e) {
    var name = e.currentTarget.dataset.name;
    var form = this.data.form;
    form.inst = name;
    this.setData({ form: form });
  },

  // 类型切换
  setType: function (e) {
    var type = e.currentTarget.dataset.type;
    var form = this.data.form;
    form.type = type;
    if (type === 'current') form.end = '';
    this.setData({ form: form });
    this.setTimeoutCalcPreview();
  },

  // 输入
  onInput: function (e) {
    var field = e.currentTarget.dataset.field;
    var form = this.data.form;
    form[field] = e.detail.value;
    this.setData({ form: form });
  },

  // 金额输入
  onAmountInput: function (e) {
    var form = this.data.form;
    form.amountStr = e.detail.value;
    this.setData({ form: form });
    this.setTimeoutCalcPreview();
  },

  // 利率输入
  onRateInput: function (e) {
    var form = this.data.form;
    form.rate = e.detail.value;
    this.setData({ form: form });
    this.setTimeoutCalcPreview();
  },

  // 月收益输入→算利率
  onMonthlyInput: function (e) {
    var form = this.data.form;
    form.monthlyIncome = e.detail.value;
    this.setData({ form: form });
    var m = parseFloat(form.monthlyIncome);
    var a = parseFloat(form.amountStr) * 10000;
    if (m > 0 && a > 0) {
      var r = ((m * 12) / a * 100).toFixed(2);
      form.rate = r;
      this.setData({ form: form });
    }
    this.setTimeoutCalcPreview();
  },

  // 日期选择
  onDateChange: function (e) {
    var field = e.currentTarget.dataset.field;
    var form = this.data.form;
    form[field] = e.detail.value;
    this.setData({ form: form });
    this.setTimeoutCalcPreview();
  },

  // 期限选择
  onTermChange: function (e) {
    var idx = parseInt(e.detail.value);
    var val = this.data.termValues[idx];
    var form = this.data.form;
    form.termIdx = idx;
    // 自动计算到期日
    if (val && form.start) {
      var d = new Date(form.start + 'T00:00:00');
      if (val === '3m') d.setMonth(d.getMonth() + 3);
      else if (val === '6m') d.setMonth(d.getMonth() + 6);
      else if (val === '1y') d.setFullYear(d.getFullYear() + 1);
      else if (val === '2y') d.setFullYear(d.getFullYear() + 2);
      else if (val === '3y') d.setFullYear(d.getFullYear() + 3);
      else if (val === '5y') d.setFullYear(d.getFullYear() + 5);
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      form.end = y + '-' + m + '-' + day;
    }
    this.setData({ form: form });
    this.setTimeoutCalcPreview();
  },

  // 利息预览
  calcPreview: function () {
    var form = this.data.form;
    var amountWan = parseFloat(form.amountStr);
    var rate = parseFloat(form.rate);
    var start = form.start;
    var end = form.end;
    var type = form.type;

    if (!amountWan || !rate || !start) {
      this.setData({ previewShow: false, previewText: '' });
      return;
    }

    var amount = Math.round(amountWan * 10000);
    var c = util.calcInterest(amount, rate, start, end);
    var noEnd = (type === 'current' || type === 'wealth');

    if (c.days <= 0 && !noEnd) {
      this.setData({ previewShow: true, previewText: '⚠️ 到期日期需晚于存入日期' });
      return;
    }

    var text;
    if (noEnd) {
      text = '存入 ' + c.days + ' 天 ｜ 累计收益 ' + util.fmtMoney(c.interest) + ' ｜ 日收益 ' + util.fmtMoney(c.daily);
    } else {
      text = '存期 ' + c.days + ' 天 ｜ 预计利息 ' + util.fmtMoney(c.interest) + ' ｜ 日收益 ' + util.fmtMoney(c.daily);
    }
    this.setData({ previewShow: true, previewText: text });
  },

  setTimeoutCalcPreview: function () {
    var self = this;
    if (this._calcTimer) clearTimeout(this._calcTimer);
    this._calcTimer = setTimeout(function () { self.calcPreview(); }, 300);
  },

  // 保存
  onSave: function () {
    var form = this.data.form;
    if (!form.inst) { wx.showToast({ title: '请填写机构名称', icon: 'none' }); return; }
    if (!form.amountStr || parseFloat(form.amountStr) <= 0) { wx.showToast({ title: '请填写金额', icon: 'none' }); return; }
    if (!form.rate || parseFloat(form.rate) <= 0) { wx.showToast({ title: '请填写年利率', icon: 'none' }); return; }
    if (!form.start) { wx.showToast({ title: '请选择起息日', icon: 'none' }); return; }
    if (form.type === 'deposit') {
      if (!form.end) { wx.showToast({ title: '请填写到期日期', icon: 'none' }); return; }
      if (form.end <= form.start) { wx.showToast({ title: '到期日期需晚于存入日期', icon: 'none' }); return; }
    }

    var amount = Math.round(parseFloat(form.amountStr) * 10000);
    var record = {
      type: form.type,
      inst: form.inst,
      amount: amount,
      rate: parseFloat(form.rate),
      start: form.start,
      end: form.type === 'current' ? null : form.end,
      note: form.note || ''
    };

    if (this.data.editId) {
      store.updateRecord(this.data.editId, record);
      wx.showToast({ title: '已更新', icon: 'success' });
    } else {
      store.addRecord(record);
      wx.showToast({ title: '已添加', icon: 'success' });
    }

    setTimeout(function () { wx.navigateBack(); }, 800);
  },

  onCancel: function () {
    wx.navigateBack();
  }
})
