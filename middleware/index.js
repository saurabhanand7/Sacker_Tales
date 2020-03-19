var tales = require("../models/tales");
var comments = require("../models/comments");
var middlewareObj = {};

middlewareObj.checkOwnership = function (req, res, next) {
    if (req.isAuthenticated()) {
        tales.findById(req.params.id, function (err, foundtales) {
            if (err || !foundtales) {
                req.flash("error", "Tale not Found !");
                res.redirect("back");
            } else {
                if (foundtales.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You don't have Permission to do that !");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You Need to be Logged in to do that !");
        res.redirect("back");
    }
}

middlewareObj.checkCommOwnership = function (req, res, next) {
    if (req.isAuthenticated()) {
        comments.findById(req.params.comments_id, function (err, foundComments) {
            if (err || !foundComments) {
                req.flash("error", "Comment Not Found !");
                res.redirect("back");
            } else {
                if (foundComments.author.id.equals(req.user._id) || req.user.isAdmin) {
                    next();
                } else {
                    req.flash("error", "You don't have Permission to do that !");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You Need to be Logged in to do that !");
        res.redirect("back");
    }
}

middlewareObj.isLoggedIn = function (req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash("error", "You Need to be Logged in to do that !");
    res.redirect("/login");
}



module.exports = middlewareObj