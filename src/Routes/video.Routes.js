import { Router } from "express";
import { AuthMiddleware } from "../Middlewares/Auth.middleware.js";
import { PublishVideo,GetVideoById, UpdateVideo, DeleteVideo, TogglePublishStatus, GetAllVideos, GetVideoByIdAuth } from "../Controllers/video.controller.js";
import {upload } from '../Middlewares/multer.middleware.js'

const router = Router()

router.route('/upload-video').post(AuthMiddleware,upload.fields([
    {
        name: "video",
        maxCount: 1
    },
    {
        name: "thumbnail",
        maxCount:1
    }
]),PublishVideo)

router.route("/get-video/:videoId").get(GetVideoById)
router.route("/get-video-auth/:videoId").get(AuthMiddleware,GetVideoByIdAuth)

router.route("/search/v/").get(GetAllVideos)

router.route("/update-video/:videoId").patch(AuthMiddleware,upload.single("thumbnail"),UpdateVideo)

router.route("/delete-video/:videoId").get(AuthMiddleware, DeleteVideo)

router.route("/toggle-publish-status/:videoId").patch(AuthMiddleware, TogglePublishStatus)

export {router}