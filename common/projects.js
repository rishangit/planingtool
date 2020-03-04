class CommonInfo {
  constructor() {
    this.dateCreated;
    this.dateEdited;
    this.createdBy;
    this.editedBy;
    this.archive;
  }
}

class Schedule extends CommonInfo {
  constructor() {
    super();
    this._id;
    this.weekNo;
    this.year;
    this.startDate;
    this.endDate;
    this.projectID;
    this.teamID;
    this.FedHours;
    this.BedHours;
    this.QAHours;
    this.comments;
  }
}

module.exports = {
  Schedule: Schedule
};
