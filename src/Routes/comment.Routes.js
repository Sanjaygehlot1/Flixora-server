import { Router } from "express";
import { AddComment, DeleteComment, GetAllCommentsOfAVideo, UpdateComment } from "../Controllers/comment.controller.js";
import { AuthMiddleware } from "../Middlewares/Auth.middleware.js";

const router = Router()

router.route("/add-comment/:videoId").post(AuthMiddleware,AddComment)
router.route("/get-comments/:videoId").get(AuthMiddleware,GetAllCommentsOfAVideo)
router.route("/update-comment/:commentId").post(AuthMiddleware,UpdateComment)
router.route("/delete-comment/:commentId").delete(AuthMiddleware,DeleteComment)


export {router}