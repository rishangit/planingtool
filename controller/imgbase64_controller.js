const SendResponse = require('../common/response');
const path = require('path');
const uuidv1 = require('uuid/v1');
module.exports = {

    save: function (req, res) {
        var sendResponse = new SendResponse(res);
        var data = req.body;
        this.savebase64Image(data.base64, (imageID) => {
            sendResponse.sendSuccessObj({ '_id': imageID })
        })
    },

    remove: function (req, res) {
        var sendResponse = new SendResponse(res);
        var data = req.body;
        this.removeFile(data.fileID, (imageID) => {
            sendResponse.sendSuccessObj({ '_id': imageID })
        })

    },

    savebase64Image(base64, callBack) {
        var base64String = base64,
            base64Data = base64String.replace(/^data:image\/png;base64,/, ""),
            binaryData = new Buffer.from(base64Data, 'base64').toString('binary');
        var imageID = uuidv1() + '.png';

        var savelocation = path.join(__dirname, "../../img/", imageID)
        require("fs").writeFile(savelocation, binaryData, "binary", function (err) {
            callBack(imageID)
        });
    },

    removeFile(fileID, callBack) {
        var imageID = fileID;
        var savelocation = path.join(__dirname, "../../img/", imageID)
        var fs = require("fs");
        fs.stat(savelocation, function (err, stats) {
            if (err) {
                return console.error(err);
            }
            fs.unlink(savelocation, function (err) {
                if (err) return console.log(err);
                callBack(fileID)

            });
        });
    }

}
