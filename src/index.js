import mongoose from "mongoose";
import DBconnect from "./DataBase/DBconnection.js";
import dotenv from 'dotenv'
import express from "express"
import {app} from './app.js'



dotenv.config({
    path: './env'
})

DBconnect().then((response) => {
    app.listen(process.env.PORT, () => {
        console.log("App listening at port::", process.env.PORT)
    })
}
).catch((error) => {
    console.log("MongoDB connection falied !!")

    

    }
)