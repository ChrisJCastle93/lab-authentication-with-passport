const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const bcrypt = require("bcrypt");
const saltRounds = 10;

router.get("/signup", (req, res) => res.render("auth/signup"));
router.get("/login", (req, res) => res.render("auth/login"));

router.post("/signup", (req, res, next) => {
  const { username, password } = req.body;
  bcrypt
    .genSalt(saltRounds)
    .then((salt) => {
      return bcrypt.hash(password, salt);
    })
    .then((hash) => {
      const hashPass = hash;
      return hashPass;
    })
    .then((hashPass) => {
      return User.create({
        username: username,
        password: hashPass,
      });
    })
    .then((response) => {
      res.redirect("/");
      console.log("NEW USER CREATED", response);
    })
    .catch((err) => console.log(err));
});

// Add bcrypt to encrypt passwords

router.post("/login", (req, res, next) => {
  const { username, password } = req.body;
  User.findOne({ username })
    .then((user) => {
      console.log('finding user')
      if (!user) {
        console.log('no user found')
        res.render("auth/login", {
          errorMessage: "Email is not registered. Try with other email.",
        });
        return;
      } else if (bcrypt.compareSync(password, user.password)) {
        console.log('found user, password match')
        req.session.currentUser = user;
        console.log(req.session)
        res.render("auth/private", { user });
      } else {
        console.log('found user, password match')
        res.render("auth/login", { errorMessage: "Incorrect password." });
      }
    })
    .catch((error) => next(error));
});

// Add passport

const ensureLogin = require("connect-ensure-login");

router.get("/private-page", ensureLogin.ensureLoggedIn(), (req, res) => {
  res.render("passport/private", { user: req.user });
});

module.exports = router;
