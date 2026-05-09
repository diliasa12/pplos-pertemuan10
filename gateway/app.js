import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import authMiddleware from "./middlewares/authMiddleware.js";

const app = express();
const PORT = 4078;
console.log(process.env.JWT_SECRET);
app.use(
  "/service1",
  createProxyMiddleware({
    target: "http://localhost:4178",
    changeOrigin: true,
    pathRewrite: { "/service1": "" },
  }),
);
app.use(authMiddleware);
app.use(
  "/service2",

  createProxyMiddleware({
    target: "http://localhost:4278",
    changeOrigin: true,
    pathRewrite: { "/service2": "" },
  }),
);
app.use(
  "/service3",

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
