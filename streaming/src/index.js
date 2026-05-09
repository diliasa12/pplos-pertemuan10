import e from "express";
import errorHandler from "./middlewares/errorHandler.js";
import movieRoutes from "./routes/movie.route.js";
const app = e();
const PORT = 4278;
app.use(e.json());
app.use(movieRoutes);
app.use(errorHandler);
app.listen(PORT, () =>
  console.log(`Streaming service running on http://localhost:${PORT}`),
);
