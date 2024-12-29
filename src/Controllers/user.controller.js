import { AsyncHandler } from "../Utils/AsyncHandler.js";

const RegisterUser = AsyncHandler(async (req,res)=>{
    res.status(200).json({
        message: "OK!!"
    })
})

export  {RegisterUser}