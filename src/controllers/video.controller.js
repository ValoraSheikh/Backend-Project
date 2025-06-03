import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteFromCloudinary,
  deleteVideoFromCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { User } from "../models/user.models.js";

const getAllVideos = asyncHandler(async (req, res) => {
  // const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  const videos = await Video.aggregate([
    {
      $match: {
        $or: [
          { title: { $regex: query || "", $options: "i" } },
          { description: { $regex: query || "", $options: "i" } },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "createdBy",
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
        createdBy: { $first: "$createdBy" },
      },
    },
    {
      $project: {
        thumbnail: 1,
        videoFile: 1,
        title: 1,
        description: 1,
        createdBy: 1,
      },
    },
    {
      $sort: {
        [sortBy]: sortType === "asc" ? 1 : -1,
      },
    },
    {
      $skip: (page - 1) * limit,
    },
    {
      $limit: parseInt(limit),
    },
  ]);

  if (!videos?.length) {
    throw new ApiError(404, "No videos found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video

  if (!title || !description) {
    throw new ApiError(400, "Give all the required details of video");
  }

  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video is required");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail is required");
  }

  let videoFile;
  try {
    videoFile = await uploadOnCloudinary(videoFileLocalPath);
  } catch (error) {
    throw new ApiError(500, "Failed to upload video");
  }

  let thumbnail;
  try {
    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  } catch (error) {
    throw new ApiError(500, "Failed to upload thumbnail");
  }

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration: videoFile.duration,
    owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(500, "Somthing went wrong while publishing a video");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Give a valid video ID");
  }

  const video = await Video.findById(videoId).populate(
    "owner",
    "fullName username avatar"
  );

  if (!video) {
    throw new ApiError(404, "video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video ID fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Give a valid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(
      403,
      "You are not allowed to update's another user's video"
    );
  }

  const { title, description } = req.body;
  const newThumbnailLocalPath = req.file?.path;

  console.log("Here is new thumbnail", newThumbnailLocalPath);
  

  if (!title || !description) {
    throw new ApiError(400, "Title and description both required");
  }

  if (!newThumbnailLocalPath) {
    throw new ApiError(400, "New Thumbnail is required baby");
  }

  try {
    await deleteFromCloudinary(video.thumbnail);
  } catch (error) {
    throw new ApiError(500, "Error while deleting the previous thumbnail");
  }

  const newThumbnail = await uploadOnCloudinary(newThumbnailLocalPath);

  if (!newThumbnail.url) {
    throw new ApiError(400, "Error while in uploading thumbnail");
  }
  
  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail: newThumbnail.url,
      },
    },
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(400, "Video is not updated");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedVideo, "Videos details updated successfully")
    );
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Give a valid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not allowed to delete other's video ");
  }

  const deletedVideoFile = await deleteVideoFromCloudinary(video.videoFile);

  if (!deletedVideoFile || deletedVideoFile?.result !== "ok") {
    throw new ApiError(500, "Failed to delete video file");
  }

  const deleteThumbnail = await deleteFromCloudinary(video.thumbnail);

  if (!deleteThumbnail || deleteThumbnail?.result !== "ok") {
    throw new ApiError(500, "Failed to delete thumbnail file");
  }

  const deleteVideo = await Video.findByIdAndDelete(videoId);

  if (!deleteVideo) {
    throw new ApiError(500, "Error while deleting video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !isValidObjectId(videoId)) {
    throw new ApiError(400, "Give a valid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(
      403,
      "You are not allowed to modify another user's video"
    );
  }

  const videoPublishStatus = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        isPublished: !video.isPublished,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videoPublishStatus,
        "Video published status modified"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
