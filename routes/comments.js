var express = require("express");
var router = express.Router();
var tales = require("../models/tales");
var comments = require("../models/comments");
var middleware = require("../middleware");

router.get("/category/sackertales/:id/comments/new", middleware.isLoggedIn, function (req, res) {
    tales.findById(req.params.id, function (err, tales) {
        if (err) {
            console.log(err);
            next(err);
        } else {
            res.render("comments/new", {
                tales: tales,
                title: "New Comment" 
            });
        }
    });
});

router.post("/category/sackertales/:id/comments", middleware.isLoggedIn, function (req, res) {
    tales.findById(req.params.id, function (err, tales) {
        if (err) {
            console.log(err);
            req.flash("error", "Tale Not Found !");
            res.redirect("/");
        } else {
            comments.create(req.body.comments, function (err, comments) {
                if (err) {
                    console.log(err);
                } else {
                    comments.author.id = req.user._id;
                    comments.author.username = req.user.username;
                    comments.save();
                    tales.comments.push(comments);
                    tales.save();
                    req.flash("success", "Comment Added !");
                    res.redirect("/category/sackertales/" + tales._id);
                }
            });
        }
    });
});

router.get("/category/sackertales/:id/comments/:comments_id/edit", middleware.checkCommOwnership, function (req, res) {
    comments.findById(req.params.comments_id, function (err, foundComments) {
        if (err) {
            req.flash("error", "Comment Not Found !");
            res.redirect("back");
        } else {
            res.render("comments/edit", {
                tales_id: req.params.id,
                comments: foundComments,
                title: "Edit Comment"
            });
        }
    });
});

router.put("/category/sackertales/:id/comments/:comments_id", middleware.checkCommOwnership, function (req, res) {
    comments.findByIdAndUpdate(req.params.comments_id, req.body.comments, function (err, updatedFile) {
        if (err) {
            req.flash("error", "Comment Not Found !");
            res.redirect("back");
        } else {
            req.flash("success", "Comment Edited !");
            res.redirect("/category/sackertales/" + req.params.id);
        }
    });
});

router.delete("/category/sackertales/:id/comments/:comments_id", middleware.checkCommOwnership, function (req, res) {
    comments.findByIdAndRemove(req.params.comments_id, function (err) {
        if (err) {
            req.flash("error", "Comment Not Found !");
            res.redirect("back");
        } else {
            req.flash("success", "Comment Deleted !");
            res.redirect("/category/sackertales/" + req.params.id);
        }
    });
});



module.exports = router;