import mongoose from "mongoose";

const commitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
  diffSummary: String
});

export default mongoose.models.Commit || mongoose.model("Commit", commitSchema);


