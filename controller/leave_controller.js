const Access = require("../data_access/leave_access");
var MemberAccess = require("../data_access/member_access");
const LinkMemberTeam = require("../data_access/link_member_team");
const SendResponse = require("../common/response");
const CommonData = require("../common/common_data");
const Enums = require("../common/project/enum");

module.exports = {
  save: function(req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    CommonData.setData(data, req.session.user);
    this.checkAvailability(data, sendResponse, () => {
      Access.saveData({
        data: data,
        callBack: doc => {
          if (doc != null) {
            sendResponse.sendSuccessObj(doc);
          } else {
            sendResponse.sendSuccessEmpty();
          }
        },
        error: err => {
          sendResponse.sendError(err);
        }
      });
    });
  },

  saveMulti: function(req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    var AvailableList = [];
    var totcount = data.memberList.length * data.dateList.length;
    var count = 0;
    data.memberList.forEach(memberID => {
      data.dateList.forEach(date => {
        var leave = {};
        leave.date = date.date;
        leave.weekNo = date.weekNo;
        leave.year = date.year;
        leave.note = data.note;
        leave.memeberID = memberID;
        CommonData.setData(leave, req.session.user);
        this.checkAvailability(leave, AvailableList, isAvailable => {
          if (!isAvailable) {
            Access.saveData({
              data: leave,
              callBack: doc => {
                count++;
                if (count == totcount) {
                  sendResponse.sendSuccessList(AvailableList);
                }
              },
              error: err => {
                sendResponse.sendError(err);
              }
            });
          } else {
            count++;
            if (totcount == AvailableList.length) {
              sendResponse.sendSuccessList(AvailableList);
            }
          }
        });
      });
    });
  },

  get: function(req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    Access.getData({
      data: data,
      callBack: doc => {
        if (doc != null) {
          sendResponse.sendSuccessObj(doc);
        } else {
          sendResponse.sendSuccessEmpty();
        }
      },
      error: err => {
        sendResponse.sendError(err);
      }
    });
  },

  update: function(req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    CommonData.setData(data, req.session.user);
    Access.updateData({
      data: data,
      callBack: doc => {
        if (doc != null) {
          sendResponse.sendSuccessObj(doc);
        } else {
          sendResponse.sendSuccessEmpty();
        }
      },
      error: err => {
        sendResponse.sendError(err);
      }
    });
  },

  saveupdateMulti: function(req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    var availableList = [];
    var LeaveList = [];
    var checkAvailabilityPromises = [];
    data.memberList.forEach(memberID => {
      data.dateList.forEach(date => {
        var leave = {};
        leave.date = date.date;
        leave.weekNo = date.weekNo;
        leave.year = date.year;
        leave.note = data.note;
        leave.memeberID = memberID;
        CommonData.setData(leave, req.session.user);
        LeaveList.push(leave);
         checkAvailabilityPromises.push(this.checkAvailabilityNew(leave));
      });
    });

    Promise.all(checkAvailabilityPromises).then(dataList => {
        isUpdateList = dataList.filter(availableLeave => availableLeave.isUpdate == true);
        newList = dataList.filter(availableLeave => availableLeave.isUpdate == false);   
        var saveUpdateLeavePromise = [];
        isUpdateList.forEach(objleave=>{
             saveUpdateLeavePromise.push(this.saveUpdateLeave(objleave.leave, objleave.isUpdate))
        })
        newList.forEach(objleave=>{
             saveUpdateLeavePromise.push(this.saveUpdateLeave(objleave.leave, objleave.isUpdate))
        })
         Promise.all(saveUpdateLeavePromise).then(savedData => {
            sendResponse.sendSuccessList(savedData);
        })
    }); 

  },

  saveUpdateLeave(leave, update) {
    return new Promise((resolve, reject) => {
      var data;
      if (update) {
        Access.updateData({
          data: leave,
          callBack: doc => { 
              objleave = {success : true, data:leave }
            resolve(objleave);
          },
          error: err => {
            objleave = {success : false, data:err }
            resolve(objleave);
          }
        });
      } else {
        Access.saveData({
          data: leave,
          callBack: doc => {
            objleave = {success : true, data:leave }
            resolve(objleave);
          },
          error: err => {
            objleave = {success : false, data:err }
            resolve(objleave);
          }
        });
      }
     
    });
  },

  list: function(req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    Access.listData({
      data: data,
      callBack: (docs, count) => {
        if (docs != null) {
          sendResponse.sendSuccessList(docs, data, count);
        } else {
          sendResponse.sendSuccessEmpty();
        }
      },
      error: err => {
        sendResponse.sendError(err);
      }
    });
  },

  remove: function(req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    Access.removeData({
      data: data,
      callBack: doc => {
        if (doc != null && doc > 0) {
          sendResponse.sendSuccessObj(data);
        } else {
          sendResponse.sendSuccessEmpty();
        }
      },
      error: err => {
        sendResponse.sendError(err);
      }
    });
  },

  leaveInfoForWeek: function(req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    var leaveInfo = {};
    var memberList = {};
    var leaveCount = 0;
    var leaveMemberCount = 0;
    Access.listData({
      data: data,
      callBack: docs => {
        if (docs.length > 0) {
          leaveCount = docs.length;
          docs.forEach(leave => {
            ///member = memberList[leave.memeberID
            MemberAccess.getData({
              data: { _id: leave.memeberID },
              callBack: member => {
                //memberList[member._id] = member;
                if (member != null) {
                  if (member._id)
                    this.generetaleaveHours(
                      member,
                      leave,
                      leaveInfo,
                      leaveCount,
                      leaveMemberCount,
                      leaveInfo => {
                        leaveMemberCount = leaveMemberCount + 1;
                        if (leaveCount == leaveMemberCount) {
                          sendResponse.sendSuccessObj(leaveInfo);
                        }
                      }
                    );
                } else {
                }
              },
              error: err => {}
            });
          });
        } else {
          sendResponse.sendSuccessEmpty();
        }
      },
      error: err => {
        sendResponse.sendError(err);
      }
    });
  },

  generetaleaveHours(
    member,
    leave,
    leaveInfo,
    leaveCount,
    leaveMemberCount,
    callback
  ) {
    leaveMemberCount = leaveMemberCount + 1;
    var consts = require("../common/project/consts");
    LinkMemberTeam.listData({
      data: { memberID: member._id },
      callBack(linkMemberTeams) {
        if (linkMemberTeams.length > 0) {
          linkMemberTeams.forEach(linkMemberTeam => {
            if (!leaveInfo[leave.weekNo]) {
              leaveInfo[leave.weekNo] = { team: {} };
            }
            if (!leaveInfo[leave.weekNo].team[linkMemberTeam.teamID]) {
              leaveInfo[leave.weekNo].team[linkMemberTeam.teamID] = {
                FedHours: 0,
                BedHours: 0,
                QAHours: 0
              };
            }
            if (!leaveInfo["TotHours"]) {
              leaveInfo["TotHours"] = { FedHours: 0, BedHours: 0, QAHours: 0 };
            }
            switch (member.position) {
              case 0: //fed
                leaveInfo[leave.weekNo].team[linkMemberTeam.teamID].FedHours =
                  leaveInfo[leave.weekNo].team[linkMemberTeam.teamID].FedHours +
                  consts.totalWorkHoursForDay;
                leaveInfo["TotHours"].FedHours =
                  leaveInfo["TotHours"].FedHours + consts.totalWorkHoursForDay;
                break;
              case 1: //bed
                leaveInfo[leave.weekNo].team[linkMemberTeam.teamID].BedHours =
                  leaveInfo[leave.weekNo].team[linkMemberTeam.teamID].BedHours +
                  consts.totalWorkHoursForDay;
                leaveInfo["TotHours"].BedHours =
                  leaveInfo["TotHours"].BedHours + consts.totalWorkHoursForDay;
                break;
              case 2: //qa
                leaveInfo[leave.weekNo].team[linkMemberTeam.teamID].QAHours =
                  leaveInfo[leave.weekNo].team[linkMemberTeam.teamID].QAHours +
                  consts.totalWorkHoursForDay;
                leaveInfo["TotHours"].QAHours =
                  leaveInfo["TotHours"].QAHours + consts.totalWorkHoursForDay;
                break;
              default:
                break;
            }
          });
          callback(leaveInfo);
        } else {
          callback(leaveInfo);
        }
      }
    });
  },

  checkAvailability(data, availableList, callBack) {
    Access.getData({
      data: { date: data.date, memeberID: data.memeberID },
      callBack: doc => {
        if (doc == null) {
          callBack(false);
        } else {
          availableList.push(data);
          callBack(true);
          //sendResponse.sendErrorMsg(Enums.ErrorType.ALREADY_EXISTS, data.date)
        }
      }
    });
  },

  checkAvailabilityNew(data) {
    return new Promise((resolve, reject) => {
      Access.getData({
        data: { date: data.date, memeberID: data.memeberID },
        callBack: doc => {
            obj = {}
            obj.leave = doc ? Object.assign(doc,data) :data;
            obj.isUpdate = doc ? true :false
          resolve(obj);
        }
      });
    });
  }
};
