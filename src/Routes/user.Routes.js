import { Router } from "express";
import { RegisterUser } from "../Controllers/user.controller.js";
import { upload } from "../Middlewares/multer.middleware.js";

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


export default router