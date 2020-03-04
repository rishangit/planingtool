var Datastore = require('nedb');
var consts = require('../common/consts');
const db = new Datastore({
    filename: consts.dbpath + 'notes.db', autoload: true
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


    listData: function (param) {
        queryObj = {}
        if (param.data.query != undefined && param.data.query != '') {
            searchString = param.data.query.split(' ').join('|');
            var regex = new RegExp(searchString, 'i');
            var reg = { $regex: regex }
            queryObj = { $or: [{ "name": reg }, { "description": reg }] }
        }
        if (param.data.filters['parentID']) {
            queryObj  = {$and:[queryObj,  { "parentID": param.data.filters['parentID'] }]}
        }
        this.totalCountForQuery(queryObj, param.data, (count) => {
            db.find(queryObj).sort(param.data.sortBy).limit(param.data.limit).skip(param.data.cursor).exec((err, docs) => {
                if (err)
                    param.error(err);
                else { param.callBack(docs, count); }
            });
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


    removeData: function (param) {
        db.remove(param.data, function (err, doc) {
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