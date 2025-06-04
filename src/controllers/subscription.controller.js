import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, "Missing or Invalid channel ID");
  }

  const userID = req.user._id;

  const subscribed = await Subscription.findOne({
    channel: channelId,
    subscriber: userID,
  });

  if (!subscribed) {
    // Subscribe the user to the channel
    const subscribe = await Subscription.create({
      channel: channelId,
      subscriber: userID,
    });

    if (!subscribe) {
      throw new ApiError(500, "Error while subscribing to the channel");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, subscribe, "Channel Subscribed"));
  }

  // Unsubscribe from the channel
  const unsubscribe = await Subscription.deleteOne({ _id: subscribed._id });

  if (!unsubscribe) {
    throw new ApiError(500, "Error while unsubscribing from the channel");
  }

  return res.status(200).json(new ApiResponse(200, {}, "Channel Unsubscribed"));
});

// Controller to return subscriber count of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId || !isValidObjectId(channelId)) {
    throw new ApiError(400, "Missing or Invalid channel ID");
  }

  const subscriberCount = await Subscription.countDocuments({
    channel: new mongoose.Types.ObjectId(channelId),
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { subscriberCount },
        "Subscriber count fetched successfully"
      )
    );
});

// Controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId || !isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Missing or Invalid subscriber ID");
  }

  const totalCount = await Subscription.countDocuments({
    subscriber: new mongoose.Types.ObjectId(subscriberId),
  });

  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channelDetails",
        pipeline: [
          {
            $project: {
              username: 1,
              fullname: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        channelDetails: {
          $first: "$channelDetails",
        },
      },
    },
    {
      $project: {
        channelDetails: 1,
      },
    },
  ]);

  if (!subscribedChannels?.length) {
    throw new ApiError(404, "No subscribed channels found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { totalCount, channels: subscribedChannels },
        "Subscribed channels fetched successfully"
      )
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };