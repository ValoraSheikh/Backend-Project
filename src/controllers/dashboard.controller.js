import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/likes.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get channel stats (total views, subscribers, videos, likes)

  const userId = req.user._id;

  // 1) Total videos & total views
  // — Group everything into a single document (_id: null), not by each videoFile
  const videoStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: "$views" },
        totalVideos: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        totalViews: 1,
        totalVideos: 1,
      },
    },
  ]);
  // videoStats is either [] or [{ totalViews, totalVideos }]

  // 2) Total subscribers
  const subscribersStats = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: null,
        totalSubscribers: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        totalSubscribers: 1,
      },
    },
  ]);
  // subscribersStats is [] or [{ totalSubscribers }]

  // 3) Total likes on this user’s videos
  // — First lookup each Like’s video and unwind, then match owner, then group
  const likesStats = await Like.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "videoInfo",
      },
    },
    {
      $unwind: "$videoInfo", // turn array into object
    },
    {
      $match: {
        "videoInfo.owner": new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: null,
        totalLikes: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        totalLikes: 1,
      },
    },
  ]);
  // likesStats is [] or [{ totalLikes }]

  // Safely pull out each value or default to 0
  const totalViews =
    videoStats.length > 0 && typeof videoStats[0].totalViews === "number"
      ? videoStats[0].totalViews
      : 0;
  const totalVideos =
    videoStats.length > 0 && typeof videoStats[0].totalVideos === "number"
      ? videoStats[0].totalVideos
      : 0;

  const totalSubscribers =
    subscribersStats.length > 0 &&
    typeof subscribersStats[0].totalSubscribers === "number"
      ? subscribersStats[0].totalSubscribers
      : 0;

  const totalLikes =
    likesStats.length > 0 && typeof likesStats[0].totalLikes === "number"
      ? likesStats[0].totalLikes
      : 0;

  const info = {
    totalViews,
    totalVideos,
    totalSubscribers,
    totalLikes,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, info, "Channel stats fetched"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel

  const userId = req.user._id;

  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        owner: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  if (!videos) {
    throw new ApiError("Failed to fetch the videos");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched"));
});

export { getChannelStats, getChannelVideos };
