var Datastore = require('nedb');
var consts = require('../common/consts');
const db = new Datastore({
    filename: consts.dbpath + 'leave.db', autoload: true
});

module.exports = {
    saveData: function (param) {
        db.insert(param.data, (err, doc) => {
            if (err)
                param.error(err);
            else
                param.callBack(doc);
        });
    },

    getData: function (param) {
        db.findOne(param.data, (err, doc) => {
            if (err)
                param.error(err);
            else {
                if (doc) {
                    param.callBack(doc);
                } else {
                    param.callBack(null)
                }
            }
        });
    },

    updateData: function (param) {
        db.update({ _id: param.data._id }, { $set: param.data }, {}, (err, doc) => {
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
        queryObj = {}
        var or_Array = [];
        if (param.data.weekListYear && Object.keys(param.data.weekListYear).length > 0) {
            or_Array.push({
                $or: param.data.weekListYear.map(obj => {
                    return { $and: [{ 'weekNo': obj.weekNo }, { 'year': obj.year }] }
                })
            });
        }
        if (param.data.memeberID) {
            or_Array.push({ "memeberID": param.data.memeberID })
        }
        if (or_Array.length == 1) {
            queryObj = or_Array[0];
        } else {
            queryObj = { $and: or_Array }
        }
        this.totalCountForQuery(queryObj, param.data, (count) => {
            db.find(queryObj).sort(param.data.sortBy).limit(param.data.limit).skip(param.data.cursor).exec((err, docs) => {
                if (err)
                    param.error(err);
                else {
                    param.callBack(docs, count);
                }
            });
        });
    },

    listDataforDashbord: function (param) {
        //SetFilters
        var or_Array = [];
        or_Array.push({ $and: [{ 'weekNo': { $gte: param.data.currentWeek.weekNo } }, { 'year':{ $gte: param.data.currentWeek.year } }] });
        
        var queryObj
        if (or_Array.length == 1) {
            queryObj = or_Array[0];
        } else {
            queryObj = { $and: or_Array }
        }

        this.totalCountForQuery(queryObj, param.data, (totCount) => {
            db.find(queryObj).sort(param.data.sortBy).exec((err, docs) => {
                if (err)
                    param.error(err);
                else { param.callBack(docs, totCount); }
            });
        });
    },



    removeData: function (param) {
        db.remove(param.data, (err, doc) => {
            if (err)
                param.error(err);
            else
                param.callBack(doc);
        });
    },

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