const errorHandler = async (err, req, res, next) => {
  console.error(`${req.method} ${req.url}`, err);
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ success: false, message: "token invalid" });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      message: "token expired",
    });
  }
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }
  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};
export default errorHandler;
