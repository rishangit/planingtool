var Datastore = require('nedb');
var consts = require('../common/consts');
var CommonAccess = require('./common_access');
const db = new Datastore({
    filename: consts.dbpath + 'schedule.db', autoload: true
});

module.exports = {
    saveData: function (param) {
        db.insert(param.data, function (err, doc) {
            if (err)
                param.error(err);
            else
                param.callBack(doc);
        });
    },

    getData: function (param) {
        db.findOne(param.data, function (err, doc) {
            if (err)
                param.error(err);
            else
                param.callBack(doc);
        });
    },

    updateData: function (param) {
        db.update({ _id: param.data._id }, { $set: param.data }, {}, function (err, doc) {
            if (err)
                param.error(err);
            else {
                if (doc == 1) {
                    param.callBack(param.data);
                }

            }
        });
    },

    listData: function (param) {
        //queryObj = { $or: [] }
        // param.data.weekList.forEach(week => {
        //     var and = [{ 'weekNo': week }];
        //     if (param.data.teamID)
        //         and.push({ 'teamID': param.data.teamID });
        //     if (param.data.projectID)
        //         and.push({ 'projectID': param.data.projectID });
        //     queryObj.$or.push({ $and: and });
        // });
        var or_Array = [];
        if (param.data.weekListYear && Object.keys(param.data.weekListYear).length > 0) {
            or_Array.push({
                $or: param.data.weekListYear.map(obj => {
                    return { $and: [{ 'weekNo': obj.weekNo }, { 'year': obj.year }] }
                })
            });
        }
        // if (param.data.weekList && param.data.weekList.length > 0) {
        //     or_Array.push({
        //         $or: param.data.weekList.map(week => {
        //             return { $and: [{ 'weekNo': week }, { 'year': 2018 }] }
        //         })
        //     });
        // }
        if (param.data.teamIDList && param.data.teamIDList.length > 0) {
            or_Array.push({
                $or: param.data.teamIDList.map(teamID => {
                    return { 'teamID': teamID }
                })
            });
        }
        if (param.data.projectIDList && param.data.projectIDList.length > 0) {
            or_Array.push({
                $or: param.data.projectIDList.map(projectID => {
                    return { 'projectID': projectID }
                })
            });
        }
        var queryObj

        if (or_Array.length == 1) {
            queryObj = or_Array[0];
        } else {
            queryObj = { $and: or_Array }
        }

        //SetFilters
        queryObj = CommonAccess.setListFilters(param.data, queryObj)



        this.totalCountForQuery(queryObj, param.data, (totCount) => {
            db.find(queryObj).sort(param.data.sortBy).limit(param.data.limit).skip(param.data.cursor).exec((err, docs) => {
                if (err)
                    param.error(err);
                else { param.callBack(docs, totCount); }
            });
        });
    },

    listDataWeekforSelectedWeek: function (param) {
        //SetFilters
        var or_Array = [];
        if (param.data.weekListYear && Object.keys(param.data.weekListYear).length > 0) {
            or_Array.push({
                $or: param.data.weekListYear.map(obj => {
                    return { $and: [{ 'weekNo': obj.weekNo }, { 'year': obj.year }] }
                })
            });
        }
        var queryObj
        if (or_Array.length == 1) {
            queryObj = or_Array[0];
        } else {
            queryObj = { $and: or_Array }
        }

        //SetFilters
        queryObj = CommonAccess.setListFilters(param.data, queryObj)

        this.totalCountForQuery(queryObj, param.data, (totCount) => {
            db.find(queryObj).sort(param.data.sortBy).exec((err, docs) => {
                if (err)
                    param.error(err);
                else { param.callBack(docs, totCount); }
            });
        });
    },


    listDataforDashbord: function (param) {
        //SetFilters
        var or_Array = [];
        //or_Array.push({ $and: [{ 'weekNo': { $gte: param.data.currentWeek.weekNo } }, { 'year':{ $gte: param.data.currentWeek.year } }] });
        or_Array.push(
            {$or:[
            { $and: [{ 'weekNo': { $gte: 1 } }, { 'year':{ $gte: param.data.currentWeek.year + 1 } }] },
            { $and: [{ 'weekNo': { $gte: param.data.currentWeek.weekNo } }, { 'year':{ $gte: param.data.currentWeek.year } }] }
            ]});
        //or_Array.push({ $and: [{ 'weekNo':  41 }, { 'year':{ $gte: param.data.currentWeek.year } }] });
        var queryObj
        if (or_Array.length == 1) {
            queryObj = or_Array[0];
        } else {
            queryObj = { $and: or_Array }
        }
        //SetFilters
        queryObj = CommonAccess.setListFilters(param.data, queryObj);

        this.totalCountForQuery(queryObj, param.data, (totCount) => {
            db.find(queryObj).sort(param.data.sortBy).exec((err, docs) => {
                console.log('docs', JSON.stringify(docs))
                if (err)
                    param.error(err);
                else { 
                    param.callBack(docs, totCount); }
            });
        });
    },

    listDataWeek: function (param) {
        queryObj = null
        //SetFilters
        queryObj = CommonAccess.setListFilters(param.data, queryObj);
        this.totalCountForQuery(queryObj, param.data, (totCount) => {
            db.find(queryObj).sort(param.data.sortBy).exec((err, docs) => {
                if (err)
                    param.error(err);
                else { param.callBack(docs, totCount); }
            });
        });
    },

    removeData: function (param) {
        db.findOne(param.data, (err, schedule) => {
            if (schedule) {
                schedule.archive = true;
                db.update({ _id: schedule._id }, { $set: schedule }, {}, (err, doc) => {
                    if (err){
                      param.error(err); 
                    }
                    else {
                        if (doc == 1) {
                            param.callBack(doc);
                        }
                    }
                });
            }
        })
    },

    // removeData: function (param) {
    //     db.remove(param.data, function (err, doc) {
    //         if (err)
    //             param.error(err);
    //         else
    //             param.callBack(doc);
    //     });
    // },

    totalCountForQuery(queryObj, data, callBack) {
        if (data.cursor == 0) {
            db.count(queryObj).exec((err, count) => {
                callBack(count)
            })
        } else {
            callBack(null)
        }
    }

}