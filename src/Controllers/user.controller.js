import { AsyncHandler } from "../Utils/AsyncHandler.js";
import { ApiError } from '../Utils/ApiError.js'
import { User } from '../Models/users.model.js'
import { uploadoncloudinary } from "../Utils/Cloudinary.js";
import { ApiResponse } from "../Utils/ApiResponse.js";
import jwt from 'jsonwebtoken'
import mongoose from "mongoose";


const RegisterUser = AsyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

    const { fullname, email, password, username } = req.body
    // console.log(req.body)
    if ([fullname, email, password, username].some((value) => value?.trim() === "")) {
        throw new ApiError(400, "All Fields are required!!")
    }

    const existingUser = await User.findOne({
        $or: [{ username }, { email }]
    })
    if (existingUser) {
        throw new ApiError(409, "User already Exist. Please try with another email or username")
    }

    const AvatarLocalPath = req.files?.avatar[0]?.path;
    // const CoverImageLocalPath = req.files?.coverimage[0]?.path;

    let CoverImageLocalPath;
    if (req.files.coverimage && Array.isArray(req.files.coverimage) && req.files.coverimage.length > 0) {
        CoverImageLocalPath = req.files.coverimage[0].path
    }


    // console.log(req.files)
    if (!AvatarLocalPath) {
        throw new ApiError(400, "Avatar is Required")
    }
    const Avatar = await uploadoncloudinary(AvatarLocalPath)
    const CoverImage = await uploadoncloudinary(CoverImageLocalPath)

    if (!Avatar) {
        throw new ApiError(400, "Avatar is Required!!")
    }

    const userdata = await User.create({
        fullname,
        avatar: Avatar.url,
        coverimage: CoverImage?.url || null,
        password,
        email,
        username: username.toLowerCase()
    })

    const createduser = await User.findById(userdata._id).select("-password -refreshToken")

    if (!createduser) {
        throw new ApiError(500, "Something Went Wrong while registering user")
    }

    return res.status(201).json(
        new ApiResponse(200, createduser, "User Registered Successfully")
    )

})

const GenerateRefreshAndAccessToken = async (UserId) => {
    try {
        const user = await User.findById(UserId)

        if (!user) {
            throw new ApiError(401, "No User Found")
        }

        const AccessToken = await user.generateAccessToken()
        const RefreshToken = await user.generateRefreshToken()

        // console.log("AccessToken::",AccessToken)
        // console.log("RefreshToken::",RefreshToken)

        user.refreshToken = RefreshToken
        await user.save({ ValidateBeforeSave: true })

        return { AccessToken, RefreshToken }
    } catch (error) {
        throw new ApiError(500, "Error while generating refresh or access token")
    }
}


const LoginUser = AsyncHandler(async (req, res) => {

    // data from req.body
    //check if empty - username email
    //find user data in db
    //check if pass is correct
    //access and refresh token
    //remove pass and refresh token from data
    //send the response and login 


    const { username, email, password } = req.body

    if (!(username || email)) {
        throw new ApiError(400, "Username or Email is required")
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    })
    // console.log("User::",user)

    if (!user) {
        throw new ApiError(400, "User not found")
    }

    const IsPassCorrect = await user.IsPasswordCorrect(password)

    if (!IsPassCorrect) {
        throw new ApiError(401, "Invalid User Credentials")
    }

    const { AccessToken, RefreshToken } = await GenerateRefreshAndAccessToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        Httponly: true,
        secure: true
    }

    return res.status(200).cookie("accessToken", AccessToken, options).cookie("refreshToken", RefreshToken, options).json(
        new ApiResponse(200,
            {
                user: loggedInUser, AccessToken, RefreshToken
            },
            "User Logged In Successfully"
        )
    )

})

const LogOutUser = AsyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    console.log(user)

    const options = {
        httponly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User Logged Out Successfully")
        )

})

const GetNewAccessToken = AsyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Access")
    }

    try {
        const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        if (!decodedRefreshToken) {
            throw new ApiError(401, "Refresh token invalid")
        }

        const user = await User.findById(decodedRefreshToken._id)

        if (!user) {
            throw new ApiError(404, "User Not Found")
        }

        const { AccessToken, newRefreshToken } = await GenerateRefreshAndAccessToken(user._id)

        return res
            .status(200)
            .cookie("accessToken", AccessToken)
            .cookie("refreshToken", newRefreshToken)
            .json(
                new ApiResponse(
                    200,
                    {
                        AccessToken,
                        refreshToken: newRefreshToken
                    },
                    "New Access Token Fetched")
            )

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }

})

const ChangeCurrentPassword = AsyncHandler(async (req, res) => {

    const { oldpassword, newpassword } = req.body

    if (!newpassword || !oldpassword) {
        throw new ApiError(400, "All fields are Required")
    }


    const user = await User.findById(req.user?._id)
    if (!user) {
        throw new ApiError(401, "Unauthorized Access")
    }

    const ispassCorrect = await user.IsPasswordCorrect(oldpassword)
    console.log(ispassCorrect)
    if (!ispassCorrect) {
        throw new ApiError(401, "Old Password is Incorrect")
    }

    user.password = newpassword;
    await user.save({ ValidateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            newpassword,
            "Password Changed Successfully"

        ))

})

const GetCurrentUser = AsyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(
            200,
            req.user,
            "User Fetched Successfully"
        ))
})

const UpdateUserDetails = AsyncHandler(async (req, res) => {
    const { fullname, email } = req.body

    if (fullname === "" || email === "") {
        throw new ApiError(401, "All Fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname: fullname,
                email: email
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            "User Details Updated Successfully"
        ))

})

const UpdateAvatar = AsyncHandler(async (req, res) => {
    const AvatarLocalPath = req.file?.path

    if (!AvatarLocalPath) {
        throw new ApiError(400, "Avatar File is Missing")
    }

    const Avatar = await uploadoncloudinary(AvatarLocalPath)

    if (!Avatar.url) {
        throw new ApiError(400, "Error while Uploading Avatar on Cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: Avatar.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            "Avatar Updated Successfully"
        ))
})
const UpdateCoverImage = AsyncHandler(async (req, res) => {
    const CoverImageLocalPath = req.file?.path

    if (!CoverImageLocalPath) {
        throw new ApiError(400, "CoverImage File is Missing")
    }

    const CoverImage = await uploadoncloudinary(CoverImageLocalPath)

    if (!CoverImage.url) {
        throw new ApiError(400, "Error while Uploading CoverImage on Cloudinary")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverimage: CoverImage.url
            }
        },
        {
            new: true
        }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            user,
            "CoverImage Updated Successfully"
        ))
})

const GetChannelDetails =AsyncHandler(async (req,res)=>{
    const {username} = req.params

    if(!username.trim()){
        throw new ApiError(401, "Invalid Username")
    }

    const channel =await  User.aggregate([
        {
            $match:{
                username: username
            }
        },
        {
           $lookup:{
            from: "subscriptions",// Subscription model becomes subscriptions in database
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
           } 
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                subscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if: {$in:[new mongoose.Types.ObjectId(req.user?._id),"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
         $project:{
            fullname:1,
            email:1,
            isSubscribed:1,
            subscribedToCount:1,
            subscribersCount:1,
            avatar:1,
            coverimage:1
         }   
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        channel,
        "Channel details fetched Successfully"
    ))

})

export {
    RegisterUser,
    LoginUser,
    LogOutUser,
    GetNewAccessToken,
    ChangeCurrentPassword,
    UpdateUserDetails,
    GetCurrentUser,
    UpdateAvatar,
    UpdateCoverImage,
    GetChannelDetails
}