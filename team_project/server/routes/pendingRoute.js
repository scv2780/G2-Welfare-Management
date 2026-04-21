const express = require('express');
const router = express.Router();
const pendingService = require('../services/pendingService');

router.post('/list', async (req, res) => {
  try {
    const result = await pendingService.getPendingListService(req.body);
    res.json(result);
  } catch (err) {
    console.error('[ pendingRoute.js -> list 라우터 오류 ]', err);
    res
      .status(500)
      .json({ ok: false, message: '[ pendingRoute.js -> list 라우터 오류 ]' });
  }
});

router.put('/', async (req, res) => {
  try {
    const result = await pendingService.updateStatusService(req.body.data);
    res.json(result);
  } catch (err) {
    console.error('[ pendingRoute.js -> / 라우터 오류 ]', err);
    res
      .status(500)
      .json({ ok: false, message: '[ pendingRoute.js -> / 라우터 오류 ]' });
  }
});

router.post('/search', async (req, res) => {
  try {
    const result = await pendingService.searchManagersService(req.body);
    res.json(result);
  } catch (err) {
    console.error('[ pendingRoute.js -> search 라우터 오류 ]', err);
    res.status(500).json({
      ok: false,
      message: '[ pendingRoute.js -> search 라우터 오류 ]',
    });
  }
});

module.exports = router;
