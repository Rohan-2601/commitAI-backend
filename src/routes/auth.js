import express from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// Step 1: Redirect to GitHub login
// Step 1: Redirect to GitHub login
router.get("/github", (req, res) => {
  const callback = req.query.callback;

  if (!callback) {
    return res.status(400).send("Missing callback URL");
  }

  const redirectURI = `${process.env.GITHUB_REDIRECT_URI}?callback=${encodeURIComponent(callback)}`;

  const githubURL = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${redirectURI}&scope=read:user`;

  res.redirect(githubURL);
});


router.get("/github/callback", async (req, res) => {
  const { code, callback } = req.query;

  if (!callback) {
    return res.status(400).send("Callback missing in redirect");
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await axios.post(
      `https://github.com/login/oauth/access_token`,
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code
      },
      { headers: { Accept: "application/json" } }
    );

    const accessToken = tokenRes.data.access_token;

    // 2. Fetch profile
    const profileRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const gh = profileRes.data;

    // 3. Upsert user
    let user = await User.findOne({ githubId: gh.id });

    if (!user) {
      user = await User.create({
        githubId: gh.id,
        username: gh.login,
        avatar: gh.avatar_url
      });
    }

    // 4. Issue JWT
    const jwtToken = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5. Redirect to CLI local server
    const redirectURL = `${callback}?token=${jwtToken}`;
    return res.redirect(redirectURL);

  } catch (err) {
    console.error(err);
    res.status(500).send("GitHub login failed");
  }
});

export default router;