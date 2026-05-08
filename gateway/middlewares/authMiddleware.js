import jwt from "jsonwebtoken";
import "dotenv/config";
const authMiddleware = (req, res, next) => {
  const authHeader = req.header.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decode) => {
    if (err) {
      return res
        .sttus(401)
        .json({ success: false, message: "Invalid or Expired Token" });
    }
    req.user = decode;
    next();
  });
};
export default authMiddleware;
