const express = require('express');
const SendResponse = require('../common/response');
const router = express.Router();
const debuge = false;
router.post('*', (req, res) => {
    if (req.session.user || req.url == "/signin_auth"  || debuge) { 
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
})

module.exports = router;