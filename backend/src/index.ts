import express from "express";
import mongoose from "mongoose";
import fileRouter from "./routes/fileRoute"
import path from "path";
import cors from "cors"
import dotenv from "dotenv"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/cyberx';

app.use(cors({
  origin: [process.env.CLIENT_URL as string, process.env.BASE_URL as string],
  methods: ["GET","PUT", "POST", "DELETE"]
}))
app.use(express.json());

// Serve static files from the uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get("/", (_req, res) => {
  res.send("Serve is working...");
});

app.use("/files", fileRouter)

// MongoDB connection
mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  } as mongoose.ConnectOptions).then(() => {
    console.log('Connected to MongoDB');
  }).catch(err => {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
