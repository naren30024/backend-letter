require("dotenv").config();
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { uploadLetter } = require("./drive");
require("./auth");

const app = express();
app.use((req, res, next) => {
  res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self' 'unsafe-inline' https://accounts.google.com"
  );
  next();
});
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(cookieParser());


app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Routes
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.cookie("token", token, { httpOnly: true });
    res.redirect("http://localhost:3000/Letter");
  }
);


app.get("/auth/logout", (req, res, next) => {
  req.logout((err) => {
      if (err) {
          return next(err);
      }
      req.session.destroy((err) => {
          if (err) {
              console.error("Session destruction error:", err);
          }
          res.clearCookie("connect.sid"); // Clear session cookie (if using express-session)
          res.clearCookie("token"); // Clear authentication token (if stored in cookies)
          res.redirect("http://localhost:3000");
      });
  });
});

app.post("/letters/upload", uploadLetter)


app.listen(5000, () => console.log("Server running on port 5000"));
