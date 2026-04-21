const express = require("express");
const router = express.Router();
const { testUsersList } = require("../services/testUserService");

router.get("/", async (req, res) => {
  try {
    const serviceTest = await testUsersList();
    console.log(serviceTest);
    console.log("[ testRoute.js || routeServiceTest 성공]");
    res.status(200).json({
      status: "success",
      serviceTest,
    });
  } catch (err) {
    console.error("[ testRoute.js || routeServiceTest 실패]", err.message);
    res.status(500).json({
      status: "error",
      message: "에러 발생",
    });
  }
});

module.exports = router;
