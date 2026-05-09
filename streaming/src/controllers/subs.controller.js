import pool from "../db/connection.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";
import { publish } from "../rabbitmq.js";

// GET /subscriptions/my
export const getMySubscription = catchAsync(async (req, res, next) => {
  const [rows] = await pool.execute(
    "SELECT * FROM subscriptions WHERE user_id = ?",
    [req.user.id],
  );

  return res.status(200).json({
    success: true,
    message: "Subscription fetched successfully.",
    data: rows[0] ?? null,
  });
});

// GET /subscriptions — admin only
export const getAllSubscriptions = catchAsync(async (req, res, next) => {
  const [rows] = await pool.execute(
    `SELECT s.*, u.nama, u.email 
     FROM subscriptions s 
     JOIN users u ON u.id = s.user_id 
     ORDER BY u.nama`,
  );

  return res.status(200).json({
    success: true,
    message: "Subscriptions fetched successfully.",
    data: rows,
  });
});

// PATCH /subscriptions/upgrade
export const upgradeSubscription = catchAsync(async (req, res, next) => {
  const [existing] = await pool.execute(
    "SELECT * FROM subscriptions WHERE user_id = ?",
    [req.user.id],
  );

  if (existing.length === 0) {
    throw new AppError("Subscription not found", 404);
  }

  if (existing[0].status === "premium") {
    throw new AppError("You are already on premium.", 400);
  }

  await pool.execute("UPDATE subscriptions SET status = ? WHERE user_id = ?", [
    "premium",
    req.user.id,
  ]);

  const [rows] = await pool.execute(
    "SELECT * FROM subscriptions WHERE user_id = ?",
    [req.user.id],
  );

  publish({
    event: "subscription.upgraded",
    userId: req.user.id,
    status: "premium",
  });

  return res.status(200).json({
    success: true,
    message: "Subscription upgraded to premium successfully.",
    data: rows[0],
  });
});

// PATCH /subscriptions/downgrade
export const downgradeSubscription = catchAsync(async (req, res, next) => {
  const [existing] = await pool.execute(
    "SELECT * FROM subscriptions WHERE user_id = ?",
    [req.user.id],
  );

  if (existing.length === 0) {
    throw new AppError("Subscription not found", 404);
  }

  if (existing[0].status === "basic") {
    throw new AppError("You are already on basic", 400);
  }

  await pool.execute("UPDATE subscriptions SET status = ? WHERE user_id = ?", [
    "basic",
    req.user.id,
  ]);

  const [rows] = await pool.execute(
    "SELECT * FROM subscriptions WHERE user_id = ?",
    [req.user.id],
  );

  publish({
    event: "subscription.downgraded",
    userId: req.user.id,
    status: "basic",
  });

  return res.status(200).json({
    success: true,
    message: "Subscription downgraded to basic successfully.",
    data: rows[0],
  });
});

// PATCH /subscriptions/:userId — admin ubah status user manapun
export const updateSubscriptionByAdmin = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!["basic", "premium"].includes(status)) {
    throw new AppError("Status must be basic or premium", 400);
  }

  const [existing] = await pool.execute(
    "SELECT * FROM subscriptions WHERE user_id = ?",
    [userId],
  );

  if (existing.length === 0) {
    throw new AppError("Subscription not found", 404);
  }

  await pool.execute("UPDATE subscriptions SET status = ? WHERE user_id = ?", [
    status,
    userId,
  ]);

  const [rows] = await pool.execute(
    "SELECT * FROM subscriptions WHERE user_id = ?",
    [userId],
  );

  publish({ event: "subscription.changed", userId, status });

  return res.status(200).json({
    success: true,
    message: `Subscription updated to ${status} successfully.`,
    data: rows[0],
  });
});
