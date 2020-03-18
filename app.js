const express = require("express"),
  app = express(),
  bodyParser = require("body-parser"),
  mongoose = require("mongoose"),
  flash = require("connect-flash"),
  methodOverride = require("method-override"),
  tales = require("./models/tales"),
  comments = require("./models/comments"),

  passport = require("passport"),
  User = require("./models/user"),
  multer = require("multer"),
  LocalStrategy = require("passport-local");
require("dotenv").config();


const commentsRoutes = require("./routes/comments"),
  categoryRoutes = require("./routes/category"),
  indexRoutes = require("./routes/index");

mongoose.connect(process.env.DATABASE_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});





app.use(
  bodyParser.urlencoded({
    extended: true
  })
);
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.locals.rmWhitespace = true;
mongoose.set("useFindAndModify", false);
mongoose.set("useCreateIndex", true);

app.use(express.static("public"));
app.use(
  require("express-session")({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
  })
);

// app.use("/uploads", express.static("uploads"));
app.locals.moment = require("moment");
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());
// passport.use(User.createStrategy());
passport.use(new LocalStrategy({
  usernameField: 'email',
  passReqToCallBack: true
}, User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(flash());

app.use((req, res, next) => {
	res.set(
		"Cache-Control",
		"no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
	);
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});



app.use(indexRoutes);
app.use(categoryRoutes);
app.use(commentsRoutes);


app.use((req, res, next) => {
	res.status(404).render("404", { title: "404: Page not found!" });
});
app.use((err, req, res, next) => {
	res.status(err.status || 500).render("500", {
		title: (err.status || 500) + ": encountered an error",
		err: err
	});
});


app.listen(3000 || process.env.PORT, process.env.IP, function () {
  console.log("Tales server has Started !");
});