const Access = require('../data_access/team_access');
const LinkMemberTeam = require('../data_access/link_member_team');
const SendResponse = require('../common/response');
const CommonData = require('../common/common_data');
const Enums = require('../common/project/enum');
module.exports = {

  save: function (req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    CommonData.setData(data, req.session.user);
    var team = data;
    var count = 0
    this.checkAvailability(data, sendResponse, () => {
      this.generateTeamObj(team, (objTeam) => {
        Access.saveData({
          data: objTeam,
          callBack: (doc) => {
            if (doc != null) {
              team._id = doc._id;
              this.saveLinkMemberTeam(team, count, () => {
                sendResponse.sendSuccessObj(team)
              })
            } else { sendResponse.sendSuccessEmpty() }
          },
          error: (err) => {
            sendResponse.sendError(err);
          }
        });
      })
    })
  },


  get: function (req, res) {
    var team = req.body;
    var sendResponse = new SendResponse(res);
    Access.getData({
      data: team,
      callBack: (doc) => {
        if (doc != null)
          sendResponse.sendSuccessObj(doc)
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
    var team = data;
    this.generateTeamObj(team, (objTeam) => {
      Access.updateData({
        data: objTeam,
        callBack: (doc) => {
          if (doc != null) {
            this.getMemberList(objTeam, (oldTeam) => {
              var removeList = { memberList: [], _id: objTeam._id };
              var addList = { memberList: [], _id: objTeam._id };
              team.memberList.forEach(newMember => {
                if (!oldTeam.memberList.find(oldMember => { return oldMember == newMember })) {
                  addList.memberList.push(newMember);
                }
              });
              oldTeam.memberList.forEach(oldMember => {
                if (!team.memberList.find(newMember => { return oldMember == newMember })) {
                  removeList.memberList.push(oldMember);
                }
              });
              var addcount = 0;
              this.saveLinkMemberTeam(addList, addcount, () => {
                removeCount = 0;
                removeList.memberList.forEach(removeMember => {
                  LinkMemberTeam.removeData({
                    data: { teamID: data._id, memberID: removeMember },
                    callBack: () => {
                      removeCount++;
                      if (removeList.memberList.length == removeCount)
                        sendResponse.sendSuccessObj(team)
                    }
                  })
                })
              })
            })
          }
          else { sendResponse.sendSuccessEmpty() }
        },
        error: (err) => {
          sendResponse.sendError(err);
        }
      });
    });
  },


  list: function (req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    Access.listData({
      data: data,
      callBack: (docs, count) => {
        if (docs != null)
          sendResponse.sendSuccessList(docs, data, count)
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
      data: { _id: data._id },
      callBack: (doc) => {
        if (doc != null && doc > 0) {
          LinkMemberTeam.removeData({
            data: { teamID: data._id },
            callBack: () => {
              sendResponse.sendSuccessObj(data)
            }
          })
        }
        else { sendResponse.sendSuccessEmpty() }
      },
      error: (err) => {
        sendResponse.sendError(err);
      }
    });
  },

  generateTeamObj: function (paramTeam, callBack) {
    var MemberAccess = require('../data_access/member_access');
    var Consts = require('../common/project/consts');
    var teamHours = {};
    var team = Object.assign({}, paramTeam)
    memberCount = 0;
    team['fedCount'] = 0;
    team['bedCount'] = 0;
    team['qaCount'] = 0;
    if (team.memberList.length > 0) {
      team.memberList.forEach(memberID => {
        MemberAccess.getData({
          data: { _id: memberID }, callBack: (member) => {
            memberCount++
            switch (+member.position) {
              case 0: // fed
                team['fedCount']++;
                break;
              case 1: // bed
                team['bedCount']++;
                break;
              case 2: // Qa
                team['qaCount']++;
                break;
              default:
                break;
            }
            if (team.memberList.length == memberCount) {
              delete team.memberList;
              callBack(team)
            }
          }
        })
      });
    } else {
      callBack(team)
    }

  },

  getMemberList(doc, callback) {
    LinkMemberTeam.listData({
      data: { teamID: doc._id },
      callBack: (linkMembers) => {
        doc.memberList = linkMembers.map(obj => { return obj.memberID });
        //sendResponse.sendSuccessObj()
        callback(doc)
      }
    })
  },

  saveLinkMemberTeam(team, count, callback) {
    if (team.memberList.length > 0) {
      team.memberList.forEach(memberID => {
        var linkMemberTeam = {};
        linkMemberTeam.memberID = memberID;
        linkMemberTeam.teamID = team._id;
        LinkMemberTeam.saveData({
          data: linkMemberTeam,
          callBack: (savedLinkMemberTeam) => {
            if (savedLinkMemberTeam != null) {
              count++;
              if (team.memberList.length == count) {
                //sendResponse.sendSuccessObj(doc)
                callback()
              }
            }
          }
        })
      })
    } else {
      callback()
    }
  },

  checkAvailability(data, sendResponse, callBack) {
    Access.getData({
      data: { name: data.name },
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