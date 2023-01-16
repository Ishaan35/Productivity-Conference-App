var mysql = require("mysql");
const util = require("util");

//i guess i can switch the database config info for now to use a different database so I dont have to pay for rds until I am done the app
const pool = mysql.createPool({
  host: process.env.TEST_DB_HOST,
  user: process.env.TEST_DB_USERNAME,
  //password: process.env.TEST_DB_PASSWORD,
  database: process.env.TEST_DB_ID,
  timeout: 60 * 60 * 1000,
  port: process.env.TEST_DB_PORT,
});

module.exports = { pool };
