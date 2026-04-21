// team_project/server/services/managerService.js

const managerMapper = require("../mappers/managerMapper");

async function getSimpleManagerList({ orgCode, loginId }) {
  return await managerMapper.simpleManagerList({ orgCode, loginId });
}

module.exports = {
  getSimpleManagerList,
};
