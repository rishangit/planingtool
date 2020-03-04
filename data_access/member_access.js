var Datastore = require('nedb');
var consts = require('../common/consts');
var CommonAccess = require('./common_access');
const db = new Datastore({
    filename: consts.dbpath + 'member.db', autoload: true
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

    getData: function (param, withpass) {
        db.findOne(param.data, (err, doc) => {
            if (err)
                param.error(err);
            else {
                if (doc) {
                    if (withpass) {
                        param.callBack(doc);
                    }
                    else {
                        param.callBack(this.generateResult(doc));
                    }
                } else {
                    param.callBack(null)
                }
            }
        });
    },

    logging: function (param) {
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
                    param.callBack(this.generateResult(param.data));
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
            queryObj = { $or: [{ "firstName": reg }, { "lastName": reg }, { "email": reg }] }
        }

        //SetFilters
        queryObj = CommonAccess.setListFilters(param.data, queryObj)
        this.totalCountForQuery(queryObj, param.data, (count) => {
            db.find(queryObj).sort(param.data.sortBy).limit(param.data.limit).skip(param.data.cursor).exec((err, docs) => {
                if (err)
                    param.error(err);
                else {
                    docs = docs.map(obj => {
                        return this.generateResult(obj)
                    })
                    param.callBack(docs, count);
                }
            });
        })
    },


    removeData: function (param) {
        db.findOne(param.data, (err, member) => {
            if (member) {
                member.archive = true;
                db.update({ _id: member._id }, { $set: member }, {}, (err, doc) => {
                    if (err)
                        param.error(err);
                    else {
                        if (doc == 1) {
                            param.callBack(this.generateResult(member));
                        }
                    }
                });

            }
        })
    },

    // removeData: function (param) {
    //     db.remove(param.data, (err, doc) => {
    //         if (err)
    //             param.error(err);
    //         else
    //             param.callBack(doc);
    //     });
    // },

    generateResult: function (obj) {
        data = {};
        if (obj) {
            data._id = obj._id;
            data.firstName = obj.firstName;
            data.lastName = obj.lastName;
            data.email = obj.email;
            data.userName = obj.userName;
            data.position = obj.position;
            data.permission = obj.permission;
            data.createdBy = obj.createdBy;
            data.editedBy = obj.editedBy;
            data.dateCreated = obj.dateCreated;
            data.dateEdited = obj.dateEdited;
            data.img = obj.img;
            data.archive = obj.archive;
        }
        return data
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