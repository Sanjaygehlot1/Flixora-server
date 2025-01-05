import mongoose,{Schema} from "mongoose";

const TweetSchema = new Schema({
    content:{
        type:String,
        required:true
    },
    image:{
        type:{
            url:String,
            public_id: String // in case of deletion of image from cloudinary
        },
        required: false

    },
    owner:{
        type:Schema.Types.ObjectId,
        ref: "User"
    }

},{
    timestamps:true
})

export const Tweet = mongoose.model("Tweet",TweetSchema)