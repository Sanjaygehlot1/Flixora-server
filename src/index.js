import mongoose from "mongoose";
import DBconnect from "./DataBase/DBconnection.js";
import dotenv from 'dotenv'

dotenv.config({
    path: './env'
})

DBconnect()