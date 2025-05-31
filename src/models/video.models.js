import mongoose, { model, Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    videoFile: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: Number, //Cloudinary
      required: true,
    },
    views: {
      type: Number, //Cloudinary
      default: 0,
    },
    isPublished: {
      type: Boolean, //Cloudinary
      default: true,
    },
    owner: {
      type: Schema.Types.ObjectId, //Cloudinary
      ref: "User",
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

export const video = model("Video", videoSchema);
