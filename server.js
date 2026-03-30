// server.js
// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/financialApp")
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// User model
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
    financeData: Object
});



const User = mongoose.model("User", userSchema);

// --- AUTH ROUTES ---
app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).send("User exists");

    const user = new User({ username, password, financeData: {} });
    await user.save();
    res.status(201).send("Registered");
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (!user) return res.status(401).send("Invalid login");

    res.status(200).send("Logged in");
});

// --- SAVE / LOAD FINANCE DATA ---
app.post("/save", async (req, res) => {
    const { username, data } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).send("User not found");

    user.financeData = data;
    await user.save();
    res.status(200).send("Saved");
});

app.get("/load/:username", async (req, res) => {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).send("User not found");

    res.json(user.financeData);
});

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
