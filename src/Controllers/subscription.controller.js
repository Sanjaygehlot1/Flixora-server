import { Subscription } from "../Models/subscription.model.js";
import mongoose,{isValidObjectId} from "mongoose";
import { AsyncHandler } from '../Utils/AsyncHandler.js'
import { ApiResponse } from '../Utils/ApiResponse.js'
import { ApiError } from '../Utils/ApiError.js'
import { User } from "../Models/users.model.js";


const ToggleSubscription = AsyncHandler(async (req, res) => {
  const { ChannelId } = req.params

  if(!isValidObjectId(ChannelId)){
    throw new ApiError(400,"Invalid ID format")
  }

  if (req.user?._id.toString() === ChannelId.toString()) {
    throw new ApiError(402, "Cannot Subscribe Self Channel")
  }

  const AlreadySubscribed = await Subscription.find(
    {
      subscriber: new mongoose.Types.ObjectId(req.user?._id),
      channel: new mongoose.Types.ObjectId(ChannelId)
    }
  )
  console.log(AlreadySubscribed)

  if (Array.isArray(AlreadySubscribed) && AlreadySubscribed.length != 0) {
    await Subscription.findByIdAndDelete(AlreadySubscribed[0]._id)

    return res
      .status(200)
      .json(new ApiResponse(
        200,
        {subscribed: false},
        "Channel Unsubscribed Successfully"
      ))
  }

  try {
    const subscribe = await Subscription.create({
      subscriber: req.user?._id,
      channel: ChannelId
    })

    if (!subscribe) {
      throw new ApiError(402, "Unable to subscribe Please try again.")
    }

    return res
      .status(200)
      .json(new ApiResponse(
        200,
        {...subscribe, subscribed: true},
        "Channel Subscribed Successfully"
      ))
  } catch (error) {
    throw new ApiError(401, error.message)
  }

})

const GetUserChannelSubscribers = AsyncHandler(async (req, res) => {
  const { ChannelId } = req.params

  if(!isValidObjectId(ChannelId)){
    throw new ApiError(400,"Invalid ID format")
  }

  if (!ChannelId) {
    throw new ApiError(401, "Channel Id not found")
  }
  const channel = await User.findById(ChannelId)

  if (!channel) {
    throw new ApiError(404, "Channel not found")
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(ChannelId)
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriber_details",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1
            }
          }
        ]
      }
    },
    {
      $addFields: {
        subscriber_details: {
          $arrayElemAt: ["$subscriber_details", 0]
        }
      }
    },
    {
      $project: {
        channel: 1,
        subscriber_details: 1
      }
    }

  ])

  if (subscribers.length != 0) {

    return res
      .status(200)
      .json(new ApiResponse(
        200,
        subscribers,
        "All Subscribers Fetched Successfully"
      ))
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      {},
      "No subscribers Found"
    ))

})

const GetChannelsSubscribedTo = AsyncHandler(async (req, res) => {

  const { userId } = req.params

  if(!isValidObjectId(userId)){
    throw new ApiError(400,"Invalid ID format")
  }

  if (!userId) {
    throw new ApiError(401, "User Id not found")
  }

  const user = await User.findById(userId)

  if (!user) {
    throw new ApiError(404, "User not found")
  }

  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channel_details",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1
            }
          }
        ]
      },
    },
    {
      $addFields: {
        channel_details: {
          $arrayElemAt: ["$channel_details", 0]
        }
      }
    },
    {
      $project: {
        channel_details: 1,
        subscriber: 1
      }
    }
  ])

  if (channels.length != 0) {

    return res
      .status(200)
      .json(new ApiResponse(
        200,
        channels,
        "Subscribed Channels Fetched Successfully"
      ))
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      {},
      "No Channels Subscribed by user"
    ))

})

const CheckSubscription = AsyncHandler(async (req,res)=>{
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
      throw new ApiError(400,"Invalid ID format")
    }
  
    if (!channelId) {
      throw new ApiError(401, "channel Id not found")
    }

    const SubscriptionStatus = await Subscription.find(
      {
        subscriber: new mongoose.Types.ObjectId(req.user?._id),
        channel: new mongoose.Types.ObjectId(channelId)
      }
    )
    console.log(SubscriptionStatus)

    if(SubscriptionStatus.length == 0){
      return res
      .status(200)
      .json(new ApiResponse(
        200,
        {status : false},
        "Not Subscribed"
      ))
    }

    return res
    .status(200)
    .json(new ApiResponse(
      200,
      {status : true},
      "Subscribed"
    ))




})

export {
  ToggleSubscription,
  GetUserChannelSubscribers,
  GetChannelsSubscribedTo,
  CheckSubscription
}
