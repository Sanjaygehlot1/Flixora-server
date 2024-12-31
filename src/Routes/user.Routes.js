import { Router } from "express";
import { LoginUser, LogOutUser, RegisterUser,GetNewAccessToken } from "../Controllers/user.controller.js";
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

export default router