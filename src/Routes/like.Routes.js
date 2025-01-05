import { Router } from "express";
import { GetVideosLikedByUser, ToggleCommentLike, ToggleTweetLike, ToggleVideoLike } from "../Controllers/like.controller.js";
import { AuthMiddleware } from "../Middlewares/Auth.middleware.js";

const router = Router()

router.route("/like-video/:videoId").patch(AuthMiddleware,ToggleVideoLike)
router.route("/like-comment/:CommentId").patch(AuthMiddleware,ToggleCommentLike)
router.route("/like-tweet/:TweetId").patch(AuthMiddleware,ToggleTweetLike)
router.route("/get-liked-videos/").get(AuthMiddleware,GetVideosLikedByUser)


export {router}