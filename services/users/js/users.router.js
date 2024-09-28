const express = require("express");

const User = require("./users.model")
const { registerUser, loginUser, updateUser, deleteUser, getAllUsers, getUser } = require("./users.authenticate");
const { auth, authorizeAdmin, authorizeBasic} = require("./users.authorize")


const router = express.Router();

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);

router.route("/update").put(authorizeAdmin, updateUser);
router.route("/delete").delete(authorizeAdmin, deleteUser);

router.route("/all").get(getAllUsers);
router.route("/me").get(authorizeBasic,
  // unauthorized users 401
  (req, res) => {
    console.log('route, req.body', req.body);
    if (req.body.authorized) {
      res.send(req.body.user);
    } else {
      res.status(401).json({ message: "Not authorized" });
    }
  },
  getUser);

  // authorize route
  router.route('/authorize/:role').get((req,res, next)=>{
    req.authorizedRoles = [req.params.role];
    next();
  },auth, (req, res) => {
    if (req.body.authorized) {
      res.status(200).json({
        success: true,
        message: 'You are authorized!',
        user: req.body.user, // You can send back user info if needed

      });
    } else {
      res.status(401).json({
        success: false,
        message: 'You are not authorized!',
      });
    }
  });

// views

router.route("/home").get((req, res) => res.render("home"));
router.route("/register").get((req, res) => res.render("register"));
router.route("/login").get((req, res) => res.render("login"));
router.route("/logout").get((req, res) => {
  res.cookie("jwt", "", { maxAge: "1" });
  
  const target = req.query.targeturl;
  // login page allows to redirect to a target url
  // i.e. user originally wanted to go to 'targeturl' but needs to login first,
  // then the login page will redirect themto 'targeturl'
  res.redirect("./login?targeturl=" + target);
});


module.exports = router;