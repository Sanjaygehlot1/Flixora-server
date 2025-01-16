import {Like} from "../Models/like.model.js"
import {AsyncHandler} from "../Utils/AsyncHandler.js"
import {ApiError} from "../Utils/ApiError.js"
import { ApiResponse } from "../Utils/ApiResponse.js"
import mongoose from "mongoose"

const ToggleVideoLike = AsyncHandler(async(req,res)=>{
    const {videoId}= req.params

    

    const likedAlready =await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })


    if(likedAlready){
        await Like.findByIdAndDelete(likedAlready?._id)

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
              liked : false
            },
            "Video Disliked Successfully"
        ))      
    }

    const LikeVideo = await Like.create({
        video: videoId,
        likedBy: req.user?._id
    })

    if(!LikeVideo){
        throw new ApiError(401, "Unable to Like the Video")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {...LikeVideo, liked: true},
        "Video Liked Successfully"
    ))
    
})

const ToggleCommentLike = AsyncHandler(async (req,res)=>{
    const {CommentId} = req.params

    const LikedAlready = await Like.findOne({
        comment: CommentId,
        likedBy: req.user?._id
    })

    if(LikedAlready){
        await Like.findByIdAndDelete(LikedAlready?._id)

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Comment Disliked Successfully"
        ))
    }

    const LikeComment = await Like.create({
        comment: CommentId,
        likedBy: req.user?._id
    })

    if(!LikeComment){
        throw new ApiError(401, "No Comment Found")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        LikeComment,
        "Comment Liked Successfully"
    ))
})

const ToggleTweetLike = AsyncHandler(async (req,res)=>{
    const {TweetId} = req.params

    const LikedAlready = await Like.findOne({
        tweet: TweetId,
        likedBy: req.user?._id
    })

    if(LikedAlready){
        await Like.findByIdAndDelete(LikedAlready?._id)

        return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Tweet Disliked Successfully"
        ))
    }

    const LikeComment = await Like.create({
        tweet: TweetId,
        likedBy: req.user?._id
    })

    if(!LikeComment){
        throw new ApiError(401, "No Tweet Found")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        LikeComment,
        "Tweet Liked Successfully"
    ))
})

const GetVideosLikedByUser = AsyncHandler(async (req,res)=>{

    const LikedVideos = await Like.aggregate([
        {
          $match: {
            likedBy: new mongoose.Types.ObjectId(req.user?._id)
          }
        },
        {
          $lookup: {
            from: "videos",
            localField: "video",
            foreignField: "_id",
            as: "result"
          }
        },
        {
          $addFields: {
            result: {
              $arrayElemAt: ["$result", 0]
            }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "result.owner",
            foreignField: "_id",
            as: "Owner"
          }
        },
        {
          $addFields: {
            Owner: {
              $arrayElemAt: ["$Owner", 0]
            }
          }
        },
        {
            $sort: {
                createdAt: -1
            }
        },
        {
          $project: {
            
           "result.title":1,
            "result.description":1,
            "result.duration":1,
           "result.views":1,
           "result._id":1,
            "result.isPublished":1,
          "result.createdAt":1,
            "result.updatedAt":1,
           "Owner.username":1,
            "Owner.avatar":1,
            "result.videoFile.url":1,
          "result.thumbnail.url":1
            
          }
        }
      ])

      return res
      .status(200)
      .json(new ApiResponse(
        200,
        LikedVideos,
        "All Liked Videos Fetched Successfully"
      ))
})


export {
    ToggleVideoLike,
    ToggleCommentLike,
    ToggleTweetLike,
    GetVideosLikedByUser
}