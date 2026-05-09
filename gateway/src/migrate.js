import mysql from "mysql2/promise"; // ← pakai /promise langsung
import "dotenv/config";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto"; // ← import eksplisit

async function migrate() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  await conn.execute(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``,
  );
  console.log(`Database ${process.env.DB_NAME}`);
  await conn.end();
  const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, // ← pisahkan dari username
    port: process.env.DB_PORT,
    waitForConnections: true,
  });

  console.log("Menjalankan migrasi...");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id         CHAR(36)             NOT NULL DEFAULT (UUID()),
      nama       VARCHAR(100)         NOT NULL,
      email      VARCHAR(150)         NOT NULL,
      password   VARCHAR(255)         NOT NULL,
      role       ENUM('admin','user') NOT NULL DEFAULT 'user',
      created_at TIMESTAMP            NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_users_email (email)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("Tabel users");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS movies (
      id            CHAR(36)                NOT NULL DEFAULT (UUID()),
      title         VARCHAR(200)            NOT NULL,
      type          ENUM('basic','premium') NOT NULL,
      movie_url     TEXT                    NOT NULL,
      thumbnail_url TEXT,
      public_id     VARCHAR(255),
      created_at    TIMESTAMP               NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("Tabel movies");

  await db.execute(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id      CHAR(36)                NOT NULL DEFAULT (UUID()),
      user_id CHAR(36)                NOT NULL,
      status  ENUM('basic','premium') NOT NULL DEFAULT 'basic',
      PRIMARY KEY (id),
      UNIQUE KEY uq_subscriptions_user (user_id),
      CONSTRAINT fk_sub_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
  console.log("Tabel subscriptions");

  const [existing] = await db.execute("SELECT id FROM users WHERE email = ?", [
    "admin@stream.id",
  ]);

  if (existing.length === 0) {
    const adminId = randomUUID(); // ← pakai yang sudah diimport
    const subId = randomUUID();
    const hash = await bcrypt.hash("Admin@123", 10);

    await db.execute(
      "INSERT INTO users (id, nama, email, password, role) VALUES (?, ?, ?, ?, ?)",
      [adminId, "Admin", "admin@stream.id", hash, "admin"],
    );
    await db.execute(
      "INSERT INTO subscriptions (id, user_id, status) VALUES (?, ?, ?)",
      [subId, adminId, "premium"],
    );
    console.log("Seed admin (admin@stream.id / Admin@123)");
  } else {
    console.log("Admin sudah ada, skip seed");
  }

  await db.end();
  console.log("Migrasi selesai");
}

migrate().catch((err) => {
  console.error("Migrasi gagal:", err.message);
  process.exit(1);
});
