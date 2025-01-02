import { AsyncHandler } from "../Utils/AsyncHandler";
import { ApiResponse } from "../Utils/ApiResponse";
import { ApiError } from "../Utils/ApiError";

const HealthCheck = AsyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Everything is within the flow!!"
    ))
})

export {HealthCheck}