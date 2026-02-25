import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabase } from './supabase'
import userRoutes from './routes/users';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});


app.use('/api/users', userRoutes);


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});





