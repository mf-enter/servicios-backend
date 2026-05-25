import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();
const corsOptions = {
	origin: true,
	credentials: true,
	optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ status: true, message: "API OK" }));
app.use("/api", routes);

app.use(errorHandler);

export default app;