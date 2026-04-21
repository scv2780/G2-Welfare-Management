// server/services/assignService.js
const assignMapper = require("../mappers/assignMapper");

module.exports = {
  assignManager(submitCode, assignee) {
    return assignMapper.assignManager(submitCode, assignee);
  },
};
