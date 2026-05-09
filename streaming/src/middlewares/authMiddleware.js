const authenticate = (req, res, next) => {
  const id = req.headers["x-user-id"];
  const role = req.headers["x-user-role"];
  const email = req.headers["x-user-email"];

  if (!id || !role) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  // Set req.user seperti biasa
  req.user = { id, role, email };
  next();
};
export default authenticate;
