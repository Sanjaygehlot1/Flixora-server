import { Router } from "express";
import { GetChannelStats, GetChannelVideos } from "../Controllers/Dashboard.controller.js";
import {AuthMiddleware} from "../Middlewares/Auth.middleware.js"

const router = Router()

router.route("/channel-videos/:ChannelId").get(AuthMiddleware,GetChannelVideos)
router.route("/channel-stats/:ChannelId").get(AuthMiddleware,GetChannelStats)

export {router}