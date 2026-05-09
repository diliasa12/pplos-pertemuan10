import express from "express";
import {
  createMovie,
  getAllmovies,
  getMovieById,
  updateMovie,
  deleteMovie,
} from "../controllers/movie.controller.js";
import authenticate from "../middlewares/authMiddleware.js";
import roleCheck from "../middlewares/roleCheck.js";

const router = express.Router();

router.get("/", authenticate, getAllmovies);
router.get("/:id", authenticate, getMovieById);
router.post("/", authenticate, roleCheck("admin"), createMovie);
router.put("/:id", authenticate, roleCheck("admin"), updateMovie);
router.delete("/:id", authenticate, roleCheck("admin"), deleteMovie);

export default router;
