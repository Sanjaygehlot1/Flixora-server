import { Router } from "express";
import { AuthMiddleware } from "../Middlewares/Auth.middleware.js";
import { GetChannelsSubscribedTo, GetUserChannelSubscribers, ToggleSubscription } from "../Controllers/subscription.controller.js";
const router = Router()

router.route("/toggle-subs/:ChannelId").patch(AuthMiddleware,ToggleSubscription)
router.route("/get-subs/:ChannelId").get(AuthMiddleware,GetUserChannelSubscribers)
router.route("/subscribed-channels/:userId").get(AuthMiddleware,GetChannelsSubscribedTo)

export {router}