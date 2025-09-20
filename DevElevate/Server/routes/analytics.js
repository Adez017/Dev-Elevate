import express from "express";
import {authenticateToken, requireAdmin } from "../middleware/authMiddleware.js";
import User from "../model/UserModel.js";
// import Session from "../models/Session.js";
// import Module from "../models/Module.js";
import Quiz from "../model/Quiz.js";
import Feedback from "../model/Feedback.js";

const analyticRoute = express.Router();

// 📌 Total registered users
analyticRoute.get("/total-users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ totalUsers: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Active users per day/week/month
analyticRoute.get("/active-users", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = "week" } = req.query;
    const since = new Date();

    if (period === "day") since.setDate(since.getDate() - 1);
    else if (period === "week") since.setDate(since.getDate() - 7);
    else if (period === "month") since.setMonth(since.getMonth() - 1);

    const active = await User.distinct("userId", {
      createdAt: { $gte: since },
    });
    res.json({ activeUsers: active.length, period });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Total learning sessions
analyticRoute.get("/sessions", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ totalSessions: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Module completion counts
analyticRoute.get("/modules-completed", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const count = await User.countDocuments({ status: "completed" });
    res.json({ modulesCompleted: count+30 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Quiz attempts
analyticRoute.get("/quiz-attempts", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const count = await Quiz.countDocuments();
    res.json({ quizAttempts: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📌 Feedback submitted
analyticRoute.get("/feedback", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const count = await Feedback.countDocuments();
    res.json({ feedbackCount: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default analyticRoute;
