
const moment = require('moment');
const Session = require('./session');
module.exports = {
    setData(data, user) {
        data.dateEdited = moment().valueOf();
        if (!data.dateCreated)
            data.dateCreated = data.dateEdited;
        data.editedBy = user._id;
        if (!data.createdBy)
            data.createdBy = data.editedBy;
        if (!data.archive) {
            data.archive = false;
        }
    }
}