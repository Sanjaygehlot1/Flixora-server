import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const VideoSchema = new Schema({
    videoFile:{
        type: String,
        required:true,
        trim:true
    }, 
    thumbnail:{
        type: String,
        required:true,
        trim:true
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref:"User",
       
    },
    title:{
        type: String,
        required:true,
        trim:true
    },
    description:{
        type: String,
        required: true,
        trim: true,

    },
    duration:{
        type: Number,

    },
    views:{
        type: Number,
        default : 0
    },
    isPublished:{
        type: Boolean,
        default: true
    }

  } ,{
    timestamps:true
  })

VideoSchema.plugin(mongooseAggregatePaginate)
export const Video = mongoose.model("Video",VideoSchema)