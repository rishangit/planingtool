const Enums = require('./project/enum');

class ResponseBase {
  constructor(res) {
    this.resObj = {};
    this.res = res;
    this.res.header("Access-Control-Allow-Origin", "*");
    this.res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  }
  sendError() { }
  sendSuccessObj() { }
  sendSuccessList() { }
  sendSuccessEmpty() { }
  send() {
    this.res.send(this.resObj);
  }
}

class SendResponse extends ResponseBase {

  sendError(err) {
    this.resObj.typ = Enums.ResponseType.ERROR;
    this.resObj.obj = err;
    this.send();
  }

  sendErrorMsg(ErrorType, msg) {
    this.resObj.typ = Enums.ResponseType.ERROR;
    this.resObj.errTyp = ErrorType
    this.resObj.msg = msg
    this.send();
  }

  sendSuccessObj(obj) {
    this.resObj.typ = Enums.ResponseType.SUCCESS_OBJ;
    this.resObj.obj = obj;
    this.send();
  }

  sendSuccessList(lst, prm, count) {
    this.resObj.typ = Enums.ResponseType.SUCCESS_LIST;
    this.resObj.lst = lst;
    if (prm) {
      this.resObj.prm = prm;
      this.resObj.str = prm.cursor + prm.limit;
    }
    if (count) {
      this.resObj.tot = count;
    }
    this.send();
  }

  sendSuccessEmpty() {
    this.resObj.typ = Enums.ResponseType.SUCCESS_EMPTY;
    this.send();
  }

  sendSessionExpire() {
    this.resObj.typ = Enums.ResponseType.SESSION_EXPIRE;
    this.send();
  }
}

module.exports = SendResponse