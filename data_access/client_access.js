var Datastore = require('nedb');
var consts = require('../common/consts');
var CommonAccess = require('./common_access');
const db = new Datastore({
    filename: consts.dbpath + 'client.db', autoload: true
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
        queryObj = {}
        if (param.data.query != undefined && param.data.query != '') {
            searchString = param.data.query.split(' ').join('|');
            var regex = new RegExp(searchString, 'i');
            var reg = { $regex: regex }
            queryObj = { $or: [{ "name": reg }, { "description": reg }] }
        }
        //SetFilters
        queryObj = CommonAccess.setListFilters(param.data, queryObj)
        this.totalCountForQuery(queryObj, param.data, (count) => {
            db.find(queryObj).sort(param.data.sortBy).limit(param.data.limit).skip(param.data.cursor).exec((err, docs) => {
                if (err)
                    param.error(err);
                else { param.callBack(docs, count); }
            });
        });
    },


    removeData: function (param) {
        db.findOne(param.data, (err, proj) => {
            if (proj) {
                proj.archive = true;
                db.update({ _id: proj._id }, { $set: proj }, {}, (err, doc) => {
                    if (err)
                        param.error(err);
                    else {
                        if (doc == 1) {
                            param.callBack(proj);
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