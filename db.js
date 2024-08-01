const { Pool } = require("pg");

const pool = new Pool({
  user: "account",
  host: "localhost",
  database: "todos",
  password: "123456",
  port: "5432",
});

module.exports = pool;
