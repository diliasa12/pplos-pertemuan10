import express from "express";
import {
  getMySubscription,
  getAllSubscriptions,
  upgradeSubscription,
  downgradeSubscription,
  updateSubscriptionByAdmin,
} from "../controllers/subs.controller.js";
import authenticate from "../middlewares/authMiddleware.js";
import roleCheck from "../middlewares/roleCheck.js";

const router = express.Router();

router.get("/my", authenticate, getMySubscription);
router.get("/", authenticate, roleCheck("admin"), getAllSubscriptions);
router.patch("/upgrade", authenticate, upgradeSubscription);
router.patch("/downgrade", authenticate, downgradeSubscription);
router.patch(
  "/:userId",
  authenticate,
  roleCheck("admin"),
  updateSubscriptionByAdmin,
);

export default router;
