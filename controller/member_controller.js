const Access = require('../data_access/member_access');
const LinkMemberTeam = require('../data_access/link_member_team');
const SendResponse = require('../common/response');
const CommonData = require('../common/common_data');
const Enums = require('../common/project/enum');
const session = require('express-session');
const bcrypt = require('bcrypt');
module.exports = {

  save: function (req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    CommonData.setData(data, req.session.user);
    this.checkAvailability(data, sendResponse, () => {
      this.getPasswordHash(data, (hash) => {
        data.password = hash;
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
      })
    })
  },


  get: function (req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    Access.getData({
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


  update: function (req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    CommonData.setData(data, req.session.user);
    this.getPasswordHash(data, (hash) => {
      data.password = hash;
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
    })
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
    LinkMemberTeam.listData({
      data: { memberID: data._id },
      callBack: (docs) => {
        if (docs.length == 0) {
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
        } else {
          sendResponse.sendErrorMsg(Enums.ErrorType.USED_IN_ANOTHER, '')
        }
      }
    })
  },

  getPasswordHash(data, callBack) {
    if (data.password) {
      bcrypt.hash(data.password, 10, function (err, hash) {
        // Store hash in database
        callBack(hash)
      });
    } else {
      Access.getData({
        data: { _id: data._id },
        callBack: (doc) => {
          if (doc != null) {
            callBack(doc.password);
          }
        }
      }, true);
    }
  },

  checkAvailability(data, sendResponse, callBack) {
    Access.getData({
      data: { email: data.email },
      callBack: (doc) => {
        if (doc == null) {
          callBack();
        } else {
          sendResponse.sendErrorMsg(Enums.ErrorType.ALREADY_EXISTS, '')
        }
      }
    });
  }
}