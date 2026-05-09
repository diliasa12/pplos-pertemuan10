import pool from "../db/connection.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";

export const createVideo = catchAsync(async (req, res, next) => {
  const { title, type, video_url, thumbnail_url } = req.body;

  if (!title || !type || !video_url) {
    throw new AppError("Title, type, and video_url are required.", 400);
  }

  if (!["basic", "premium"].includes(type)) {
    throw new AppError("Type must be basic or premium.", 400);
  }

  await pool.execute(
    "INSERT INTO videos (title, type, video_url, thumbnail_url) VALUES (?, ?, ?, ?)",
    [title, type, video_url, thumbnail_url ?? null],
  );

  const [rows] = await pool.execute(
    "SELECT * FROM videos WHERE video_url = ? ORDER BY created_at DESC LIMIT 1",
    [video_url],
  );

  return res.status(201).json({
    success: true,
    message: "successfully create video",
    data: rows[0],
  });
});

// GET /videos
export const getAllVideos = catchAsync(async (req, res, next) => {
  let rows;

  if (req.user.role === "admin") {
    [rows] = await pool.execute(
      "SELECT * FROM videos ORDER BY created_at DESC",
    );
  } else {
    const [sub] = await pool.execute(
      "SELECT status FROM subscriptions WHERE user_id = ?",
      [req.user.id],
    );
    const status = sub[0]?.status ?? "basic";

    if (status === "premium") {
      [rows] = await pool.execute(
        "SELECT * FROM videos ORDER BY created_at DESC",
      );
    } else {
      [rows] = await pool.execute(
        "SELECT * FROM videos WHERE type = ? ORDER BY created_at DESC",
        ["basic"],
      );
    }
  }

  return res.status(200).json({
    success: true,
    message: "Videos fetched successfully.",
    data: rows,
  });
});

// GET /videos/:id
export const getVideoById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const [rows] = await pool.execute("SELECT * FROM videos WHERE id = ?", [id]);

  if (rows.length === 0) {
    throw new AppError("Video not found", 404);
  }
  const video = rows[0];

  // Cek akses premium
  if (video.type === "premium" && req.user.role !== "admin") {
    const [sub] = await pool.execute(
      "SELECT status FROM subscriptions WHERE user_id = ?",
      [req.user.id],
    );
    if (sub[0]?.status !== "premium") {
      throw new AppError("Upgrade to premium to watch this video", 403);
    }
  }

  return res.status(200).json({
    success: true,
    message: "Video fetched successfully.",
    data: video,
  });
});

// PUT /videos/:id
export const updateVideo = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, type, video_url, thumbnail_url } = req.body;

  if (!title || !type || !video_url) {
    throw new AppError("Title, type, and video_url are required.", 400);
  }

  if (!["basic", "premium"].includes(type)) {
    throw new AppError("TYpe must be basic or premium");
  }

  const [existing] = await pool.execute("SELECT id FROM videos WHERE id = ?", [
    id,
  ]);

  if (existing.length === 0) {
    throw new AppError("Video not found", 404);
  }

  await pool.execute(
    "UPDATE videos SET title = ?, type = ?, video_url = ?, thumbnail_url = ? WHERE id = ?",
    [title, type, video_url, thumbnail_url ?? null, id],
  );

  const [rows] = await pool.execute("SELECT * FROM videos WHERE id = ?", [id]);

  return res.status(200).json({
    success: true,
    message: "Video updated successfully.",
    data: rows[0],
  });
});

// DELETE /videos/:id
export const deleteVideo = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const [existing] = await pool.execute("SELECT id FROM videos WHERE id = ?", [
    id,
  ]);

  if (existing.length === 0) {
    throw new AppError("Video not found", 404);
  }

  await pool.execute("DELETE FROM videos WHERE id = ?", [id]);

  return res.status(200).json({
    success: true,
    message: "Video deleted successfully.",
  });
});
