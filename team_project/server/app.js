// app.js
const isProd = process.argv.includes("prod");

// 운영 서버 주소 (Vue가 빌드되어 배포된 주소)
const SERVER_URL = isProd ? "http://49.50.139.49/api" : "http://localhost:3000";
global.SERVER_URL = SERVER_URL;
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const dotenv = require("dotenv");
const testRouter = require("./routes/testRoute");
const surveyRoute = require("./routes/surveyRoute");
const counselRoute = require("./routes/counselRoute");
const supportPlanRoute = require("./routes/supportPlanRoute");
const supportResultRoute = require("./routes/supportResultRoute");
const orgRouter = require("./routes/orgRoute");
const eventRouter = require("./routes/eventRoute");
const sponsorRouter = require("./routes/sponsorRoute");
const approvalRouter = require("./routes/approvalRoute.js");
const path = require("path");
const signRouter = require("./routes/signUser");
const userRouter = require("./routes/userRoute");
const pendingRouter = require("./routes/pendingRoute");
const attachmentRouter = require("./routes/attachmentRoute");
const assign = require("./routes/assignRoute");
const historyRoute = require("./routes/historyRoute");
const managerRoute = require("./routes/managerRoute");
const authorityTransferRoute = require("./routes/authorityTransferRoute");
const applicationRoute = require("./routes/applicationRoute");
const kakaoPayRouter = require("./routes/kakaoPayRouter.js");
dotenv.config();

const app = express();
app.use(express.json());
app.use(morgan("dev"));
const corsOptions = {
  origin: "https://t1.kakaocdn.net", // 프론트엔드 서버 주소
};

app.use(cors(corsOptions));
// 라우터
// app.use('/api', testRouter);

// 운영모드에서 추가적인 경로설정
let apiPath = "";
if (process.argv.indexOf("prod") > -1) {
  apiPath = "/api";
}

app.use(`${apiPath}/test`, testRouter);
app.use(`${apiPath}/sponsor`, sponsorRouter);
app.use(`${apiPath}/survey`, surveyRoute);
app.use(`${apiPath}/counsel`, counselRoute);
app.use(`${apiPath}/plans`, supportPlanRoute);
app.use(`${apiPath}/result`, supportResultRoute);
app.use(`${apiPath}/organization`, orgRouter);
app.use(`${apiPath}/approvals`, approvalRouter);
app.use(`${apiPath}/event`, eventRouter);
app.use(`/uploads`, express.static(path.join(__dirname, "uploads")));
app.use(`${apiPath}/user`, signRouter);
app.use(`${apiPath}/userinfo`, userRouter);
app.use(`${apiPath}/pending`, pendingRouter);
app.use(`${apiPath}/attachment`, attachmentRouter);
app.use(`${apiPath}/histories`, historyRoute);
app.use(`${apiPath}/managers`, managerRoute);
app.use(`${apiPath}/authority-transfer`, authorityTransferRoute);
app.use(`${apiPath}/applications`, applicationRoute);
app.use(`${apiPath}/pay/kakao`, kakaoPayRouter);

// 정적인 파일 등록 ex) img, css, js 단순 파일
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// vue.js build 파일 제공
app.get(`${apiPath}/`, function (req, res, next) {
  res.sendFile(path.join(__dirname, "./public", "index.html"));
});
app.get("/kakaopayapprove", (req, res) => {
  res.sendFile(path.join(__dirname, "./public", "index.html"));
});
// const port = process.env.PORT;
const port = process.env.PORT;
app.listen(port, () => {
  console.log("[ server app.js 가동 완료 | http://localhost:3000/ ]");
});

// app.use((req, res) => {
//   res.status(404).sendFile(path.join(__dirname, "./public", "index.html"));
// });

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "./public", "index.html"));
});
