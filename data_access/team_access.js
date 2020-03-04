var Datastore = require('nedb');
var consts = require('../common/consts');
var CommonAccess = require('./common_access');
const LinkMemberTeam = require('../data_access/link_member_team');
const db = new Datastore({
    filename: consts.dbpath + 'team.db', autoload: true
});

module.exports = {
    saveData(param) {
        db.insert(param.data, (err, doc) => {
            if (err)
                param.error(err);
            else
                param.callBack(doc);
        });
    },



    getData(param) {
        db.findOne(param.data, (err, doc) => {
            if (err)
                param.error(err);
            else {
                if (doc != null) {
                    this.getMemberList(doc, () => {
                        param.callBack(doc);
                    })
                } else {
                    param.callBack(doc);
                }
            }
        });
    },

    updateData(param) {
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

    listData(param) {
        queryObj = {}
        if (param.data.query != undefined && param.data.query != '') {
            searchString = param.data.query.split(' ').join('|');
            var regex = new RegExp(searchString, 'i');
            var reg = { $regex: regex }
            queryObj = { $or: [{ "name": reg }, { "description": reg }] }
        }
        //SetFilters
        queryObj = CommonAccess.setListFilters(param.data, queryObj)
        this.totalCountForQuery(queryObj, param.data, (totCount) => {
            db.find(queryObj).sort(param.data.sortBy).limit(param.data.limit).skip(param.data.cursor).exec((err, docs) => {
                if (err)
                    param.error(err);
                else {
                    docCount = docs.length;
                    count = 0;
                    if (docCount > 0) {
                        docs.forEach(doc => {
                            this.getMemberList(doc, () => {
                                count++;
                                if (docCount == count) {
                                    param.callBack(docs, totCount);
                                }
                            })
                        })
                    } else {
                        param.callBack(docs);
                    }
                }
            });
        });
    },

    removeData: function (param) {
        db.findOne(param.data, (err, team) => {
            if (team) {
                team.archive = true;
                db.update({ _id: team._id }, { $set: team }, {}, (err, doc) => {
                    if (err)
                        param.error(err);
                    else {
                        if (doc == 1) {
                            param.callBack(team);
                        }
                    }
                });

            }
        })
    },

    // removeData(param) {
    //     db.remove(param.data, (err, doc) => {
    //         if (err)
    //             param.error(err);
    //         else {
    //             param.callBack(doc);
    //         }

    //     });
    // },


    getMemberList(doc, callback) {
        LinkMemberTeam.listData({
            data: { teamID: doc._id },
            callBack: (linkMembers) => {
                doc.memberList = linkMembers.map(obj => { return obj.memberID });
                callback(doc)
            }
        })
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