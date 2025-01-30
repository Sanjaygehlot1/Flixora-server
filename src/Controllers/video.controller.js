import { Video } from "../Models/video.model.js";
import { AsyncHandler } from "../Utils/AsyncHandler.js";
import { ApiError } from '../Utils/ApiError.js'
import { DeleteImageOnCloudinary, DeleteVideoOnCloudinary, uploadoncloudinary } from "../Utils/Cloudinary.js";
import { ApiResponse } from '../Utils/ApiResponse.js'
import mongoose from "mongoose";
import { User } from "../Models/users.model.js";
import { Like } from "../Models/like.model.js";
import { Playlist } from "../Models/playlist.model.js";

const GetAllVideos = AsyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query } = req.query

  let pipeline = []

  if (query) {
    pipeline.push({
      $search: {
        index: "search-videos",
        text: {
          query: query,
          path: ["title", "description"],
        },
      },
    })
  }

  pipeline.push(
    {
      $match: {
        isPublished: true
      },
    },
    {
      $sort: {
        createdAt: -1
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner_details",
      },
    },
    {
      $addFields: {
        owner_details: {
          $first: "$owner_details"
        },
      },
    },
    {
      $sort: {
        createdAt: -1
      }
    },
    {
      $project: {
        _id: 1,
        duration: 1,
        title: 1,
        description: 1,
        videoFile: 1,
        owner_details: {
          username: "$owner_details.username",
          avatar: "$owner_details.avatar",
        },
        views: 1,
        thumbnail: 1,
        createdAt: 1,
        updatedAt: 1,
        isPublished: 1,
      },
    }
  )

  const searchResults = await Video.aggregate(pipeline)

  const startIndex = (page - 1) * limit;
  const paginatedResults = searchResults.slice(startIndex, startIndex + limit)

  const paginatedResponse = {
    docs: paginatedResults,
    totalDocs: searchResults.length,
    totalPages: Math.ceil(searchResults.length / limit),
    currentPage: parseInt(page, 10),
    pageSize: parseInt(limit, 10),
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        paginatedResponse,
        "Videos fetched successfully")
    )
})


const PublishVideo = AsyncHandler(async (req, res) => {

  const { title, description } = req.body

  if ([title, description].some((text) => text.trim() === "")) {
    throw new ApiError(401, "Title and Description is Required")
  }

  const VideoLocalPath = req.files?.video[0].path

  if (!VideoLocalPath) {
    throw new ApiError(401, "Video localpath not found")
  }

  const VideoonCloudinary = await uploadoncloudinary(VideoLocalPath)

  if (!VideoonCloudinary) {
    throw new ApiError(401, " Failed to upload video on cloudinary")
  }

  const ThumbnailLocalpath = req.files?.thumbnail[0].path

  if (!ThumbnailLocalpath) {
    throw new ApiError(401, "Video localpath not found")
  }

  const ThumbnailonCloudinary = await uploadoncloudinary(ThumbnailLocalpath)

  if (!ThumbnailonCloudinary) {
    throw new ApiError(401, " Failed to upload thumbnail on cloudinary")
  }


  const video = await Video.create({
    videoFile: {
      url: VideoonCloudinary.url,
      public_id: VideoonCloudinary.public_id
    },
    thumbnail: {
      url: ThumbnailonCloudinary.url,
      public_id: ThumbnailonCloudinary.public_id
    },
    title: title,
    description: description,
    duration: VideoonCloudinary.duration,
    isPublished: true,
    owner: req.user?._id

  })



  return res
    .status(200)
    .json(new ApiResponse(
      200,
      video,
      "Video Uploaded Successfully"
    ))

})

