// 设置页
var util = require('../../utils/util');
var store = require('../../utils/store');

Page({
  data: {
    hasPassword: false,
    recordCount: 0,
    showImport: false,
    showPwdModal: false,
    pwdModalTitle: '设置密码',
    pwdNew: '',
    pwdError: '',
    showPwd: false
  },

  onShow: function () {
    var records = store.loadRecords();
    this.setData({
      hasPassword: !!store.getStoredHash(),
      recordCount: records.length
    });
  },

  // ─── 导出 ───
  exportData: function () {
    var records = store.loadRecords();
    if (records.length === 0) {
      wx.showToast({ title: '暂无数据可导出', icon: 'none' });
      return;
    }
    var jsonStr = JSON.stringify(records, null, 2);
    var fs = wx.getFileSystemManager();
    var fileName = '理财数据_' + util.todayStr() + '.json';
    var filePath = wx.env.USER_DATA_PATH + '/' + fileName;

    fs.writeFile({
      filePath: filePath,
      data: jsonStr,
      encoding: 'utf-8',
      success: function () {
        wx.showActionSheet({
          itemList: ['分享/保存文件'],
          success: function () {
            wx.shareFileMessage({
              filePath: filePath,
              fileName: fileName,
              success: function () {
                wx.showToast({ title: '导出成功', icon: 'success' });
              },
              fail: function () {
                // 分享失败，尝试保存到本地
                wx.saveFile({
                  tempFilePath: filePath,
                  success: function () {
                    wx.showToast({ title: '已保存到本地', icon: 'success' });
                  },
                  fail: function () {
                    wx.showToast({ title: '导出完成，文件在:' + filePath, icon: 'none' });
                  }
                });
              }
            });
          }
        });
      },
      fail: function (err) {
        wx.showToast({ title: '导出失败: ' + err.errMsg, icon: 'none' });
      }
    });
  },

  // ─── 导入 ───
  importData: function () {
    this.setData({ showImport: true });
  },

  hideImport: function () {
    this.setData({ showImport: false });
  },

  chooseFile: function () {
    var self = this;
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: function (res) {
        var file = res.tempFiles[0];
        var fs = wx.getFileSystemManager();
        fs.readFile({
          filePath: file.path,
          encoding: 'utf-8',
          success: function (readRes) {
            try {
              var data = JSON.parse(readRes.data);
              var records = Array.isArray(data) ? data : (data.records || []);
              if (records.length === 0) {
                wx.showToast({ title: '文件中没有有效记录', icon: 'none' });
                return;
              }
              store.saveRecords(records);
              self.hideImport();
              wx.showToast({ title: '导入成功: ' + records.length + ' 条', icon: 'success' });
              self.setData({ recordCount: records.length });
            } catch (e) {
              wx.showToast({ title: '文件格式错误', icon: 'none' });
            }
          },
          fail: function (err) {
            wx.showToast({ title: '读取文件失败', icon: 'none' });
          }
        });
      },
      fail: function () {
        // 用户取消选择
      }
    });
  },

  // ─── 清空 ───
  clearData: function () {
    var self = this;
    wx.showModal({
      title: '确认清空',
      content: '此操作不可恢复，确定要删除所有数据吗？',
      success: function (res) {
        if (res.confirm) {
          store.saveRecords([]);
          self.setData({ recordCount: 0 });
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  },

  // ─── 密码 ───
  setPassword: function () {
    this.setData({
      showPwdModal: true,
      pwdModalTitle: store.getStoredHash() ? '修改密码' : '设置密码',
      pwdNew: '',
      pwdError: ''
    });
  },

  hidePwdModal: function () {
    this.setData({ showPwdModal: false, pwdNew: '', pwdError: '' });
  },

  onPwdInput: function (e) {
    this.setData({ pwdNew: e.detail.value, pwdError: '' });
  },

  confirmPwd: function () {
    var pwd = this.data.pwdNew;
    if (!pwd || pwd.length < 4) {
      this.setData({ pwdError: '密码至少4位' });
      return;
    }
    store.setStoredHash(util.sha256(pwd));
    this.setData({
      hasPassword: true,
      showPwdModal: false,
      pwdNew: '',
      pwdError: ''
    });
    wx.showToast({ title: '密码已设置', icon: 'success' });
  },

  removePassword: function () {
    var self = this;
    wx.showModal({
      title: '关闭密码',
      content: '确定要关闭密码保护吗？',
      success: function (res) {
        if (res.confirm) {
          store.removeStoredHash();
          self.setData({ hasPassword: false });
          wx.showToast({ title: '密码已关闭', icon: 'success' });
        }
      }
    });
  }
})
