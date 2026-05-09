import e from "express";
import errorHandler from "./middlewares/errorHandler.js";
import movieRoute from "./routes/movie.route.js";
import subsRoute from "./routes/subs.route.js";
import { connect } from "./rabbitmq.js";
const app = e();
const PORT = 4278;
app.use(e.json());

app.use("/api/movies", movieRoute);
app.use("/api/subscriptions", subsRoute);
app.use(errorHandler);
await connect();
app.listen(PORT, () =>
  console.log(`Streaming service running on http://localhost:${PORT}`),
);
