import express from "express";
import errorHandler from "./middlewares/errorHandler.js";
import authRoute from "./routes/authRoute.js";
const PORT = 4178;
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(authRoute);
app.use(errorHandler);
app.listen(PORT, () =>
  console.log(`auth serivce running on http://localhost:${PORT}`),
);
