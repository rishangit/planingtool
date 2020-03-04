const Access = require("../data_access/schedule_access");
const ProjectAccess = require('../data_access/project_access');
const LeaveAccess = require("../data_access/leave_access");
const TeamAccess = require("../data_access/team_access");
const MemberAccess = require('../data_access/member_access');
const SendResponse = require("../common/response");
const CommonData = require("../common/common_data");
const Request = require("../common/request");
const Projects = require("../common/projects");
module.exports = {
  save: function (req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    CommonData.setData(data, req.session.user);
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
  },

  saveSchedule: function (req, res) {
    var reqSaveSchedue = new Request.ReqSaveSchedule();
    reqSaveSchedue = req.body;

    var sendResponse = new SendResponse(res);
    var checkAvailabilityPromises = [];


    reqSaveSchedue.selectedWeekList.map(weekNo => {
      let schedule = new Projects.Schedule();
      let hasChange = false;


      if (reqSaveSchedue.HoursByWeeks[weekNo].BedHours > 0 || reqSaveSchedue.scheduleID) {
        hasChange = true;
        schedule.BedHours = reqSaveSchedue.HoursByWeeks[weekNo].BedHours;// reqSaveSchedue.BedHours;
      }

      if (reqSaveSchedue.HoursByWeeks[weekNo].FedHours > 0 || reqSaveSchedue.scheduleID) {
        hasChange = true;
        schedule.FedHours = reqSaveSchedue.HoursByWeeks[weekNo].FedHours;//reqSaveSchedue.FedHours;
      }

      if (reqSaveSchedue.HoursByWeeks[weekNo].QAHours > 0 || reqSaveSchedue.scheduleID) {
        hasChange = true;
        schedule.QAHours = reqSaveSchedue.HoursByWeeks[weekNo].QAHours;//reqSaveSchedue.QAHours;
      }

      if (reqSaveSchedue.comments) {
        schedule.comments = reqSaveSchedue.comments
      }

      if (hasChange) {
        schedule.projectID = reqSaveSchedue.selectedProjectID;
        schedule.teamID = reqSaveSchedue.selectedTeamID;
        schedule.weekNo = weekNo;
        schedule.year = reqSaveSchedue.selectedYear;
        if (reqSaveSchedue.scheduleID)
          schedule._id = reqSaveSchedue.scheduleID;
        CommonData.setData(schedule, req.session.user);
        checkAvailabilityPromises.push(this.checkAvailabilityNew(schedule));
      }

    });

    var saveUpdateLeavePromise = [];
    Promise.all(checkAvailabilityPromises).then(dataList => {
      dataList.forEach(objschedule => {
        saveUpdateLeavePromise.push(
          this.saveUpdateSchedule(objschedule.schedule, objschedule.isUpdate)
        );
      });
      Promise.all(saveUpdateLeavePromise).then(savedData => {
        sendResponse.sendSuccessList(savedData);
      });
    });
  },

  saveUpdateSchedule(schedule, update) {
    return new Promise((resolve, reject) => {
      var data;
      if (update) {
        Access.updateData({
          data: schedule,
          callBack: doc => {
            objschedule = { success: true, data: schedule };
            resolve(objschedule);
          },
          error: err => {
            objschedule = { success: false, data: err };
            resolve(objschedule);
          }
        });
      } else {
        Access.saveData({
          data: schedule,
          callBack: doc => {
            objschedule = { success: true, data: schedule };
            resolve(objschedule);
          },
          error: err => {
            objschedule = { success: false, data: err };
            resolve(objschedule);
          }
        });
      }
    });
  },

  get: function (req, res) {
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

  update: function (req, res) {
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

  list: function (req, res) {
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


  listweekforSelectedWeek: function (req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    Access.listDataWeekforSelectedWeek({
      data: data,
      callBack: (docs, count) => {
        if (docs != null) {
          this.generateSchedulData(docs, data, (dataArray, LeavelistForWeeks) => {
            var obj = {};
            obj.LeavelistForWeeks = LeavelistForWeeks;
            obj.lst = dataArray;

            sendResponse.sendSuccessObj(obj, data, count);
          })
        } else {
          sendResponse.sendSuccessEmpty();
        }
      },
      error: err => {
        sendResponse.sendError(err);
      }
    });
  },



  listweek: function (req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    Access.listDataWeek({
      data: data,
      callBack: (docs, count) => {
        if (docs != null) {
          let tempWeelYearList = {}
          let weekListYear = [];
          docs.map(doc => {
            tempWeelYearList[`${doc.weekNo}_${doc.year}`] = doc.weekNo;
          })

          weekListYear = Object.keys(tempWeelYearList).map(objkeys => {
            return { weekNo: parseInt(objkeys.split('_')[0]), year: parseInt(objkeys.split('_')[1]) }
          })

          this.generateSchedulData(docs, data, (dataArray) => {
            dataArray = dataArray.slice(data.cursor, data.cursor + data.limit);
            sendResponse.sendSuccessList(dataArray, data, count);
          })
        } else {
          sendResponse.sendSuccessEmpty();
        }
      },
      error: err => {
        sendResponse.sendError(err);
      }
    });
  },


  async generateSchedulData(docs, param, callBack) {

    if (docs != null) {
      ResultObj = {};
      var scheduleList = docs;
      var ProjectIDList = {};
      var getProjectPromises = [];
      var getTeamInfo = [];
      scheduleList.map(schedule => {
        if (schedule.projectID) {
          ProjectIDList[schedule.projectID] = schedule.projectID
        }
      })
      Object.keys(ProjectIDList).map(projectID => {
        getProjectPromises.push(this.getProject(projectID))
      })

      var LeavelistForWeeks = {};
      if (param.weekListYear) {
        var leaveList = await this.getLeaveHoursForWeek(param);
        var teamMemberList = await this.getTeamMembersInfo(param.teamIDList);

        var memberslist = [];
        teamMemberList.memberList.map(memberID => {
          memberslist.push(this.getMembersInfo(memberID))
        })

        var teamMemberObjList = await Promise.all(memberslist);
        param.weekListYear.forEach(WeekObj => {
          let leaveListForWeek = leaveList.filter(leave => leave.weekNo == WeekObj.weekNo);
          if (LeavelistForWeeks[WeekObj.weekNo] == undefined)
            LeavelistForWeeks[WeekObj.weekNo] = { Fed: 0, Bed: 0, QA: 0 }

          leaveListForWeek.map(leave => {
            teamMemberObjList.map(member => {
              if (member._id == leave.memeberID) {
                switch (member.position) {
                  case 0: //FED   
                    LeavelistForWeeks[WeekObj.weekNo].Fed++;
                    break;
                  case 1: //BED    
                    LeavelistForWeeks[WeekObj.weekNo].Bed++;
                    break;
                  case 2: //QA  
                    LeavelistForWeeks[WeekObj.weekNo].QA++;
                    break;
                }
              }
            })
          })
        });
      }
      await Promise.all(getProjectPromises).then(dataList => {
        docs.map(schedule => {
          if (ResultObj[`${schedule.year}-${schedule.weekNo}`] == undefined)
            ResultObj[`${schedule.year}-${schedule.weekNo}`] = {
              weekNo: schedule.weekNo,
              year: schedule.year,
              Projects: {}
            };

          var ProjectArray = dataList.filter(project => {
            if (schedule.projectID == project._id) {
              return project
            }
          })
          var Project = ProjectArray[0]
          // if( ResultObj[`${schedule.year}-${schedule.weekNo}`] == undefined){
          //   ResultObj[`${schedule.year}-${schedule.weekNo}`] = {Projects:{},TotalFedSigned:0,TotalBedSigned:0, TotalQASigned:0,TotalFed:0,TotalBed:0,TotalQA:0}
          // }
          if (ResultObj[`${schedule.year}-${schedule.weekNo}`]["Projects"][schedule.projectID] == undefined) {
            ResultObj[`${schedule.year}-${schedule.weekNo}`]["Projects"][schedule.projectID] = { FedHours: 0, BedHours: 0, QAHours: 0, signed: false };
            ResultObj[`${schedule.year}-${schedule.weekNo}`]["Projects"][schedule.projectID].signed = Project.signed ? Project.signed : false;
          }

          if (ResultObj[`${schedule.year}-${schedule.weekNo}`]["TotalFedSigned"] == undefined) {
            ResultObj[`${schedule.year}-${schedule.weekNo}`]["TotalFedSigned"] = 0;
          }
          if (ResultObj[`${schedule.year}-${schedule.weekNo}`]["TotalBedSigned"] == undefined) {
            ResultObj[`${schedule.year}-${schedule.weekNo}`]["TotalBedSigned"] = 0;
          }
          if (ResultObj[`${schedule.year}-${schedule.weekNo}`]["TotalQASigned"] == undefined) {
            ResultObj[`${schedule.year}-${schedule.weekNo}`]["TotalQASigned"] = 0;
          }
          if (ResultObj[`${schedule.year}-${schedule.weekNo}`]["TotalFed"] == undefined) {
            ResultObj[`${schedule.year}-${schedule.weekNo}`]["TotalFed"] = 0;
          }
          if (ResultObj[`${schedule.year}-${schedule.weekNo}`]["TotalBed"] == undefined) {
            ResultObj[`${schedule.year}-${schedule.weekNo}`]["TotalBed"] = 0;
          }
          if (ResultObj[`${schedule.year}-${schedule.weekNo}`]["TotalQA"] == undefined) {
            ResultObj[`${schedule.year}-${schedule.weekNo}`]["TotalQA"] = 0;
          }

          ResultObj[`${schedule.year}-${schedule.weekNo}`]["Projects"][schedule.projectID].FedHours += schedule.FedHours;
          ResultObj[`${schedule.year}-${schedule.weekNo}`]["Projects"][schedule.projectID].BedHours += schedule.BedHours;
          ResultObj[`${schedule.year}-${schedule.weekNo}`]["Projects"][schedule.projectID].QAHours += schedule.QAHours;
          ResultObj[`${schedule.year}-${schedule.weekNo}`]["Projects"][schedule.projectID].projectID = schedule.projectID;
          ResultObj[`${schedule.year}-${schedule.weekNo}`]["Projects"][schedule.projectID].teamID = schedule.teamID;
          ResultObj[`${schedule.year}-${schedule.weekNo}`]["Projects"][schedule.projectID].year = schedule.year;
          ResultObj[`${schedule.year}-${schedule.weekNo}`]["Projects"][schedule.projectID].weekNo = schedule.weekNo;
          ResultObj[`${schedule.year}-${schedule.weekNo}`]["Projects"][schedule.projectID].scheduleID = schedule._id;
          ResultObj[`${schedule.year}-${schedule.weekNo}`]["Projects"][schedule.projectID].comments = schedule.comments;


          if (Project.signed) {
            ResultObj[`${schedule.year}-${schedule.weekNo}`]["TotalFedSigned"] += schedule.FedHours;
            ResultObj[`${schedule.year}-${schedule.weekNo}`]["TotalBedSigned"] += schedule.BedHours;
            ResultObj[`${schedule.year}-${schedule.weekNo}`]["TotalQASigned"] += schedule.QAHours;
          } else {
            ResultObj[`${schedule.year}-${schedule.weekNo}`]["TotalFed"] += schedule.FedHours;
            ResultObj[`${schedule.year}-${schedule.weekNo}`]["TotalBed"] += schedule.BedHours;
            ResultObj[`${schedule.year}-${schedule.weekNo}`]["TotalQA"] += schedule.QAHours;
          }

        });
        let dataArray = Object.keys(ResultObj).map(key => {
          let weekobj = {};
          weekobj.weekNo = ResultObj[key].weekNo;
          weekobj.year = ResultObj[key].year;
          weekobj.TotalFed = ResultObj[key].TotalFed;
          weekobj.TotalBed = ResultObj[key].TotalBed;
          weekobj.TotalQA = ResultObj[key].TotalQA;
          weekobj.TotalFedSigned = ResultObj[key].TotalFedSigned;
          weekobj.TotalBedSigned = ResultObj[key].TotalBedSigned;
          weekobj.TotalQASigned = ResultObj[key].TotalQASigned;
          weekobj.Projects = Object.keys(ResultObj[key].Projects).map(
            projetckey => {
              return ResultObj[key].Projects[projetckey];
            }
          );
          return weekobj;
        });

        callBack(dataArray, LeavelistForWeeks)
      })
    }
  },


  remove: function (req, res) {
    var data = req.body;
    var sendResponse = new SendResponse(res);
    Access.removeData({
      data: data,
      callBack: doc => {
        if (doc) {
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

  checkAvailabilityNew(data) {
    return new Promise((resolve, reject) => {
      Access.getData({
        data: {
          year: data.year,
          weekNo: data.weekNo,
          teamID: data.teamID,
          projectID: data.projectID
        },
        callBack: doc => {
          obj = {};
          if (doc) {
            if (data._id) {
              obj.schedule = Object.assign(doc, data);
            } else {
              if (!doc.archive) {
                data.FedHours = data.FedHours + doc.FedHours;
                data.BedHours = data.BedHours + doc.BedHours;
                data.QAHours = data.QAHours + doc.QAHours;
              } else {
                doc.archive = false;
                doc.FedHours = 0;
                doc.BedHours = 0;
                doc.QAHours = 0;
              }
              obj.schedule = Object.assign(doc, data);
            }
          } else {
            obj.schedule = data;
          }
          obj.isUpdate = doc ? true : false;
          resolve(obj);
        }
      });
    });
  },

  getProject(projectID) {
    return new Promise((resolve, reject) => {
      ProjectAccess.getData({
        data: {
          _id: projectID,
        },
        callBack: doc => {
          resolve(doc);
        }
      });
    });
  },

  getLeaveHoursForWeek(param) {
    return new Promise((resolve, reject) => {
      LeaveAccess.listData({
        data: param,
        callBack: docs => {
          resolve(docs);
        }
      });
    });
  },

  getTeamMembersInfo(teamID) {
    return new Promise((resolve, reject) => {
      TeamAccess.getMemberList({ _id: teamID }, (docs) => {
        resolve(docs);
      });
    });
  },


  getMembersInfo(memberID) {
    return new Promise((resolve, reject) => {
      MemberAccess.getData({
        data: { _id: memberID }, callBack: (docs) => {
          resolve(docs);
        }
      });
    });
  }
};
