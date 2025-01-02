import { Video } from "../Models/video.model.js";
import { AsyncHandler } from "../Utils/AsyncHandler.js";
import { ApiError } from '../Utils/ApiError.js'
import { uploadoncloudinary } from "../Utils/Cloudinary.js";
import { ApiResponse } from '../Utils/ApiResponse.js'


const PublishVideo = AsyncHandler(async (req, res) => {

    const { title, description } = req.body

    if (!(title && description)) {
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
        videoFile: VideoonCloudinary.url,
        thumbnail: ThumbnailonCloudinary.url,
        title: title,
        description: description,
        duration: VideoonCloudinary.duration,
        isPublished: true,

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

    const video = await Video.findById(videoId)

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            video.videoFile,
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
    
        const ThumbnailonCloudinary = await uploadoncloudinary(NewThumbnailLocalPath)
    
        const updatedvideo = await Video.findByIdAndUpdate(videoId,
            {
                $set: {
                    title: title,
                    description,
                    thumbnail: ThumbnailonCloudinary.url,
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

const DeleteVideo = AsyncHandler(async (req,res)=>{
    const {videoId} = req.params

    const video = await Video.findByIdAndDelete(videoId)

    // console.log(video)
    if(!video){
        throw new ApiError(301,"Unable to delete video")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Video Deleted Successfully"
    ))
    

})

export {
    PublishVideo,
    GetVideoById,
    UpdateVideo,
    DeleteVideo
}