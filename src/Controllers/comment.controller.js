import { Comment } from '../Models/comment.model.js'
import { AsyncHandler } from '../Utils/AsyncHandler.js'
import { ApiResponse } from '../Utils/ApiResponse.js'
import { ApiError } from '../Utils/ApiError.js'
import mongoose from 'mongoose'


const GetAllCommentsOfAVideo = AsyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query;

    if (!videoId) {
        throw new ApiError(404, "Video Not Found")
    }

    const pipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "comment_owner",
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
                comment_owner: {
                    $arrayElemAt: ["$comment_owner", 0]
                }
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "comment",
                as: "liked_by"
            }
        },
        {
            $addFields: {
                TotalLikesonComment: {
                    $size: "$liked_by"
                }
            }
        },

        {
            $addFields: {
                isLikedByCurrentUser: {
                    $cond: {
                        if: {
                            $in: [req.user?._id, "$liked_by.likedBy"]
                        },
                        then: true,
                        else: false

                    }
                }
            }
        },

    ]
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    }

    try {
        const AllComments = await Comment.aggregatePaginate(Comment.aggregate(pipeline), options)

        return res
            .status(200)
            .json(new ApiResponse(
                200,
                AllComments,
                "All Comments fetched Successfully"
            ))
    } catch (error) {
        throw new ApiError(401, "Error while Getting All comments")
    }
})

const AddComment = AsyncHandler(async (req, res) => {
    const { videoId } = req.params

    const { content } = req.body

    if (!videoId) {
        throw new ApiError(404, "Video Not Found")
    }

    const comment = await Comment.create({
        content: content,
        owner: req.user?._id,
        video: videoId
    })

    if (!comment) {
        throw new ApiError(401, "Cannot Add Comment. Please try again later")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            comment,
            "Comment Added Successfully"
        ))

})

const UpdateComment = AsyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { NewContent } = req.body

    if (!NewContent) {
        throw new ApiError(402, "Updated Comment Not Found")
    }


    const comment_details = await Comment.findById(commentId)

    if (!comment_details) {
        throw new ApiError(402, "Comment Not Found")
    }
    console.log(comment_details.owner.toString())
    console.log(req.user?._id)

    if (comment_details.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(404, "Unauthorized Access:: You don't have permission to edit this comment")
    }

    try {
        const comment = await Comment.findByIdAndUpdate(commentId, {
            $set: {
                content: NewContent.toString()
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
                comment,
                "Comment Edited Successfully"
            ))


    } catch (error) {
        throw new ApiError(401, error.message)
    }

})

const DeleteComment = AsyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!commentId) {
        throw new ApiError(404, "Comment Not Found")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "Comment Not Found")
    }



    const video_owner = await Comment.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(commentId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video_owner",
                pipeline: [
                    {
                        $project: {
                            owner: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                video_owner: {
                    $arrayElemAt: ["$video_owner", 0]
                }
            }
        },


    ])

    console.log(video_owner)

    if (
        comment.owner.toString() !== req.user?._id.toString()
        &&
        video_owner[0].video_owner.owner.toString() !== req.user?._id.toString()
    ) {
        throw new ApiError(401, "Unauthorized Access :: you don't have permission to delete this comment")
    }



    await Comment.findByIdAndDelete(commentId)
    await Like.deleteMany({comment : new mongoose.Types.ObjectId(commentId)})
    

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {},
            "Comment Deleted Successfully"
        ))


})

export {
    AddComment,
    GetAllCommentsOfAVideo,
    UpdateComment,
    DeleteComment
}