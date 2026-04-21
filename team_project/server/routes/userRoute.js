const express = require('express');
const router = express.Router();
const userInfoService = require('../services/userInfoService');

// 회원정보 갖고오기
router.post('/findInfo', async (req, res) => {
  const userData = { userId: req.body.userId, role: req.body.role };
  try {
    const result = await userInfoService.findInfo(userData);
    res.json(result);
  } catch (err) {
    console.error('[ userRoute.js -> findInfo 라우터 오류 ]', err);
    res.status(500).json({ ok: false, message: err });
  }
});

// 사용자, 기관, 자녀 정보 수정
router.put('/updateInfo', async (req, res) => {
  const { type, role, data } = req.body;
  try {
    const result = await userInfoService.infoUpdate(type, data);
    res.json(result);
  } catch (err) {
    console.error('[ userRoute.js -> updateInfo 라우터 오류 ]', err);
    res.status(500).json({ ok: false, message: err });
  }
});

// pw 변경
router.put('/updatePw', async (req, res) => {
  try {
    const result = await userInfoService.pwUpdate(req.body.data);
    res.json(result);
  } catch (err) {
    console.error('[ userRoute.js -> updatePw 라우터 오류 ]', err);
    res.status(500).json({ ok: false, message: err });
  }
});

// 자녀 추가
router.post('/childAdd', async (req, res) => {
  const userData = { ...req.body };
  try {
    const result = await userInfoService.childAdd(userData);
    res.json(result);
  } catch (err) {
    console.error('[ childAdd 라우터 오류 ]', err);
    res.status(500).json({ ok: false, message: err });
  }
});

// 자녀 정보 삭제
router.delete('/deleteChild', async (req, res) => {
  try {
    const result = await userInfoService.childDelete(req.body.childCode);
    res.json(result);
  } catch (err) {
    console.error('[ userRoute.js -> deleteChild 라우터 오류 ]', err);
    res.status(500).json({ ok: false, message: err });
  }
});

// 회원탈퇴
router.delete('/deleteUser', async (req, res) => {
  try {
    const result = await userInfoService.deleteUserService(req.body);
    res.json(result);
  } catch (err) {
    console.error('[ userRoute.js -> deleteChild 라우터 오류 ]', err);
    res.status(500).json({ ok: false, message: err });
  }
});

module.exports = router;
