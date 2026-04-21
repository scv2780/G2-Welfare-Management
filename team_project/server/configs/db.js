const mariadb = require("mariadb");
const dotenv = require("dotenv");
dotenv.config();

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  connectionLimit: 5,
  // Object의 필드정보(Entiry)를 Query문에 있는 '?'에 자동변환 설정
  permitSetMultiParamEntries: true,
  // DML(insert, update, delete)를 실행할 경우 // 반환되는 Object의 insertId 속성을 Number 타입으로 자동 변환
  insertIdAsNumber: true,
  // MariaDB의 데이터 타입 중 bigInt 타입을 Javascript의 Number 타입으로 자동 변환
  // 해당 타입을 Javascript에선 자동으로 변환하지 못함
  bigIntAsNumber: true,
  // logger 등록
  logger: {
    // 실제 실행되는 SQL문이 console.log로 출력되도록 설정
    query: console.log,
    // error 발생 시 처리함수
    error: console.log,
  },
  dateStrings: true,
  charset: "UTF8MB4",
  collation: "utf8mb4_general_ci",
});

// 연결 테스트
pool
  .getConnection()
  .then((conn) => {
    console.log("[ db.js  성공 ]");
    conn.release();
  })
  .catch((err) => {
    console.error("[ db.js  실패 ]", err.message);
  });

module.exports = pool;
