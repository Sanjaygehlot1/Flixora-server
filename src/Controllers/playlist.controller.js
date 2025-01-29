import { AsyncHandler } from "../Utils/AsyncHandler.js"
import { ApiError } from "../Utils/ApiError.js"
import { ApiResponse } from "../Utils/ApiResponse.js"
import { Playlist } from '../Models/playlist.model.js'
import mongoose, { isValidObjectId } from "mongoose"
import { Video } from "../Models/video.model.js"


const CreatePlaylist = AsyncHandler(async (req, res) => {
    const { name, description } = req.body

    if (!name && !description) {
        throw new ApiError(401, "Name and Description is required")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "you need to login first")
    }

    const playlist = await Playlist.create({
        name: name,
        description: description,
        owner: req.user._id,
        videos: []
    })
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            playlist,
            "Playlist Created Successfully"
        ))


})
const UpdatePlaylist = AsyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { Newname, Newdescription } = req.body

    if (!Newname || !Newdescription) {
        throw new ApiError(401, "Name and Description is required")
    }

    if (!req.user?._id) {
        throw new ApiError(401, "you need to login first")
    }

    const PlaylistToBeUpdated = await Playlist.findById(playlistId)

    if (PlaylistToBeUpdated.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(404, "Unauthorized Access :: you don't have permission to Edit this playlist")
    }

    const UpdatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $set: {
                name: Newname || PlaylistToBeUpdated.name,
                description: Newdescription || PlaylistToBeUpdated.description
            }
        },
        {
            new: true
        }
    )

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            UpdatedPlaylist,
            "Playlist Created Successfully"
        ))


})

const AddVideosToPlaylist = AsyncHandler(async (req, res) => {
    const { videoId, playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404, "Playlist not found")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Video not found")
    }

    if (!videoId || !playlistId) {
        throw new ApiError(404, "Video adn playlist IDs not found")

    }

    const playlistToAdd = await Playlist.findById(playlistId)


    if (playlistToAdd.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(404, "Unauthorized Access :: you don't have permission to add videos to this playlist")
    }

    const videocheck = await Video.findById(videoId)

    if (!videocheck) {
        throw new ApiError(401, "Video Does not Exist")
    }


    const playlist = await Playlist.findByIdAndUpdate(playlistId,
        {
            $addToSet: {
                videos: videoId
            }
        },
        {
            new: true
        }
    )

    if (!playlist) {
        throw new ApiError(401, "Unable to add video")
    }

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            playlist,
            "Video Added to playlist"
        ))




})

const RemoveVideoFromPlaylist = AsyncHandler(async (req, res) => {
    const { videoId, playlistId } = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404, "Playlist not found")
    }
    if (!isValidObjectId(videoId)) {
        throw new ApiError(404, "Video not found")
    }

    if (!videoId || !playlistId) {
        throw new ApiError(404, "Video and playlist IDs not found")

    }

    const playlistToDeleteFrom = await Playlist.findById(playlistId)


    if (playlistToDeleteFrom.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(404, "Unauthorized Access :: you don't have permission to delete videos from this playlist")
    }

    const videocheck = await Video.findById(videoId)

    if (!videocheck) {
        throw new ApiError(401, "Video Does not Exist")
    }

    const UpdatedPlaylist = await Playlist.findByIdAndUpdate(playlistId, {
        $pull: {
            videos: {
                $in:[videoId]
            }
        }
    },
        {
            new: true
        })

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        UpdatedPlaylist,
        "Video Deleted From playlist"

    ))

})

const DeletePlaylist = AsyncHandler(async (req,res)=>{

    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404, "Playlist not found")
    }
    

    if (!playlistId) {
        throw new ApiError(404, "playlist ID not found")

    }

    const playlistToDelete = await Playlist.findById(playlistId)


    if (playlistToDelete.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(404, "Unauthorized Access :: you don't have permission to delete this playlist")
    }

   const DeletedPlaylist = await Playlist.findByIdAndDelete(playlistId)

   if(!DeletedPlaylist){
    throw new ApiError(401, "Unable to delete the playlist")
   }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Playlist Deleted Successfully"
    ))
})

