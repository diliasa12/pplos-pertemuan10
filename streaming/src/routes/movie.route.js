import express from "express";
import {
  createVideo,
  getAllVideos,
  getVideoById,
  updateVideo,
  deleteVideo,
} from "../controllers/movie.controller.js";
import authenticate from "../middlewares/authMiddleware.js";
import roleCheck from "../middlewares/roleCheck.js";

const router = express.Router();

router.get("/", authenticate, getAllVideos);
router.get("/:id", authenticate, getVideoById);
router.post("/", authenticate, roleCheck("admin"), createVideo);
router.put("/:id", authenticate, roleCheck("admin"), updateVideo);
router.delete("/:id", authenticate, roleCheck("admin"), deleteVideo);

export default router;
