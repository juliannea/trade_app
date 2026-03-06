import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabase } from './supabase'
import userRoutes from './routes/users';
import collectionRoutes from './routes/collections';
import postRoutes from './routes/posts';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// User routes
app.use('/api/users', userRoutes);

//Collection routes
app.use('/api/collections', collectionRoutes);

//Post routes
app.use('/api/posts', postRoutes);


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});





