import { Router } from "express";
import { RegisterUser } from "../Controllers/user.controller.js";
const router = Router()

router.route("/register").post(RegisterUser)
router.route("/register").get()

export default router