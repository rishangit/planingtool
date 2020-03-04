const SendResponse = require('../common/response');
var consts = require('../common/consts');
const filename = consts.dbpath + 'files/'


module.exports = {
    upload(req, res) {
        var tmp_path = req.file.id;
        var sendResponse = new SendResponse(res);
        var aa = { img: req.file.filename }
        sendResponse.sendSuccessObj(aa)
    }
}