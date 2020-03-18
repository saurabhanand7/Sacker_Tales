var express = require("express");
var router = express.Router();
var passport = require("passport");
var User = require("../models/user");
var ejs = require("ejs");
var async = require("async");
// var nodemailer = require("nodemailer");
var crypto = require("crypto");
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);




router.get("/register", function (req, res) {
    res.render("register", {
        title: "Sign Up Page"
    });
});

router.post("/register", function (req, res) {
    var newUser = new User({
        email: req.body.email,
        name: req.body.name
    });
    if (req.body.adminCode === process.env.ADMIN_CODE) {
        newUser.isAdmin = true;
    }
    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            req.flash("error", err.message);
            res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function () {
            req.flash("success", "Welcome to Sacker Tales " + req.body.name + " !");
            res.redirect("/");
        });
    });
});

router.get("/login", function (req, res) {
    res.render("login", {
        title: "Login Page"
    });
});

router.post(
    "/login",
    passport.authenticate("local", {

        successRedirect: "/",
        successFlash: "Welcome back to Sacker Tales !",
        failureRedirect: "/login",
        failureFlash: true
    }),
    function (req, res) {}
);

router.get("/logout", function (req, res) {
    req.logout();
    req.flash("success", "Logged You Out !");
    res.redirect("/");
});

// forgot password
router.get('/forgot', function (req, res) {
    res.render('forgot', {
        title: "Forgot password"
    });
});

router.post('/forgot', function (req, res, next) {
    async.waterfall([
        function (done) {
            crypto.randomBytes(20, function (err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function (token, done) {
            User.findOne({
                email: req.body.email
            }, function (err, user) {
                if (!user) {
                    req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function (err) {
                    done(err, token, user);
                });
            });
        },


        //==============HTML Email====================
        // async function (token, user, done) {
        //     var msg;
        //     try {
        //         var url = "http://" + req.headers.host + "/reset/" + token;
        //         // var htmlTemplate = Promise.resolve(ejs.renderFile(__dirname + "/forgetPassword.ejs", {user: {name: user.name}, url: url}));
        //         // var htmlTemplate = async function (err){ htmlTemplate = await ejs.renderFile(__dirname + "/forgetPassword.ejs", {user: {name: user.name}, url: url})};

        //         var htmlTemplate = await ejs.renderFile(__dirname + "/forgetPassword.ejs", {
        //             user: {
        //                 name: user.name
        //             },
        //             url: url
        //         });
        //         msg = {
        //             to: user.email,
        //             from: 'madyanand77@gmail.com',
        //             subject: 'Sacker Tales Password Reset',
        //             // text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
        //             //     'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
        //             //     'http://' + req.headers.host + '/reset/' + token + '\n\n' +
        //             //     'If you did not request this, please ignore this email and your password will remain unchanged.\n',
        //             html: htmlTemplate,
        //         };
        //     } catch (err) {
        //         req.flash("error", err.message + ". Please try after some time");
        //         return res.redirect("/forgot");
        //     }
        //     sgMail.send(msg, function (err) {
        //         console.log('mail sent');
        //         req.flash('success', 'An Email has been sent to ' + user.email + ' with further instructions.');
        //         //   done(err, 'done');
        //         // res.redirect('/forgot');
        //     });
        // }


        //============= Text Email=====================
        function (token, user, done) {
            var msg;
            try {
                msg = {
                    to: user.email,
                    from: 'madyanand77@gmail.com',
                    subject: 'Sacker Tales Password Reset',
                    text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                        'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                        'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                        'If you did not request this, please ignore this email and your password will remain unchanged.\n'
                };
            } catch (err) {
                req.flash("error", err.message + ". Please try after some time");
                return res.redirect("/forgot");
            }
            sgMail.send(msg, function (err) {
                console.log('mail sent');
                req.flash('success', 'An Email has been sent to ' + user.email + ' with further instructions.');
                done(err, 'done');
            });
        }


        //===========================Node Mailer=================================
        // function (token, user, done) {
        //     var smtpTransport = nodemailer.createTransport({
        //         service: 'gmail',
        //         auth: {
        //             user: 'madyanand77',
        //             pass: process.env.MAIL_PASS
        //         }
        //     });
        //     var mailOptions = {
        //         to: user.email,
        //         from: 'madyanand77@gmail.com',
        //         subject: 'Sacker Tales Password Reset',
        //         text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
        //             'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
        //             'http://' + req.headers.host + '/reset/' + token + '\n\n' +
        //             'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        //     };
        //     smtpTransport.sendMail(mailOptions, function (err) {
        //         console.log('mail sent');
        //         req.flash('success', 'An Email has been sent to ' + user.email + ' with further instructions.');
        //         done(err, 'done');
        //     });
        // }
    ], function (err) {
        if (err) return next(err);
        res.redirect('/forgot');
    });
});

router.get('/reset/:token', function (req, res) {
    User.findOne({
        resetPasswordToken: req.params.token,
        resetPasswordExpires: {
            $gt: Date.now()
        }
    }, function (err, user) {
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }
        res.render('reset', {
            token: req.params.token,
            title: "Reset Password"
        });
    });
});

router.post('/reset/:token', function (req, res) {
    async.waterfall([
        function (done) {
            User.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: {
                    $gt: Date.now()
                }
            }, function (err, user) {
                if (!user) {
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('back');
                }
                if (req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, function (err) {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;

                        user.save(function (err) {
                            req.logIn(user, function (err) {
                                done(err, user);
                            });
                        });
                    })
                } else {
                    req.flash("error", "Passwords do not match.");
                    return res.redirect('back');
                }
            });
        },


        function (user, done) {
            const msg = {
                to: user.email,
                from: 'madyanand77@gmail.com',
                subject: 'Your password has been changed',
                text: 'Hello,\n\n' +
                    'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n',
                // html: '<strong>and easy to do anywhere, even with Node.js</strong>',
            };
            sgMail.send(msg, function (err) {

                req.flash('success', 'Success! Your password has been changed.');
                done(err);
            });
        }


        // function (user, done) {
        //     var smtpTransport = nodemailer.createTransport({
        //         service: 'Gmail',
        //         auth: {
        //             user: 'madyanand77@gmail.com',
        //             pass: process.env.MAIL_PASS
        //         }
        //     });
        //     var mailOptions = {
        //         to: user.email,
        //         from: 'madyanand77@gmail.com',
        //         subject: 'Your password has been changed',
        //         text: 'Hello,\n\n' +
        //             'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        //     };
        //     smtpTransport.sendMail(mailOptions, function (err) {
        //         req.flash('success', 'Success! Your password has been changed.');
        //         done(err);
        //     });
        // }
    ], function (err) {
        res.redirect('/');
    });
});

module.exports = router;