const express = require("express");
const fs = require("fs");
const router = express.Router();
const multer = require("multer");
const tales = require("../models/tales");
const middleware = require("../middleware");

const storage = multer.diskStorage({
    filename: (req, file, cb) => {
        cb(null, new Date().toISOString().replace(/:\s*/g, "_") + file.originalname)
    }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({
    storage: storage,
    fileFilter: imageFilter
});

var cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: 'sacker',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

router.get("/", function (req, res) {
    tales.find({}, function (err, alltales) {
        if (err) {
            console.log(err);
        } else {
            res.render("category/sackertales", {
                tales: alltales
            });
        }
    });
});


router.post("/category/sackertales", middleware.isLoggedIn, upload.single('imgName'), function (req, res) {

    if (req.file) {
        cloudinary.v2.uploader.upload(req.file.path, function (err, result) {
            if (err) {
                req.flash('error', err.message);
                return res.redirect('back');
            }
            const name = req.body.name;
            const description = req.body.description;
            // add cloudinary url for the image to the campground object under image property

            // add image's public_id to campground object

            // add author to campground
            const author = {
                id: req.user._id,
                email: req.user.email
            }
            const newtales = {
                name: name,
                imageId: result.public_id,
                image: result.secure_url,
                description: description,
                author: author
            };
            tales.create(newtales, function (err, newlytales) {
                if (err) {
                    console.log(err);
                    req.flash('error', err.message);
                    return res.redirect('back');
                }
                req.flash("success", "Tale Added !");
                res.redirect('/');
            });
        });
    } else {
        req.flash("error", "Image Not Found !");
        res.redirect("/category/new");

    }
});


router.get("/category/sackertales/new", middleware.isLoggedIn, function (req, res) {
    res.render("./category/new");
});

router.get("/category/sackertales/:id", function (req, res) {
    tales
        .findById(req.params.id)
        .populate("comments")
        .exec(function (err, foundtales) {
            if (err) {
                console.log(err);
            } else {
                res.render("./category/show", {
                    tales: foundtales
                });
            }
        });
});

router.get("/category/sackertales/:id/edit", middleware.checkOwnership, function (req, res) {
    tales.findById(req.params.id, function (err, foundtales) {
        if (err) {
            res.render("back");
        } else {
            res.render("category/edit", {
                tales: foundtales
            });
        }

    });
});

router.put("/category/sackertales/:id", middleware.checkOwnership, upload.single("imgName"), async function (req, res) {
    const data = {
        name: req.body.name,
        description: req.body.description
    }
    if (req.file) {
        try {
            const talesDetails = await tales.findById(req.params.id);
            await cloudinary.v2.uploader.destroy(talesDetails.imageId);
            const result = await cloudinary.v2.uploader.upload(req.file.path);
            data.imageId = result.public_id;
            data.image = result.secure_url;

        } catch (err) {
            req.flash("error", err.message);
            res.redirect("/");
        }
    }
    tales.findByIdAndUpdate(req.params.id, data, function (err, updatedFile) {
        if (err) {
            res.redirect("/");
        } else {
            req.flash("success", "Tale Edited !");
            res.redirect("/category/sackertales/" + req.params.id);
        }
    });
});

router.delete("/category/sackertales/:id", middleware.checkOwnership, async function (req, res) {

    try {
        const talesDetails = await tales.findById(req.params.id);
        await cloudinary.v2.uploader.destroy(talesDetails.imageId);
        tales.findByIdAndRemove(req.params.id, function (err) {
            req.flash("success", "Tale Deleted !");
            res.redirect("/");
        });
    } catch (err) {
        if (err) {
            req.flash("error", err.message);
            res.redirect("/");
        }
    }
});




module.exports = router;