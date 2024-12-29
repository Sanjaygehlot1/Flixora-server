import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken"
const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        index: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    fullname: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    avatar: {
        type: String,
        required: true
    },
    coverimage: {
        type: String
    },
    password: {
        type: String,
        required: [true, "Password is Required"],

    },
    refreshToken: {
        type: String
    },
    watchHistory: {
        type: Schema.Types.ObjectId,
        ref: "Video"
    }
}, {
    timestamps: true
})


UserSchema.pre("save", async function (next) {
    if (!this.IsModified(this.password)) return next();

    this.password = bcrypt.hash(this.password, 10)
    next()
})

UserSchema.methods.IsPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

UserSchema.methods.generateAccessToken = async function () {
   return jwt.sign({
        _id: this._id,
        email: this.email,
        fullname: this.fullname,
        username: this.username
    },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        })
}
UserSchema.methods.generateRefreshToken = async function () { 
   return jwt.sign({
        _id: this._id
    },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        })
}

export const User = mongoose.model("User", UserSchema)