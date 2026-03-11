import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabase } from './supabase'
import userRoutes from './routes/users';
import collectionRoutes from './routes/collections';
import postRoutes from './routes/posts';
import matchRoutes from './routes/matches';
import swipeRoutes from './routes/swipes';
import resetRouter from './routes/resetRouter';

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

//Match routes
app.use('/api/matches', matchRoutes);

//Swipe routes
app.use('/api/swipes', swipeRoutes);


//used to reset the database for testing and demo puproses, should be removed later
app.use('/dev/reset', resetRouter);


app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});





