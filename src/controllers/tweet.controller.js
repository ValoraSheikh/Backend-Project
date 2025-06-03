import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet

  const userId = req.user._id;

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, "Missing or Invalid user ID");
  }

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Please provide the content for tweet");
  }

  const tweet = await Tweet.create({
    content,
    owner: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets

  const { userId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!userId || !isValidObjectId(userId)) {
    throw new ApiError(400, "Missing or Invalid user ID");
  }

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        content: 1,
        owner: 1,
        createdAt: 1,
      },
    },
    //pagination
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: parseInt(limit),
    },
  ]);

  if (!tweets) {
    throw new ApiError(400, "Failed to fetch the tweets");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet

  const { tweetId } = req.params;

  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Missing or Invalid tweet ID");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "No tweets were found");
  }

  if (!tweet.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not allowed to change other's tweet");
  }

  const { content } = req.body;

  if (!content) {
    throw new ApiError(400, "Please give tweet");
  }

  const tweetUpdated = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(200, tweetUpdated, "You have updated tweet successfully")
    );
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet

  const { tweetId } = req.params;

  if (!tweetId || !isValidObjectId(tweetId)) {
    throw new ApiError(400, "Missing or Invalid Tweet ID");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "No tweets were found");
  }

  if (!tweet.owner.equals(req.user._id)) {
    throw new ApiError(
      403,
      "You are not allowed to delete another user's tweet"
    );
  }

  const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

  if (!deletedTweet) {
    throw new ApiError(404, "Failed to delete tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
