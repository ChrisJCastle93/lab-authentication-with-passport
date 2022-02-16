require("dotenv").config();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const favicon = require("serve-favicon");
const hbs = require("hbs");
const mongoose = require("mongoose");
const logger = require("morgan");
const path = require("path");
const MongoStore = require("connect-mongo");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require('./models/User.model')
const bcrypt = require('bcrypt')

const MONGODB_URI = "mongodb://127.0.0.1/lab-auth-with-passport";

// Connection to the database "recipe-app"
mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((x) => {
    console.log(`Connected to the database: "${x.connection.name}"`);
  })
  .catch((error) => {
    console.error("Error connecting to the database", error);
  });

const app_name = require("./package.json").name;
const debug = require("debug")(
  `${app_name}:${path.basename(__filename).split(".")[0]}`
);

const app = express();

// Middleware Setup
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set("trust proxy", 1); // trust first proxy
app.use(
  session({
    secret: "keyboard cat",
    resave: true,
    saveUninitialized: false,
    cookie: { secure: false },
    store: MongoStore.create({
      mongoUrl: MONGODB_URI,
    }),
  })
);

// IMPORTANT!! Before the passport.initialize

passport.serializeUser((user, cb) => cb(null, user._id));

passport.deserializeUser((id, cb) => {
  User.findById(id)
    .then((user) => cb(null, user))
    .catch((err) => cb(err));
});

passport.use(
  new LocalStrategy(
    {
      passReqToCallback: true,
      usernameField: "username",
      passwordField: "password",
    },
    function (req, username, password, done) {
      User.findOne({ username }).then((user) => {
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }

        if (
          !bcrypt.compare(password, user.password, function (err, result) {
            return "message: Incorrect password";
          })
        )
          return done(null, user);
      });
    }
  )
);

app.use(passport.initialize());
app.use(passport.session());

// Express View engine setup

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));

// default value for title local
app.locals.title = "Express - Generated with IronGenerator";

// Routes middleware goes here
const index = require("./routes/index.routes");
app.use("/", index);
const authRoutes = require("./routes/auth.routes");
app.use("/", authRoutes);

module.exports = app;
