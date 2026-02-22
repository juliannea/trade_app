import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { supabase } from './supabase'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


// testing supabase connection: selects all columns from the User table and returns as json response
app.get('/users', async (req, res) => {
  const { data, error } = await supabase
    .from('User')
    .select('*')

  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})
