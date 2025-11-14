import Commit from "../models/Commit.js";

export async function rateLimitUser(req, res, next) {
  const user = req.user;

  const limit = parseInt(process.env.DAILY_LIMIT_FREE || "25", 10);

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const usageToday = await Commit.countDocuments({
    user: user._id,
    createdAt: { $gte: startOfDay }
  });

  if (usageToday >= limit) {
    return res.status(429).json({
      success: false,
      error: `Daily limit reached (${limit}/${limit}). Upgrade for more usage.`
    });
  }

  next();
}
