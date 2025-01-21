import { AsyncHandler } from "../Utils/AsyncHandler.js"
import { ApiError } from "../Utils/ApiError.js"
import { ApiResponse } from "../Utils/ApiResponse.js"
import mongoose, { isValidObjectId } from "mongoose"
import {User} from '../Models/users.model.js'
import {Video} from '../Models/video.model.js'


const GetChannelVideos = AsyncHandler(async (req,res)=>{
    const {ChannelId} = req.params
    // Channel means user so, ChannelId === UserId
    if(!isValidObjectId(ChannelId)){
        throw new ApiError(401, "Channel Id Invalid")
    }
    if(!ChannelId){
        throw new ApiError(401, "Channel Id not found")
    }

    const Videos = await Video.find({
        owner: new mongoose.Types.ObjectId(ChannelId),
        isPublished: true
    }).select("-videoFile.public_id -thumbnail.public_id -updatedAt")


    if(!Videos){
        throw new ApiError(401, "No videos Found")
    }
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        Videos,
        "All Videos Fetched Successfully"
    ))



})

const GetAllVideos = AsyncHandler(async (req,res)=>{
  const {ChannelId} = req.params
  // Channel means user so, ChannelId === UserId
  if(!isValidObjectId(ChannelId)){
      throw new ApiError(401, "Channel Id Invalid")
  }
  if(!ChannelId){
      throw new ApiError(401, "Channel Id not found")
  }

  const Videos = await Video.find({
      owner: new mongoose.Types.ObjectId(ChannelId),
  }).select("-videoFile.public_id -thumbnail.public_id -updatedAt")


  if(!Videos){
      throw new ApiError(401, "No videos Found")
  }
  return res
  .status(200)
  .json(new ApiResponse(
      200,
      Videos,
      "All Videos Fetched Successfully"
  ))
})


const GetChannelStats = AsyncHandler(async (req,res)=>{

    const {ChannelId} = req.params

    if(!isValidObjectId(ChannelId)){
        throw new ApiError(401, "Channel Id Invalid")
    }
    if(!ChannelId){
        throw new ApiError(401, "Channel Id not found")
    }

    const ChannelStats = await User.aggregate([
        {
          "$match": {
            "_id": new mongoose.Types.ObjectId(ChannelId)
          }
        },
        {
          "$lookup": {
            "from": "subscriptions",
            "localField": "_id",
            "foreignField": "channel",
            "as": "subscribers"
          }
        },
        {
          "$addFields": {
            "Totalsubscribers": {
              "$size": "$subscribers"
            }
          }
        },
        {
          "$lookup": {
            "from": "videos",
            "localField": "_id",
            "foreignField": "owner",
            "as": "AllVideos"
          }
        },
        {
          "$addFields": {
            "TotalVideos": {
              "$size": "$AllVideos"
            }
          }
        },
        {
          "$lookup": {
            "from": "likes",
            "let": { "videoIds": "$AllVideos._id" },
            "pipeline": [
              {
                "$match": {
                  "$expr": {
                    "$in": ["$video", "$$videoIds"]
                  }
                }
              }
            ],
            "as": "likes_details"
          }
        },
        {
          "$addFields": {
            "TotalLikes": {
              "$size": "$likes_details"
            }
          }
        },
        {
          "$addFields": {
            "TotalViews": {
              "$sum": {
                "$map": {
                  "input": "$AllVideos",
                  "as": "video",
                  "in": { "$ifNull": ["$$video.views", 0] }
                }
              }
            }
          }
        },
        {
          "$lookup": {
            "from": "playlists",
            "localField": "_id",
            "foreignField": "owner",
            "as": "playlist_details"
          }
        },
        {
          "$addFields": {
            "Totalplaylists": {
              "$size": "$playlist_details"
            }
          }
        },
        {
          "$project": {
            "_id": 1,
            "TotalVideos": 1,
            "TotalLikes": 1,
            "TotalViews": 1,
            "Totalsubscribers": 1,
            "Totalplaylists": 1
          }
        }
      ]
      )

      if(Array.isArray(ChannelStats) && ChannelStats.length === 0){
        throw new ApiError(401, "Channel Stats not found")
      }
      return res
      .status(200)
      .json(new ApiResponse(
        200,
        ChannelStats,
        "Channel Stats Fetched Successfully"
      ))
    
})

export {
    GetChannelStats,
    GetChannelVideos,
    GetAllVideos
}