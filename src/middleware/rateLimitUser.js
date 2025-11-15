import Commit from "../models/Commit.js";

export async function rateLimitUser(req, res, next) {
  const DAILY_LIMIT = 30; // free limit for everyone

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  // Count how many commits user generated today
  const usageToday = await Commit.countDocuments({
    user: req.user._id,
    createdAt: { $gte: startOfDay }
  });

  if (usageToday >= DAILY_LIMIT) {
    return res.status(429).json({
      success: false,
      error: `Daily limit reached (30/30). Please try again tomorrow.`
    });
  }

  next();
}




