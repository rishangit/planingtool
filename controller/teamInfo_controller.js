const TeamAccess = require('../data_access/team_access');
const MemberAccess = require('../data_access/member_access');
const ScheduleAccess = require('../data_access/schedule_access');
const SendResponse = require('../common/response');
module.exports = {

  totalHoursForWeek: function (req, res) {
    var data = req.body; //data = {teamIDList}
    var sendResponse = new SendResponse(res);
    var teamHours = {};
    var memberCount = 0, totalMemberCount = 0, teamCount = 0, totalTeamCount = 0;
    if (!data.teamIDList || data.teamIDList.length == 0) {
      var searchData = {};
      searchData.filters = {}
      searchData.filters['archive'] = false;
      TeamAccess.listData({
        data: searchData,
        callBack: (docs) => {
          totalTeamCount = docs.length;
          if (totalTeamCount > 0) {
            docs.forEach(team => {
              teamCount++;
              this.teamData(team, teamHours, memberCount, totalMemberCount, teamCount, totalTeamCount, sendResponse)
            })
          } else {
            sendResponse.sendSuccessObj(teamHours)
          }
        }
      });
    } else {
      totalTeamCount = data.teamIDList.length;
      data.teamIDList.forEach(teamID => {
        TeamAccess.getData({
          data: { _id: teamID }, callBack: (team) => {
            teamCount++;
            this.teamData(team, teamHours, memberCount, totalMemberCount, teamCount, totalTeamCount, sendResponse)
          }
        })
      })
    }
  },

  teamData: function (team, teamHours, memberCount, totalMemberCount, teamCount, totalTeamCount, sendResponse) {
    var consts = require('../common/project/consts');
    var TotalWeekHours = consts.TotalWorkHoursForWeek;

    if (!teamHours[team._id]) {
      teamHours[team._id] = { FedHours: 0, BedHours: 0, QAHours: 0 };
    }
    if (!teamHours['TotHours']) {
      teamHours['TotHours'] = { FedHours: 0, BedHours: 0, QAHours: 0 };
    }

    if (team.memberList.length > 0) {
      totalMemberCount = totalMemberCount + team.memberList.length;
      team.memberList.forEach(memberID => {
        MemberAccess.getData({
          data: { _id: memberID }, callBack: (member) => {
            memberCount++;
            if (member != null) {
              switch (+member.position) {
                case 0: // fed
                  teamHours[team._id].FedHours = teamHours[team._id].FedHours + TotalWeekHours;
                  teamHours['TotHours'].FedHours = teamHours['TotHours'].FedHours + TotalWeekHours;
                  break;
                case 1: // bed
                  teamHours[team._id].BedHours = teamHours[team._id].BedHours + TotalWeekHours;
                  teamHours['TotHours'].BedHours = teamHours['TotHours'].BedHours + TotalWeekHours;
                  break;
                case 2: // qa
                  teamHours[team._id].QAHours = teamHours[team._id].QAHours + TotalWeekHours;
                  teamHours['TotHours'].QAHours = teamHours['TotHours'].QAHours + TotalWeekHours;
                  break;
                default:
                  break;
              }
            }
            teamHours[team._id].memberList = team.memberList
            teamHours[team._id].TotHours = teamHours[team._id].FedHours + teamHours[team._id].BedHours + teamHours[team._id].QAHours;
            if (teamCount == totalTeamCount && totalMemberCount == memberCount) {
              sendResponse.sendSuccessObj(teamHours)
            }
          }
        })
      })
    } else {
      teamHours[team._id].memberList = team.memberList
      teamHours[team._id].TotHours = teamHours[team._id].FedHours + teamHours[team._id].BedHours + teamHours[team._id].QAHours;
      if (teamCount == totalTeamCount && totalMemberCount == memberCount) {
        sendResponse.sendSuccessObj(teamHours)
      }
    }

  },




  scheduleHours: function (req, res) {
    var consts = require('../common/project/consts');
    var TotalWeekHours = consts.TotalWorkHoursForWeek;
    var data = req.body; //data = {teamIDList, weekList}
    var sendResponse = new SendResponse(res);
    var scheduleInfo = {};
    var teamHours = {};
    var teamIDs = {};
    var weekList = {};

    scheduleInfo.teamIDList = data.teamIDList;
    scheduleInfo.weekList = Object.keys(data.weekListYear);

    data.filters = {}
    data.filters['archive'] = false;

    ScheduleAccess.listData({
      data: data,
      callBack: (docs) => {
        if (docs != null) {
          docs.forEach(schedule => {
            weekList[schedule.weekNo] = schedule.weekNo;
            if (!teamHours[schedule.teamID]) {
              teamHours[schedule.teamID] = { FedHours: 0, BedHours: 0, QAHours: 0 };
              teamIDs[schedule.teamID] = schedule.teamID;
            }
            if (!teamHours['TotHours']) {
              teamHours['TotHours'] = { FedHours: 0, BedHours: 0, QAHours: 0 };
            }
            teamHours[schedule.teamID].BedHours = teamHours[schedule.teamID].BedHours + schedule.BedHours;
            teamHours[schedule.teamID].FedHours = teamHours[schedule.teamID].FedHours + schedule.FedHours;
            teamHours[schedule.teamID].QAHours = teamHours[schedule.teamID].QAHours + schedule.QAHours;
            teamHours[schedule.teamID].TotHours = teamHours[schedule.teamID].BedHours + teamHours[schedule.teamID].FedHours + teamHours[schedule.teamID].QAHours;

            teamHours['TotHours'].BedHours = teamHours['TotHours'].BedHours + schedule.BedHours;
            teamHours['TotHours'].FedHours = teamHours['TotHours'].FedHours + schedule.FedHours;
            teamHours['TotHours'].QAHours = teamHours['TotHours'].QAHours + schedule.QAHours;
          })
          scheduleInfo.hours = teamHours;
          scheduleInfo.teamIDList = data.teamIDList.length > 0 ? scheduleInfo.teamIDList : Object.keys(teamIDs);
          scheduleInfo.weekList = scheduleInfo.weekList.length > 0 ? scheduleInfo.weekList : Object.keys(weekList);

          teamTotHours = {};
          teamCount = 0;

          if (scheduleInfo.teamIDList.length > 0) {
            scheduleInfo.teamIDList.forEach(teamID => {
              TeamAccess.getData({
                data: { _id: teamID }, callBack: (team) => {
                  teamCount++;
                  if (team) {
                    if (!teamTotHours[team._id]) {
                      teamTotHours[team._id] = { FedHours: 0, BedHours: 0, QAHours: 0 };
                    }
                    teamTotHours[team._id].FedHours = team.fedCount * TotalWeekHours;
                    teamTotHours[team._id].BedHours = team.bedCount * TotalWeekHours;
                    teamTotHours[team._id].QAHours = team.qaCount ? team.qaCount * TotalWeekHours : 0;
                  }
                  if (scheduleInfo.teamIDList.length == teamCount) {
                    scheduleInfo.totalHours = teamTotHours;
                    sendResponse.sendSuccessObj(scheduleInfo)
                  }
                }
              })
            });
          } else {
            sendResponse.sendSuccessObj(scheduleInfo)
          }
        }
        else {
          sendResponse.sendSuccessObj(scheduleInfo)
        }
      },
      error: (err) => {
        sendResponse.sendError(err);
      }
    });
  }
}