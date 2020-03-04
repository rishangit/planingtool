
const Access = require('../data_access/member_access');
const SendResponse = require('../common/response');
const session = require('express-session')
const bcrypt = require('bcrypt');
module.exports = {
    signin(req, res) {
        var data = req.body;
        var sendResponse = new SendResponse(res);
        Access.logging({
            data: { email: data.userName },
            callBack: (doc) => {
                if (doc != null) {
                    bcrypt.compare(data.password, doc.password, function (err, res) {
                        if (res) {
                            req.session.user = doc;
                            sendResponse.sendSuccessObj(Access.generateResult(doc))
                        } else {
                            sendResponse.sendSuccessEmpty()
                        }
                    });
                }
                else {
                    sendResponse.sendSuccessEmpty()
                }
            },
            error: (err) => {
                sendResponse.sendError(err);
            }
        });
    },

    signout(req, res) {
        var data = req.body;
        var sendResponse = new SendResponse(res);
        if (req.session.user) {
            if (req.session.user.email == data.userName) {
                req.session.destroy(function (err) {
                    if (err) {
                        return next(err);
                    } else {
                        sendResponse.sendSuccessObj({})
                    }
                });
            }
        } else
            sendResponse.sendError({})
    }
}
