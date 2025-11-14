import express from "express";
import { generateCommitMessages } from "../utils/ai.js";
import Commit from "../models/Commit.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { diff, filesList } = req.body;

  try {
    const suggestions = await generateCommitMessages(diff, filesList);

    await Commit.create({
      user: req.user._id,
      diffSummary: diff.slice(0, 500)
    });

    res.json({ success: true, suggestions });
  } catch (err) {
    res.status(500).json({ success: false, error: "Server error" });
  }
});

export default router;


