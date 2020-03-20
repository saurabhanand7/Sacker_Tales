var mongoose = require("mongoose");

var commentsSchema = mongoose.Schema({
    text: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    rating: {
        type: Number,
        min: [1, "Error while updating rating to the campground!"],
        max: [5, "Error while updating rating to the campground!"]
    },
    author: {
        id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        name: String
    }
});


module.exports = mongoose.model("Comments", commentsSchema);