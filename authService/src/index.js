import express from "express";
import errorHandler from "./middlewares/errorHandler.js";
import { connect } from "./rabbitmq.js";
import authRoute from "./routes/authRoute.js";
const PORT = 4178;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
  console.log(`[Auth Service] ${req.method} ${req.url}`);
  next();
});
app.use("/api/auth", authRoute);
app.use(errorHandler);
await connect();
app.listen(PORT, () =>
  console.log(`auth serivce running on http://localhost:${PORT}`),
);
