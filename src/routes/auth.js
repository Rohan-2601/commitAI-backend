import express from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

/* -----------------------------
   STEP 1: Redirect to GitHub 
-------------------------------- */
router.get("/github", (req, res) => {
  const callback = req.query.callback; // CLI callback → http://localhost:9900/callback

  if (!callback) {
    return res.status(400).send("Missing callback URL");
  }

  // Use GitHub OAuth "state" to pass callback safely
  const githubURL =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${process.env.GITHUB_CLIENT_ID}` +
    `&redirect_uri=${process.env.GITHUB_REDIRECT_URI}` +
    `&scope=read:user` +
    `&state=${encodeURIComponent(callback)}`;

  return res.redirect(githubURL);
});

/* ----------------------------------------
   STEP 2: GitHub redirects back here
----------------------------------------- */
router.get("/github/callback", async (req, res) => {
  const { code, state } = req.query;

  // "state" contains the original CLI callback URL
  const callback = decodeURIComponent(state);

  if (!callback) {
    return res.status(400).send("Callback missing from state");
  }

  try {
    // 1. Exchange GitHub code for access token
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenRes.data.access_token;

    // 2. Get user info from GitHub
    const profileRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const gh = profileRes.data;

    // 3. Create or find user in DB
    let user = await User.findOne({ githubId: gh.id });
    if (!user) {
      user = await User.create({
        githubId: gh.id,
        username: gh.login,
        avatar: gh.avatar_url
      });
    }

    // 4. Generate JWT
    const jwtToken = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5. Finally redirect back to CLI callback
    return res.redirect(`${callback}?token=${jwtToken}`);

  } catch (err) {
    console.error("GitHub OAuth Error:", err);
    return res.status(500).send("GitHub login failed");
  }
});

export default router;
