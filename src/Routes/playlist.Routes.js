import { Router } from "express";
import { AuthMiddleware } from "../Middlewares/Auth.middleware.js";
import { CreatePlaylist, UpdatePlaylist , AddVideosToPlaylist, RemoveVideoFromPlaylist, DeletePlaylist, GetUserPlaylists, GetPlaylistById} from "../Controllers/playlist.controller.js";
const router = Router()

router.route("/create-playlist").post(AuthMiddleware, CreatePlaylist)
router.route("/update-playlist/:playlistId").patch(AuthMiddleware, UpdatePlaylist)
router.route("/add/v/playlist/:playlistId/:videoId").post(AuthMiddleware, AddVideosToPlaylist)
router.route("/delete/v/playlist/:playlistId/:videoId").delete(AuthMiddleware, RemoveVideoFromPlaylist)
router.route("/delete-playlist/:playlistId").delete(AuthMiddleware, DeletePlaylist)
router.route("/get-playlists/:userId").get(AuthMiddleware, GetUserPlaylists)
router.route("/get-playlist-by-id/:playlistId").get(AuthMiddleware, GetPlaylistById)


export {router}