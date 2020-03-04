const Access = require('../data_access/notes_access');
const SendResponse = require('../common/response');
const CommonData = require('../common/common_data');
const Enums = require('../common/project/enum');

module.exports = {

    save: function (req, res) {
        var data = req.body;
        var sendResponse = new SendResponse(res);
        CommonData.setData(data, req.session.user);
        Access.saveData({
            data: data,
            callBack: (doc) => {
                if (doc != null) {
                    sendResponse.sendSuccessObj(doc)
                }
                else { sendResponse.sendSuccessEmpty() }
            },
            error: (err) => {
                sendResponse.sendError(err);
            }
        });

    },

    

  list: function (req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    Access.listData({
      data: data,
      callBack: (docs, count) => {
        if (docs != null) { sendResponse.sendSuccessList(docs, data, count) }
        else { sendResponse.sendSuccessEmpty() }
      },
      error: (err) => {
        sendResponse.sendError(err);
      }
    });
  },


  remove: function (req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    Access.removeData({
      data: data,
      callBack: (doc) => {
        if (doc != null && doc > 0) { sendResponse.sendSuccessObj(data) }
        else { sendResponse.sendSuccessEmpty() }
      },
      error: (err) => {
        sendResponse.sendError(err);
      }
    });
  },

  update: function (req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    CommonData.setData(data, req.session.user);
    Access.updateData({
      data: data,
      callBack: (doc) => {
        if (doc != null) { sendResponse.sendSuccessObj(doc) }
        else { sendResponse.sendSuccessEmpty() }
      },
      error: (err) => {
        sendResponse.sendError(err);
      }
    });
  },
}