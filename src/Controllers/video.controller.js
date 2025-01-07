import { Video } from "../Models/video.model.js";
import { AsyncHandler } from "../Utils/AsyncHandler.js";
import { ApiError } from '../Utils/ApiError.js'
import { DeleteImageOnCloudinary, DeleteVideoOnCloudinary, uploadoncloudinary } from "../Utils/Cloudinary.js";
import { ApiResponse } from '../Utils/ApiResponse.js'
import mongoose from "mongoose";
import { User } from "../Models/users.model.js";
import { Like } from "../Models/like.model.js";

const GetAllVideos = AsyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, userId } = req.query;
    console.log(userId);

    const pipeline = [];

    if (query) {
        pipeline.push({
            $search: {
                index: "search-videos",
                text: {
                    query: query,
                    path: ["title", "description"]
                }
            }
        })
    }



    pipeline.push({
        $match: {
            isPublished: true
        }
    },)

    pipeline.push({
        $sort: {
            "createdAt": -1
        }
    })
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner_details",
        }
    })
    pipeline.push({
        $addFields: {
            owner_details: {
                $first: "$owner_details",
            },
        },
    })
    pipeline.push({
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
        }
    })



    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }
    console.log("1st :: ", await Video.aggregate(pipeline))

    const video = await Video.aggregatePaginate(Video.aggregate(pipeline), options)
    // console.log("2nd :: ", video)
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            video,
            "Videos fetched Successfully"
        ))

})

const PublishVideo = AsyncHandler(async (req, res) => {

    const { title, description } = req.body

    if ([title, description].some((text) => text.trim() === "")) {
        throw new ApiError(401, "Title and Description is Required")
    }

    console.log(req.files)
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


    const VideoAggreate = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
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
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: {
                                $size: "$subscribers"
                            },
                            isSubscribed: {
                                $cond: {
                                    if: { $in: [req.user?._id, "$subscribers.subscribers"] },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    },

                ]
            },

        },
        {
            $addFields: {
                owner_details: {
                    $first: "$owner_details"
                }
            }
        },

        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "Likes"
            }
        },
        {
            $addFields: {
                LikesCount: {
                    $size: "$Likes"
                },
                LikedbyMe: {
                    $cond: {
                        if: { $in: [req.user?._id, "$Likes.likedBy"] },
                        then: true,
                        else: false
                    }
                }
            }
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
                owner_details: 1
            }
        }


    ])

    if (!VideoAggreate) {
        throw new ApiError(404, "video Not Found")
    }

    await Video.findByIdAndUpdate(videoId,
        {
            $inc: { views: 1 }
        }
    )
    console.log(VideoAggreate[0])
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

    if (!NewThumbnailLocalPath) {
        throw new ApiError(401, "New Thumbnail not found")
    }

    const video = await Video.findById(videoId)
    // console.log(video)

    await DeleteImageOnCloudinary(video.thumbnail.public_id).then((status) => {
        console.log("image deleted from cloudinary and Status ::", status)
    }).catch((err) => {
        console.log(err.message)
    })



    const ThumbnailonCloudinary = await uploadoncloudinary(NewThumbnailLocalPath)
    // console.log(ThumbnailonCloudinary)

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


})

const DeleteVideo = AsyncHandler(async (req, res) => {
    const { videoId } = req.params


    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(301, "Unable to delete video")
    }

    if (video.owner.toString() === req.user?._id.toString()) {
        await Video.findByIdAndDelete(videoId)
        await Like.deleteMany({video : new mongoose.Types.ObjectId(videoId)})

        await DeleteVideoOnCloudinary(video.videoFile.public_id).then(() => {
            console.log("Video deleted from cloudinary")
        }).catch((err) => {
            console.log(err.message)
        })

        await DeleteImageOnCloudinary(video.thumbnail.public_id).then(() => {
            console.log("image deleted from cloudinary")
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

    const publishStatus = !video.isPublished
    video.isPublished = publishStatus;

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