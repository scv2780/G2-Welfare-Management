function makeParams(dataList, data) {
  return dataList.map((key) => data[key]);
}

module.exports = { makeParams };
