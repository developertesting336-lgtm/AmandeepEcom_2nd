import mongoose from "mongoose";

const taglineSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      maxlength: 50,
    },

    isUsed: {
      type: Boolean,
      default: true,
    }
    // bytes: {
    //     image: Buffer,
    //     required: true,
    //   },
  },
  {
    timestamps: true,
    collection: "taglines",
  }
);

export default mongoose.model("Tagline", taglineSchema);