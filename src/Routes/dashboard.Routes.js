import { Router } from "express";
import { GetAllVideos, GetChannelStats, GetChannelVideos } from "../Controllers/Dashboard.controller.js";
import {AuthMiddleware} from "../Middlewares/Auth.middleware.js"

const router = Router()

router.route("/published-videos/:ChannelId").get(AuthMiddleware,GetChannelVideos)
router.route("/all-videos/:ChannelId").get(AuthMiddleware,GetAllVideos)
router.route("/channel-stats/:ChannelId").get(AuthMiddleware,GetChannelStats)

export {router}