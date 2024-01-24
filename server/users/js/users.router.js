const express = require("express");
const router = express.Router();


User = require("./users.model")
const { registerUser, loginUser, updateUser, deleteUser, getAllUsers, getUser } = require("./users.authenticate");
const { authorizeAdmin, authorizeBasic} = require("./users.authorize");


// api
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

router.route("/update").put(authorizeAdmin, updateUser);
router.route("/delete").delete(authorizeAdmin, deleteUser);

router.route("/all").get(getAllUsers);
router.route("/me").get(authorizeBasic, getUser);


// views

router.route("/home").get((req, res) => res.render("home"));
router.route("/register").get((req, res) => res.render("register"));
router.route("/login").get((req, res) => res.render("login"));
router.route("/logout").get((req, res) => {
  res.cookie("jwt", "", { maxAge: "1" });
  // get url query string
  const target = req.query.targeturl;
  res.redirect("/user/login?targeturl=" + target);
});
router.route("/admin").get(authorizeAdmin, (req, res) => res.render("admin"));
router.route("/basic").get(authorizeBasic, (req, res) => res.render("userpage"));

module.exports = router;