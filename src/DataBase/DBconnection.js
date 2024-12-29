import mongoose from "mongoose";
import { DB_name } from '../constants.js'

const DBconnect = async () => {
    try {
        const connectionobj = await mongoose.connect(`${process.env.URI}/${DB_name}`)
        console.log("\n MongoDB Connected Successfully, HOST ::", connectionobj.connection.host)
    } catch (error) {
        console.log("Error in DBconnect::", error)
        process.exit(1)
    }
}

export default DBconnect