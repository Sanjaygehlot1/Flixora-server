import { Router } from "express";
import { LoginUser, LogOutUser, RegisterUser,GetNewAccessToken, GetChannelDetails, UpdateAvatar, UpdateCoverImage, UpdateUserDetails, GetCurrentUser, ChangeCurrentPassword, GetWatchHistory } from "../Controllers/user.controller.js";
import { upload } from "../Middlewares/multer.middleware.js";
import { AuthMiddleware } from "../Middlewares/Auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverimage",
            maxCount: 1
        }
    ]),
    RegisterUser
)

router.route("/login").post(LoginUser)
router.route("/logout").post(AuthMiddleware,LogOutUser)
router.route("/new-token").post(GetNewAccessToken)
router.route("/update-avatar").patch(AuthMiddleware,upload.single("avatar"),UpdateAvatar)
router.route("/update-coverimage").patch(AuthMiddleware,upload.single("coverImage"),UpdateCoverImage)
router.route("/update-details").post(AuthMiddleware,UpdateUserDetails)
router.route("/get-user").get(AuthMiddleware,GetCurrentUser)
router.route("/change-pass").patch(AuthMiddleware,ChangeCurrentPassword)
router.route("/get-channel-details/:username").get(AuthMiddleware,GetChannelDetails)
router.route("/watch-history").get(AuthMiddleware,GetWatchHistory)

export default router