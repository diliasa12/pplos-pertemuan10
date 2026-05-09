import pool from "../db/connection.js";
import bcrypt from "bcryptjs";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";
import generateAccessToken from "../utils/generateToken.js";
export const register = catchAsync(async (req, res, next) => {
  const { email, password, nama, role } = req.body;
  if (!nama || !email || !password) {
    throw new AppError("Nama, email, password are required", 400);
  }

  const userRole = role || "user";

  const [emailIsExist] = await pool.query(
    "SELECT id from `users` WHERE `email` = ?",
    [email],
  );
  if (emailIsExist.length > 0) {
    throw new AppError("email has been registered", 400);
  }

  const hash = await bcrypt.hash(password, 10);

  await pool.execute(
    "INSERT INTO users (nama,email,password,role) VALUES (?,?,?,?)",
    [nama, email, hash, userRole],
  );

  const [rows] = await pool.execute(
    "SELECT id from `users` WHERE `email` = ?",
    [email],
  );

  const id = rows[0].id;
  const token = generateAccessToken({ id, email, role });
  return res
    .status(201)
    .json({ success: true, message: "registration succcess", token });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new AppError("Nama, email, password are required", 400);
  }
  const [user] = await pool.execute("SELECT * from users WHERE email = ?", [
    email,
  ]);
  console.log(user);
  if (user.length === 0) {
    throw new AppError("Email not found", 404);
  }
  const match = await bcrypt.compare(password, user[0].password);
  if (!match) {
    throw new AppError("Wrong password", 400);
  }

  const id = user[0].id;
  const role = user[0].role;
  console.log(id);
  const token = generateAccessToken({ id, email, role });
  return res
    .status(200)
    .json({ success: true, message: "login success", token });
});
