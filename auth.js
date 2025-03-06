const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const mysql = require("mysql2");
const { google } = require("googleapis");  // Required for OAuth2
require("dotenv").config();

// MySQL Database Connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: 3306, 
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect(err => {
    if (err) throw err;
    console.log("MySQL Connected");
});

// Initialize OAuth2 client
const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost:5000/auth/google/callback"
);

// Listen for tokens and log them
auth.on("tokens", (tokens) => {
    process.env.GOOGLE_REFRESH_TOKEN = tokens.refresh_token
    
});

// Google OAuth Strategy
passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "http://localhost:5000/auth/google/callback",
            scope: [
                "profile",
                "email",
                "https://www.googleapis.com/auth/userinfo.email",
                "https://www.googleapis.com/auth/drive.file",
                "https://www.googleapis.com/auth/drive"
            ],
            accessType: "online", // Important: Needed to get a refresh token
            prompt: "consent",
        },
        async (accessToken, refreshToken, profile, done) => {
           
            process.env.GOOGLE_REFRESH_TOKEN = refreshToken

            
           

            try {
                // Check if user exists in DB
                db.query(
                    "SELECT * FROM users WHERE googleId = ?",
                    [profile.id],
                    (err, results) => {
                        if (err) return done(err);

                        if (results.length > 0) {
                            return done(null, results[0]); // User found
                        } else {
                            // Insert new user
                            db.query(
                                "INSERT INTO users (googleId, name, email) VALUES (?, ?, ?)",
                                [profile.id, profile.displayName, profile.emails[0].value],
                                (err, result) => {
                                    if (err) return done(err);

                                    // Fetch the newly inserted user
                                    db.query(
                                        "SELECT * FROM users WHERE googleId = ?",
                                        [profile.id],
                                        (err, newUser) => {
                                            if (err) return done(err);
                                            return done(null, newUser[0]);
                                        }
                                    );
                                }
                            );
                        }
                    }
                );
            } catch (error) {
                return done(error, null);
            }
        }
    )
);

// Serialize user to session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser((id, done) => {
    db.query("SELECT * FROM users WHERE id = ?", [id], (err, results) => {
        if (err) return done(err);
        return done(null, results[0]);
    });
});

module.exports = passport;
