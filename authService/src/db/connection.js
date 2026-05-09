import mysql from "mysql2/promise";
import "dotenv/config";
const pool = mysql.createPool({
  host: "localhost",
  user: process.env.DB_USERNAME || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
});

export default pool;
