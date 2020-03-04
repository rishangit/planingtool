const express = require('express');
const SendResponse = require('../common/response');
const router = express.Router();
const debuge = true;
var multer = require('multer');
var upload = multer({ dest: 'upload/' });
var type = upload.single('streamfile');


router.post('*', type, (req, res) => {
    if (req.session.user || debuge) {
        routes = req.url.split('_');
        path = `../controller/${routes[1]}_controller`;
        var Controller = require(path);
        func = routes[0].replace('/', '');
        Controller[func](req, res);
    }
    else {
        var sendResponse = new SendResponse(res);
        sendResponse.sendSessionExpire()
    }
});

module.exports = router;