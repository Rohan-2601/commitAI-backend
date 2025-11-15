import express from "express";
import axios from "axios";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

router.get("/github", (req, res) => {
  const callback = req.query.callback;
  if (!callback) return res.status(400).send("Missing callback URL");

  const githubURL =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${process.env.GITHUB_CLIENT_ID}` +
    `&redirect_uri=${process.env.GITHUB_REDIRECT_URI}` +
    `&scope=read:user` +
    `&state=${encodeURIComponent(callback)}`;

  res.redirect(githubURL);
});

router.get("/github/callback", async (req, res) => {
  const { code, state } = req.query;
  const callback = state;

  if (!callback) return res.status(400).send("Callback missing");

  try {
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

    const profileRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const gh = profileRes.data;

    let user = await User.findOne({ githubId: gh.id });
    if (!user) {
      user = await User.create({
        githubId: gh.id,
        username: gh.login,
        avatar: gh.avatar_url
      });
    }

    const jwtToken = jwt.sign(
      { id: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.redirect(`${callback}?token=${jwtToken}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("GitHub login failed");
  }
});

export default router;

