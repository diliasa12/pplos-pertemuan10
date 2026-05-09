import pool from "../db/connection.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";

export const createMovie = catchAsync(async (req, res, next) => {
  const { title, type, Movie_url, thumbnail_url } = req.body;

  if (!title || !type || !Movie_url) {
    throw new AppError("Title, type, and Movie_url are required.", 400);
  }

  if (!["basic", "premium"].includes(type)) {
    throw new AppError("Type must be basic or premium.", 400);
  }

  await pool.execute(
    "INSERT INTO movies (title, type, Movie_url, thumbnail_url) VALUES (?, ?, ?, ?)",
    [title, type, Movie_url, thumbnail_url ?? null],
  );

  const [rows] = await pool.execute(
    "SELECT * FROM movies WHERE Movie_url = ? ORDER BY created_at DESC LIMIT 1",
    [Movie_url],
  );

  return res.status(201).json({
    success: true,
    message: "successfully create Movie",
    data: rows[0],
  });
});

// GET /movies
export const getAllmovies = catchAsync(async (req, res, next) => {
  let rows;

  if (req.user.role === "admin") {
    [rows] = await pool.execute(
      "SELECT * FROM movies ORDER BY created_at DESC",
    );
  } else {
    const [sub] = await pool.execute(
      "SELECT status FROM subscriptions WHERE user_id = ?",
      [req.user.id],
    );
    const status = sub[0]?.status ?? "basic";

    if (status === "premium") {
      [rows] = await pool.execute(
        "SELECT * FROM movies ORDER BY created_at DESC",
      );
    } else {
      [rows] = await pool.execute(
        "SELECT * FROM movies WHERE type = ? ORDER BY created_at DESC",
        ["basic"],
      );
    }
  }

  return res.status(200).json({
    success: true,
    message: "movies fetched successfully.",
    data: rows,
  });
});

// GET /movies/:id
export const getMovieById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const [rows] = await pool.execute("SELECT * FROM movies WHERE id = ?", [id]);

  if (rows.length === 0) {
    throw new AppError("Movie not found", 404);
  }
  const Movie = rows[0];

  // Cek akses premium
  if (Movie.type === "premium" && req.user.role !== "admin") {
    const [sub] = await pool.execute(
      "SELECT status FROM subscriptions WHERE user_id = ?",
      [req.user.id],
    );
    if (sub[0]?.status !== "premium") {
      throw new AppError("Upgrade to premium to watch this Movie", 403);
    }
  }

  return res.status(200).json({
    success: true,
    message: "Movie fetched successfully.",
    data: Movie,
  });
});

// PUT /movies/:id
export const updateMovie = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { title, type, Movie_url, thumbnail_url } = req.body;

  if (!title || !type || !Movie_url) {
    throw new AppError("Title, type, and Movie_url are required.", 400);
  }

  if (!["basic", "premium"].includes(type)) {
    throw new AppError("TYpe must be basic or premium");
  }

  const [existing] = await pool.execute("SELECT id FROM movies WHERE id = ?", [
    id,
  ]);

  if (existing.length === 0) {
    throw new AppError("Movie not found", 404);
  }

  await pool.execute(
    "UPDATE movies SET title = ?, type = ?, Movie_url = ?, thumbnail_url = ? WHERE id = ?",
    [title, type, Movie_url, thumbnail_url ?? null, id],
  );

  const [rows] = await pool.execute("SELECT * FROM movies WHERE id = ?", [id]);

  return res.status(200).json({
    success: true,
    message: "Movie updated successfully.",
    data: rows[0],
  });
});

// DELETE /movies/:id
export const deleteMovie = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const [existing] = await pool.execute("SELECT id FROM movies WHERE id = ?", [
    id,
  ]);

  if (existing.length === 0) {
    throw new AppError("Movie not found", 404);
  }

  await pool.execute("DELETE FROM movies WHERE id = ?", [id]);

  return res.status(200).json({
    success: true,
    message: "Movie deleted successfully.",
  });
});
