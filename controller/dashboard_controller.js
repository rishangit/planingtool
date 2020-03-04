
const SendResponse = require('../common/response');
const ScheduleAccess = require('../data_access/schedule_access');
const ScheduleController = require('../controller/schedule_controller');
const LeaveAccess = require("../data_access/leave_access");
const TeamAccess = require("../data_access/team_access");
const MemberAccess = require('../data_access/member_access');
const ProjectAccess = require('../data_access/project_access');
const ClientAccess = require('../data_access/client_access');
module.exports = {

    weekInfo: function (req, res) {
        var data = req.body; //data = {weekNo}
        var sendResponse = new SendResponse(res);
        var weekData = {};
        var weekInfo = {};

        data.filters = {}
        data.filters['archive'] = false;

        ScheduleAccess.listData({
            data: data,
            callBack: (docs) => {
                docs.forEach(schedule => {
                    if (!weekInfo[schedule.weekNo]) {
                        weekInfo[schedule.weekNo] = { team: {} }
                    }
                    if (!weekInfo[schedule.weekNo].team[schedule.teamID]) {
                        weekInfo[schedule.weekNo].team[schedule.teamID] = { project: {} }
                    }
                    if (!weekInfo[schedule.weekNo].team[schedule.teamID].project[schedule.projectID]) {
                        weekInfo[schedule.weekNo].team[schedule.teamID].project[schedule.projectID] = { FedHours: 0, BedHours: 0, QAHours: 0, UnAssignFedHours: 0, UnAssignBedHours: 0, UnAssignQAHours: 0 };
                    }
                    if (schedule.assign) {
                        weekInfo[schedule.weekNo].team[schedule.teamID].project[schedule.projectID].FedHours = weekInfo[schedule.weekNo].team[schedule.teamID].project[schedule.projectID].FedHours + schedule.FedHours;
                        weekInfo[schedule.weekNo].team[schedule.teamID].project[schedule.projectID].BedHours = weekInfo[schedule.weekNo].team[schedule.teamID].project[schedule.projectID].BedHours + schedule.BedHours;
                        weekInfo[schedule.weekNo].team[schedule.teamID].project[schedule.projectID].QAHours = weekInfo[schedule.weekNo].team[schedule.teamID].project[schedule.projectID].QAHours + schedule.QAHours;
                    } else {
                        weekInfo[schedule.weekNo].team[schedule.teamID].project[schedule.projectID].UnAssignFedHours = weekInfo[schedule.weekNo].team[schedule.teamID].project[schedule.projectID].UnAssignFedHours + schedule.FedHours ? schedule.FedHours : 0;
                        weekInfo[schedule.weekNo].team[schedule.teamID].project[schedule.projectID].UnAssignBedHours = weekInfo[schedule.weekNo].team[schedule.teamID].project[schedule.projectID].UnAssignBedHours + schedule.BedHours ? schedule.BedHours : 0;
                        weekInfo[schedule.weekNo].team[schedule.teamID].project[schedule.projectID].UnAssignQAHours = weekInfo[schedule.weekNo].team[schedule.teamID].project[schedule.projectID].UnAssignQAHours + schedule.QAHours ? schedule.QAHours : 0;
                    }
                });

                weekData.weekInfo = weekInfo;
                weekData.weekNo = data.weekList;
                sendResponse.sendSuccessObj(weekData)
            },

            error: (err) => {
                sendResponse.sendError(err);
            }
        })
    },


    weekInfoNew: function (req, res) {
        var data = req.body; //data = {weekNo}
        data['filters'] = { archive: false }
        var sendResponse = new SendResponse(res);
        ScheduleAccess.listDataforDashbord({
            data: data,
            callBack: (docs) => {
                this.generateDashData(docs, data, (dataArray, LeavelistForWeeks) => {
                    var obj = {};
                    obj.LeavelistForWeeks = LeavelistForWeeks;
                    obj.lst = dataArray;
                    sendResponse.sendSuccessObj(obj, data, count);
                })

            },

            error: (err) => {
                sendResponse.sendError(err);
            }
        })

    },


    async generateDashData(docs, param, callBack) {
        if (docs != null) {
            ResultObj = {};
            var scheduleList = docs;
            var ProjectIDList = {};
            var getProjectPromises = [];
            var getClientPromises = [];
            var getTeamInfo = [];
            scheduleList.map(schedule => {
                if (schedule.projectID) {
                    ProjectIDList[schedule.projectID] = schedule.projectID
                }
            })
            Object.keys(ProjectIDList).map(projectID => {
                getProjectPromises.push(ScheduleController.getProject(projectID))
            })


            var leaveList = await this.getLeaveHoursForWeek(param);


            var teamMemberPromiseList = [];
            var membersPromiseList = [];

            var teamMemberObjList = [];
            var memberObjList = []
            var objTeamMembers = {};
            param.teamIDList.forEach(team => { teamMemberPromiseList.push(this.getTeamMembersInfo(team._id)) });
            var teamMemberObjList = await Promise.all(teamMemberPromiseList);


            teamMemberObjList.forEach(teamObject => {
                objTeamMembers[teamObject._id] = teamObject.memberList;
                teamObject.memberList.forEach(memberID => {
                    membersPromiseList.push(this.getMembersInfo(memberID))
                });
            });

            var memberObjList = await Promise.all(membersPromiseList);
            LeavelistForWeeks = {}

            leaveList.forEach(leave => {
                Object.keys(objTeamMembers).forEach(teamID => {
                    if (LeavelistForWeeks[`${leave.weekNo}_${leave.year}`] == undefined)
                        LeavelistForWeeks[`${leave.weekNo}_${leave.year}`] = {}


                    if (LeavelistForWeeks[`${leave.weekNo}_${leave.year}`]['teams'] == undefined) {
                        LeavelistForWeeks[`${leave.weekNo}_${leave.year}`]['teams'] = {}
                    }

                    if (LeavelistForWeeks[`${leave.weekNo}_${leave.year}`]['teams'][teamID] == undefined)
                        LeavelistForWeeks[`${leave.weekNo}_${leave.year}`]['teams'][teamID] = { Fed: 0, Bed: 0, QA: 0 }


                    objTeamMembers[teamID].map(memberID => {
                        if (memberID == leave.memeberID) {
                            var member = memberObjList.find(function (element) { return element._id == memberID });
                            switch (member.position) {
                                case 0: //FED   
                                    LeavelistForWeeks[`${leave.weekNo}_${leave.year}`]['teams'][teamID].Fed++;
                                    break;
                                case 1: //BED    
                                    LeavelistForWeeks[`${leave.weekNo}_${leave.year}`]['teams'][teamID].Bed++;
                                    break;
                                case 2: //QA  
                                    LeavelistForWeeks[`${leave.weekNo}_${leave.year}`]['teams'][teamID].QA++;
                                    break;
                            }
                        }
                    })

                })
            })

            var ProjectObjList = await Promise.all(getProjectPromises)
            ProjectObjList.map(projetct => {
                getClientPromises.push(this.getClentList(projetct.clientID))
            })


            var ClientObjList = await Promise.all(getClientPromises)


            docs.map(schedule => {
                if (ResultObj[`${schedule.year}-${schedule.weekNo}`] == undefined)
                    ResultObj[`${schedule.year}-${schedule.weekNo}`] = {
                        weekNo: schedule.weekNo,
                        year: schedule.year,
                        Projects: {}
                    };

                var ProjectArray = ProjectObjList.filter(project => {
                    if (schedule.projectID == project._id) {
                        return project
                    }
                })
                var Project = ProjectArray[0]

                if (ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"] == undefined) {
                    ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"] = {};
                }
                if (ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID] == undefined) {
                    ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID] = { TotalFedSigned: 0, TotalBedSigned: 0, TotalQASigned: 0, TotalFed: 0, TotalBed: 0, TotalQA: 0, Projects: {} }
                }

                if (ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]['Projects'][schedule.projectID] == undefined) {
                    ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["Projects"][schedule.projectID] = { FedHours: 0, BedHours: 0, QAHours: 0, signed: false };
                    ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["Projects"][schedule.projectID].signed = Project.signed ? Project.signed : false;
                }


                let clientObj = this.getPropertyfromObject(ClientObjList, Project.clientID);

                ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["Projects"][schedule.projectID].FedHours += schedule.FedHours ? schedule.FedHours : 0;
                ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["Projects"][schedule.projectID].BedHours += schedule.BedHours ? schedule.BedHours : 0;
                ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["Projects"][schedule.projectID].QAHours += schedule.QAHours ? schedule.QAHours : 0;
                ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["Projects"][schedule.projectID].projectID = schedule.projectID;
                ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["Projects"][schedule.projectID].projectName = Project.name;
                ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["Projects"][schedule.projectID].clientID = Project.clientID;


                ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["Projects"][schedule.projectID].clientName = clientObj.name;
                ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["Projects"][schedule.projectID].clientImg = clientObj.img;


                ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["Projects"][schedule.projectID].teamID = schedule.teamID;
                ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["Projects"][schedule.projectID].year = schedule.year;
                ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["Projects"][schedule.projectID].weekNo = schedule.weekNo;
                ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["Projects"][schedule.projectID].scheduleID = schedule._id;
                ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["Projects"][schedule.projectID].comments = schedule.comments;

                
                if (Project.signed) {
                    ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["TotalFedSigned"] += schedule.FedHours ? schedule.FedHours : 0;
                    ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["TotalBedSigned"] += schedule.BedHours ? schedule.BedHours : 0;
                    ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["TotalQASigned"] += schedule.QAHours ? schedule.QAHours : 0;
                } else {
                    ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["TotalFed"] += schedule.FedHours ? schedule.FedHours : 0;
                    ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["TotalBed"] += schedule.BedHours ? schedule.BedHours : 0;
                    ResultObj[`${schedule.year}-${schedule.weekNo}`]["teams"][schedule.teamID]["TotalQA"] += schedule.QAHours ? schedule.QAHours : 0;
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
                weekobj.teams = ResultObj[key].teams;
                weekobj.Projects = Object.keys(ResultObj[key].Projects).map(
                    projetckey => {
                        return ResultObj[key].Projects[projetckey];
                    }
                );
                return weekobj;
            });
            callBack(dataArray, LeavelistForWeeks)

        }
    },


    getPropertyfromObject(arrayObj, val) {
        return arrayObj.find(obj => {
            if (obj._id == val) {
                return obj
            }
        })
    },

    getLeaveHoursForWeek(param) {
        return new Promise((resolve, reject) => {
            LeaveAccess.listDataforDashbord({
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
    },

    getProjectList(projectID) {
        return new Promise((resolve, reject) => {
            ProjectAccess.getData({
                data: { _id: projectID }, callBack: (docs) => {
                    resolve(docs);
                }
            });
        });
    },

    getClentList(clientID) {
        return new Promise((resolve, reject) => {
            ClientAccess.getData({
                data: { _id: clientID }, callBack: (docs) => {
                    resolve(docs);
                }
            });
        });
    }

}