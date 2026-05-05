//how login actually works
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/User";


console.log("GOOGLE_CLIENT_ID from passport.ts:", process.env.GOOGLE_CLIENT_ID);

//What do we remember? 
//do NOT store the whole user in the session
//You store only a small identifier
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

//Who is this user?
//Server gets userId from session
//Fetch full user from database
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/auth/google/callback",    //tells Google where to send the user back
    },
    async (_accessToken, _refreshToken, profile, done) => {
      //Check if user already exists
      const existing = await User.findOne({ googleId: profile.id });
      if (existing) return done(null, existing);

      //Create new user if needed
      const user = await User.create({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails?.[0].value,
        avatar: profile.photos?.[0].value,
      });

      done(null, user);
    }
  )
);

export default passport;
