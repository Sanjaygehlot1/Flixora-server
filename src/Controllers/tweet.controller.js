import { Tweet } from "../Models/tweet.model.js";
import mongoose, { isValidObjectId } from "mongoose";
import { AsyncHandler } from "../Utils/AsyncHandler.js"
import { ApiError } from "../Utils/ApiError.js"
import { ApiResponse } from "../Utils/ApiResponse.js"
import { uploadoncloudinary } from "../Utils/Cloudinary.js";

const CreateTweet = AsyncHandler(async (req, res) => {

    const { content } = req.body

    if (!content) {
        throw new ApiError(402, "Tweet Content Cannot be Empty")
    }
    let imageoncloudinary;

    if (req.file) {
        try {
            const imageLocalPath = await req.file?.path

            if (!imageLocalPath) {
                throw new ApiError(402, "Image not provided")
            }

            imageoncloudinary = await uploadoncloudinary(imageLocalPath)

            if (!imageoncloudinary) {
                throw new ApiError(402, "Failed to upload image on cloudinary")
            }
        } catch (error) {
            throw new ApiError(401, error.message)
        }

    }


    const tweet = await Tweet.create({
        content: content,
        owner: req.user?._id,
        image: {
            url: imageoncloudinary?.url || null,
            public_id: imageoncloudinary?.public_id || null
        }
    })



    if (!tweet) {
        throw new ApiError(402, "Failed to create tweet ")

    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            tweet,
            "Tweet Created Successfully"
        ))



})

const UpdateTweet = AsyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { NewContent } = req.body

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(301, "Invalid Id")
    }
    if (!NewContent) {
        throw new ApiError(301, "Tweet Cannot be empty.")
    }

    const TweetToBeUpdated = await Tweet.findById(tweetId)

    if (TweetToBeUpdated.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401, "Unauthorized Access:: you don't have permission to edit this tweet")
    }



    const UpdatedTweet = await Tweet.findByIdAndUpdate(tweetId, {
        $set: {
            content: NewContent.toString()
        },

    },
        {
            new: true
        })

    if (!UpdatedTweet) {
        throw new ApiError(401, "Unable to Update Tweet")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            UpdatedTweet,
            "Tweet Updated Successfully"
        ))

})

const DeleteTweet = AsyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(301, "Invalid Id")

    }

    if (!tweetId) {
        throw new ApiError(401, "Id not found")
    }

    const TweetToBeDeleted = await Tweet.findById(tweetId)

    if (TweetToBeDeleted.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401, "Unauthorized Access:: you don't have permission to edit this tweet")
    }


    try {
        await Tweet.findByIdAndDelete(tweetId)

        return res
            .status(200)
            .json(new ApiResponse(
                200,
                {},
                "Tweet Deleted Successfully"
            ))

    } catch (error) {
        throw new ApiError(401, error.message)
    }



})

const GetUserTweets = AsyncHandler(async (req,res)=>{
    const {userId} = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(301, "Invalid Id")

    }

    if (!userId) {
        throw new ApiError(401, "Id not found")
    }

    const UserTweets = await Tweet.aggregate([
        {
          $match: {
            owner: new mongoose.Types.ObjectId(userId)
          }
        },
        {
          $lookup: {
            from: "likes",
            localField: "_id",
            foreignField: "tweet",
            as: "Likes_details",
            pipeline: [
              {
                $project: {
                  tweet: 1,
                  likedBy: 1
                }
              }
            ]
          }
        },
        {
          $addFields: {
            Likes_count: {
             $size: "$Likes_details"
            }
          }
        },
      
        {
          $project: {
            Likes_details: 1,
            content: 1,
            owner: 1,
            image: 1,
            Likes_count:1
          }
        }
      ])

      if(Array.isArray(UserTweets) && UserTweets.length === 0){
        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "User has 0 Tweets"
        ))
      }


      return res
      .status(200)
      .json(new ApiResponse(
          200,
          UserTweets,
          "All Tweets Fetched Successfully"
      ))








})


export {
    CreateTweet,
    UpdateTweet,
    DeleteTweet,
    GetUserTweets
}