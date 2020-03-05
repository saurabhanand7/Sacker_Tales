var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    name: String,
    password: String,
    email: {type: String, unique: true, required: true},
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    isAdmin: {type:Boolean, default: false}
});

UserSchema.plugin(passportLocalMongoose, { usernameField : 'email' });
module.exports = mongoose.model("User", UserSchema);