const GetVideoById = AsyncHandler(async (req, res) => {
  const { videoId } = req.params

  if (!videoId) {
    throw new ApiError(404, "Video not Found")
  }

  const userObjectId = new mongoose.Types.ObjectId(req.user?._id);
  console.log(userObjectId)
  const VideoAggreate = await Video.aggregate(
    [
      {
        $match: {
          _id: new mongoose.Types.ObjectId(videoId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner_details",
          pipeline: [
            {
              $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers",
              },
            },
            {
              $addFields: {
                subscribersCount: { $size: "$subscribers" },
                isSubscribed: {
                  $cond: {
                    if: {
                      $in: [
                        userObjectId,
                        {
                          $map: {
                            input: "$subscribers",
                            as: "sub",
                            in: "$$sub.subscribers",
                          },
                        },
                      ],
                    },
                    then: true,
                    else: false,
                  },
                },
              },
            },
            {
              $project: {
                username: 1,
                avatar: 1,
                subscribersCount: 1,
                isSubscribed: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner_details: {
            $ifNull: [{ $first: "$owner_details" }, null],
          },
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "Likes",
        },
      },
      {
        $addFields: {
          LikesCount: { $size: "$Likes" },
          LikedbyMe: {
            $cond: {
              if: {
                $in: [
                  userObjectId,
                  {
                    $reduce: {
                      input: "$Likes",
                      initialValue: [],
                      in: {
                        $concatArrays: [
                          "$$value",
                          {
                            $ifNull: [
                              {
                                $cond: [
                                  { $isArray: "$$this.likedBy" },
                                  "$$this.likedBy",
                                  ["$$this.likedBy"],
                                ],
                              },
                              [],
                            ],
                          },
                        ],
                      },
                    },
                  },
                ],
              },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          LikedbyMe: 1,
          LikesCount: 1,
          title: 1,
          description: 1,
          createdAt: 1,
          updatedAt: 1,
          videoFile: 1,
          views: 1,
          duration: 1,
          comments: 1,
          owner_details: 1,
          thumbnail: 1
        },
      },
    ])

  if (!VideoAggreate) {
    throw new ApiError(404, "video Not Found")
  }

  await Video.findByIdAndUpdate(videoId,
    {
      $inc: { views: 1 }
    }
  )
  if (req.user?._id) {
    await User.findByIdAndUpdate(req.user?._id, {
      $addToSet: {
        watchHistory: videoId
      }
    })
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      VideoAggreate[0],
      "Video Fetched Successfully"
    ))



})

const UpdateVideo = AsyncHandler(async (req, res) => {
  const { videoId } = req.params
  const { title, description } = req.body

  if (!(title && description)) {
    throw new ApiError(400, "Title and Description are required")
  }


  const NewThumbnailLocalPath = req.file?.path

  if (NewThumbnailLocalPath) {
    const video = await Video.findById(videoId)

    await DeleteImageOnCloudinary(video.thumbnail.public_id).then(() => {
    }).catch((err) => {
      console.log(err.message)
    })
    const ThumbnailonCloudinary = await uploadoncloudinary(NewThumbnailLocalPath)
    const updatedvideo = await Video.findByIdAndUpdate(videoId,
      {
        $set: {
          title: title,
          description,
          thumbnail: {
            url: ThumbnailonCloudinary.url,
            public_id: ThumbnailonCloudinary.public_id
          },
        },
      },
      {
        new: true
      }
    )

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            updatedvideo,
            "Video details updated Successfully"

        ))

  }

  const updatedvideo = await Video.findByIdAndUpdate(videoId,
    {
      $set: {
        title: title,
        description,
      },
    },
    {
      new: true
    }
  )

  return res
      .status(200)
      .json(new ApiResponse(
          200,
          updatedvideo,
          "Video details updated Successfully"

      ))





  // console.log(ThumbnailonCloudinary)






})

const DeleteVideo = AsyncHandler(async (req, res) => {
  const { videoId } = req.params


  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(301, "Video not found")
  }

  if (video.owner.toString() === req.user?._id.toString()) {
    await Video.findByIdAndDelete(videoId)
    await Like.deleteMany({ video: new mongoose.Types.ObjectId(videoId) })
    await Playlist.updateMany(
      { videos: videoId }, 
      { $pull: { videos: videoId } }
    )
    await User.updateMany(
      { watchHistory: videoId }, 
      { $pull: { watchHistory: videoId } }
    )
    
    await DeleteVideoOnCloudinary(video.videoFile.public_id).then(() => {
    }).catch((err) => {
      console.log(err.message)
    })

    await DeleteImageOnCloudinary(video.thumbnail.public_id).then(() => {
    }).catch((err) => {

      console.log(err.message)
    })

  } else {
    throw new ApiError(402, "Unauthorized Access :: User is not the owner of this video")
  }

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      {},
      "Video Deleted Successfully"
    ))


})

const TogglePublishStatus = AsyncHandler(async (req, res) => {
  const { videoId } = req.params

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(301, "Video not found")
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(401, "Unauthorized Access:: you don't have permission to perform this operation")
  }


  const publishStatus = video?.isPublished
  video.isPublished = !publishStatus;

  await video.save({ ValidateBeforeSave: false })

  return res
    .status(200)
    .json(new ApiResponse(
      200,
      video,
      "Publish Status Toggled"


    ))
})



export {
  PublishVideo,
  GetVideoById,
  UpdateVideo,
  DeleteVideo,
  TogglePublishStatus,
  GetAllVideos
}