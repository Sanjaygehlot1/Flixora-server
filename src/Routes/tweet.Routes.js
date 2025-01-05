import { Router } from "express";
import { AuthMiddleware } from "../Middlewares/Auth.middleware.js";
import {upload} from '../Middlewares/multer.middleware.js'
import { CreateTweet, DeleteTweet, GetUserTweets, UpdateTweet } from "../Controllers/tweet.controller.js";
const router = Router()

router.route("/add-tweet").post(AuthMiddleware,upload.single("image"),CreateTweet)
router.route("/update-tweet/:tweetId").patch(AuthMiddleware,UpdateTweet)
router.route("/delete-tweet/:tweetId").delete(AuthMiddleware,DeleteTweet)
router.route("/get-tweets/:userId").get(AuthMiddleware,GetUserTweets)

export {router}