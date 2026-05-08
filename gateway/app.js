import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import authMiddleware from "./middlewares/authMiddleware.js";
import roleCheck from "./middlewares/roleCheck.js";
const app = express();
const PORT = 4078;

app.use(
  "/service1",
  createProxyMiddleware({
    target: "http://localhost:4178",
    changeOrigin: true,
    pathRewrite: { "/service1": "" },
  }),
);

app.use(
  "/service2",
  roleCheck("admin"),
  createProxyMiddleware({
    target: "http://localhost:4278",
    changeOrigin: true,
    pathRewrite: { "/service2": "" },
  }),
);
app.use(
  "/service3",
  roleCheck("user"),
  createProxyMiddleware({
    target: "http://localhost:4378",
    changeOrigin: true,
    pathRewrite: { "/service3": "" },
  }),
);
app.use((err, req, res, next) => {
  console.error(`[Gateway Error]`, err.message);

  if (err.code === "ECONNREFUSED") {
    return res.status(503).json({
      success: false,
      message: "Service unavailable",
    });
  }

  res.status(500).json({
    success: false,
    message: "Gateway error",
  });
});

app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`));
