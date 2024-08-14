const express = require("express");



User = require("./users.model")
const { registerUser, loginUser, updateUser, deleteUser, getAllUsers, getUser } = require("./users.authenticate");


const userRouter = function (parentRoute = "") {
const router = express.Router();
const { authorizeAdmin, authorizeBasic} = require("./users.authorize")

// api
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

router.route("/update").put(authorizeAdmin, updateUser);
router.route("/delete").delete(authorizeAdmin, deleteUser);

router.route("/all").get(getAllUsers);
router.route("/me").get(authorizeBasic,
  // unauthorized users 401
  (req, res) => {
    if (req.body.authorized) {
      res.send(req.body.user);
    } else {
      res.status(401).json({ message: "Not authorized" });
    }
  },
  getUser);


// views

router.route("/home").get((req, res) => res.render("home"));
router.route("/register").get((req, res) => res.render("register"));
router.route("/login").get((req, res) => res.render("login"));
router.route("/logout").get((req, res) => {
  res.cookie("jwt", "", { maxAge: "1" });
  // get url query string
  const target = req.query.targeturl;
  res.redirect(parentRoute+"/user/login?targeturl=" + target);
});

return router;

}
module.exports = userRouter;