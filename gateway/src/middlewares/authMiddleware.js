import jwt from "jsonwebtoken";
import "dotenv/config";
const authMiddleware = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer "))
    return res
      .status(401)
      .json({ success: false, message: "Token not found." });
  try {
    const payload = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);

    // Inject data user ke header sebelum diteruskan ke service
    req.headers["x-user-id"] = payload.id;
    req.headers["x-user-role"] = payload.role;
    req.headers["x-user-email"] = payload.email;

    next();
  } catch {
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};
export default authMiddleware;