const GetUserPlaylists =  AsyncHandler(async (req,res)=>{
    const {userId} = req.params

    if (!isValidObjectId(userId)) {
        throw new ApiError(404, "User not found")
    }

    if (!userId) {
        throw new ApiError(404, "user Id not found")

    }

    const UserPlaylists = await Playlist.aggregate([
        {
          $match: {
            owner: new mongoose.Types.ObjectId(userId)
          }
        },
        {
          $lookup: {
            from: "videos",
            localField: "videos",
            foreignField: "_id",
            as: "videos",
           
          }
        },
        {
          $addFields: {
            TotalVideos: {
              $size: "$videos"
            }
          }
        },
        {
          $addFields: {
            TotalViews: {
              $sum : "$videos.views"
            }
          }
        },
        {
            $project:{
                TotalVideos:1,
                TotalViews:1,
                name:1,
                description:1,
                createdAt:1
                

            }
        }
        
      ])

      if(Array.isArray(UserPlaylists) && UserPlaylists.length === 0){
        return res
      .status(200)
      .json(new ApiResponse(
        200,
        [],
        "User has 0 Playlists"
      ))
      }

      return res
      .status(200)
      .json(new ApiResponse(
        200,
        UserPlaylists,
        "All Playlists fetched successfully"
      ))


})

const GetPlaylistById =  AsyncHandler(async (req,res)=>{
    const {playlistId} = req.params

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(404, "Playlist not found")
    }

    if (!playlistId) {
        throw new ApiError(404, "user Id not found")

    }

    const playlist = await Playlist.aggregate([
      {
        $match: {
          _id:new mongoose.Types.ObjectId(playlistId)
        }
      },
      {
        $lookup: {
          from: "videos",
          localField: "videos",
          foreignField: "_id",
          as: "videos"
        }
      },
      {
        $addFields: {
          TotalVideos: { $size: "$videos" }
        }
      },
      {
        $addFields: {
          TotalViews: { $sum: "$videos.views" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "Playlist_owner",
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
          Playlist_owner: { $arrayElemAt: ["$Playlist_owner", 0] }
        }
      },
      {
        $unwind: {
          path: "$videos",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "videos.owner",
          foreignField: "_id",
          as: "videos.ownerDetails",
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
        $group: {
          _id: "$_id",
          TotalVideos: { $first: "$TotalVideos" },
          TotalViews: { $first: "$TotalViews" },
          name: { $first: "$name" },
          description: { $first: "$description" },
          createdAt: { $first: "$createdAt" },
          Playlist_owner: { $first: "$Playlist_owner" },
          videos: { $push: "$videos" }
        }
      },
      {
        $addFields: {
          videos: {
            $ifNull: ["$videos", []] 
          }
        }
      },
      {
        $project: {
          TotalVideos: 1,
          TotalViews: 1,
          name: 1,
          description: 1,
          createdAt: 1,
          Playlist_owner: 1,
          videos: {
            _id: 1, // Explicitly include video IDs
            videoFile: { url: 1 },
            thumbnail: { url: 1 },
            duration: 1,
            views: 1,
            title: 1,
            description: 1,
            isPublished: 1,
            createdAt: 1,
            ownerDetails: 1
          }
        }
      }
    ]
    )


      if(Array.isArray(playlist) && playlist.length === 0){
        return res
      .status(200)
      .json(new ApiResponse(
        200,
        [],
        "Playlist Does not Exist"
      ))
      }

      return res
      .status(200)
      .json(new ApiResponse(
        200,
        playlist,
        "Playlist fetched successfully"
      ))


})





export {
    CreatePlaylist,
    UpdatePlaylist,
    AddVideosToPlaylist,
    RemoveVideoFromPlaylist,
    DeletePlaylist,
    GetUserPlaylists,
    GetPlaylistById
}