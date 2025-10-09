import express from "express";
import "dotenv/config";
import cors from "cors";

const app = express();
const { CORS_ORIGIN, PORT } = process.env;

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());



app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT} :)`);
});
