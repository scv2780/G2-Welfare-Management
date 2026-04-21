const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const attachmentService = require("../services/attachmentService");

// ==========================
// Multer 설정
// ==========================
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, "../uploads");
      if (!fs.existsSync(uploadPath))
        fs.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const originalName = Buffer.from(file.originalname, "latin1").toString(
        "utf8"
      );
      const now = new Date();
      const dateSuffix = `${now.getFullYear()}${(
        "0" +
        (now.getMonth() + 1)
      ).slice(-2)}${("0" + now.getDate()).slice(-2)}`;
      const ext = path.extname(originalName);
      const baseName = path.basename(originalName, ext);
      cb(null, `${baseName}_${dateSuffix}${ext}`);
    },
  }),
});

// ==========================
// 첨부파일 등록
// POST /attachments
// ==========================
router.post("/", upload.array("attachments"), async (req, res) => {
  try {
    const files = req.files.map((file) => ({
      original_filename: file.originalname,
      server_filename: file.filename,
      file_path: `/uploads/${file.filename}`,
      linked_table_name: req.body.linked_table_name, // 필수
      linked_record_pk: req.body.linked_record_pk, // 필수
    }));

    const result = [];
    for (const file of files) {
      result.push(await attachmentService.createAttachment(file));
    }

    res.status(201).json({ status: "success", data: result });
  } catch (err) {
    console.error("[attachmentRoute.js || 등록 실패]", err.message);
    res.status(500).json({ status: "error", message: "첨부파일 등록 실패" });
  }
});

// ==========================
// 첨부파일 조회
// GET /attachments/:table/:recordId
// ==========================
router.get("/:table/:recordId", async (req, res) => {
  try {
    const attachments = await attachmentService.getAttachments(
      req.params.table,
      req.params.recordId
    );
    res.status(200).json({ status: "success", data: attachments });
  } catch (err) {
    console.error("[attachmentRoute.js || 조회 실패]", err.message);
    res.status(500).json({ status: "error", message: "첨부파일 조회 실패" });
  }
});

// ==========================
// 첨부파일 삭제
// DELETE /attachments/:attach_code
// ==========================
router.delete("/:attach_code", async (req, res) => {
  try {
    const result = await attachmentService.removeAttachment(
      req.params.attach_code
    );
    res.status(200).json({ status: "success", data: result });
  } catch (err) {
    console.error("[attachmentRoute.js || 삭제 실패]", err.message);
    res.status(500).json({ status: "error", message: "첨부파일 삭제 실패" });
  }
});

module.exports = router;
