import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import UserRoute from './Routes/user.Routes.js'
import { router as VideoRouter} from './Routes/video.Routes.js'
import { router as LikesRouter } from './Routes/like.Routes.js'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

app.use("/api/v1/users", UserRoute)
app.use("/api/v1/video",VideoRouter)
app.use("/api/v1/like",LikesRouter)

export { app }