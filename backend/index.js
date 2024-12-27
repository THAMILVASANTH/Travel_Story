require("dotenv").config();
const config = require("./config.json");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { authenticateToken } = require("./utilities")

const User = require("./models/user.model");
const TravelStory = require("./models/travelStory.model")

mongoose.connect(config.connectionString)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Failed to connect to MongoDB:", err));

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// Create Account API
app.post("/create-account", async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(400).json({ error: true, message: "All fields are required" });
    }

    const isUser = await User.findOne({ email });
    if (isUser) {
        return res.status(400).json({ error: true, message: "User already exists" });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            fullName,
            email,
            password: hashedPassword,
        });

        await user.save();

        const accessToken = jwt.sign(
            { userId: user._id },
            process.env.ACCESS_TOKEN_SECRET,
            {
                expiresIn: "72h",
            }
        );

        return res.status(201).json({
            error: false,
            user: { id: user._id, fullName: user.fullName, email: user.email },
            accessToken,
            message: "Registration Successful",
        });
    } catch (error) {
        console.error("Error creating user:", error);
        return res.status(500).json({ error: true, message: "Internal Server Error" });
    }
});

//Login API
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and Password are required" })
    }

    const user = await User.findOne({ email })
    if (!user) {
        return res.status(400).json({ message: "User not found" })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid Credentials" })
    }

    const accessToken = jwt.sign(
        { userId: user._id },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: "72hr",
        }
    )

    return res.json({
        error: false, message: "Login Successful",
        user: { fullName: user.fullName, email: user.email },
        accessToken,
    })
})

// Get User
app.get("/get-user", authenticateToken, async (req, res) => {
    const { userId } = req.user

    const isUser = await User.findOne({ _id: userId })

    if (!isUser) {
        return res.sendStatus(401)
    }

    return res.json({
        user: isUser,
        message: "",
    })
})

// Add Travel Story
app.post("/add-travel-story", authenticateToken, async (req, res) => {
    const { title, story, visitedLocation, imageUrl, visitedDate } = req.body
    const { userId } = req.user

    if (!title || !story || !visitedLocation || !imageUrl || !visitedDate) {
        return res.status(400).json({ error: true, message: "All fields are required" })
    }

    const parsedVisitedDate = new Date(parseInt(visitedDate))

    try {
        const travelStory = new TravelStory({
            title,
            story,
            visitedLocation,
            userId,
            imageUrl,
            visitedDate: parsedVisitedDate,
        })
        await travelStory.save()
        res.status(201).json({ story: travelStory, message: "Added Successfully" })
    }
    catch (error) {
        res.status(400).json({ error: true, message: error.message })
    }
})

// Get All Travel Story
app.get("/get-all-stories", authenticateToken, async (req, res) => {
    const { userId } = req.user

    try {
        const travelStories = await TravelStory.find({ userId: userId }).sort({
            isFavourite: -1
        })
        res.status(200).json({ stories: travelStories })
    } catch (error) {
        res.status(500).json({ error: true, message: error.message })
    }
})



app.listen(8000, () => {
    console.log("Server is running on port 8000");
});

module.exports = app;
