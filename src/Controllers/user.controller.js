import { AsyncHandler } from "../Utils/AsyncHandler.js";
import { ApiError } from '../Utils/ApiError.js'
import { User } from '../Models/users.model.js'
import { uploadoncloudinary } from "../Utils/Cloudinary.js";
import { ApiResponse } from "../Utils/ApiResponse.js";



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
    console.log(req)
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
    const CoverImageLocalPath = req.files?.coverimage[0]?.path;

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

export { RegisterUser }