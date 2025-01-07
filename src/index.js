import DBconnect from "./DataBase/DBconnection.js";
import dotenv from 'dotenv'
import { app } from './app.js'



dotenv.config({
    path: './env'
})

DBconnect().then(() => {
    app.listen(process.env.PORT, () => {
        console.log("App listening at port::", process.env.PORT)
        console.log( process.env.CORS_ORIGIN)
    })
}
).catch((error) => {
    console.log("MongoDB connection falied !!", error)



}
)