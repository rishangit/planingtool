var Datastore = require('nedb');
var consts = require('../common/consts');
const db = new Datastore({
    filename: consts.dbpath + 'link_member_team.db', autoload: true
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

    listData: function (param) {
        db.find(param.data, (err, docs) => {
            if (err)
                param.error(err);
            else {
                param.callBack(docs);
            }
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

    removeData: function (param) {
        db.remove(param.data, { multi: true }, (err, doc) => {
            if (err)
                param.error(err);
            else
                param.callBack(doc);
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
}