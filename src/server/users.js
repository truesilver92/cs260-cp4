const mongoose = require('mongoose');
const scrypt = require("scrypt");
const express = require("express");
const router = express.Router();
const auth = require("./auth.js");

const maxtime = 0.1;
const scryptParameters = scrypt.paramsSync(maxtime);

//
// Users
//

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    tokens: [],
});

userSchema.pre('save', async function(next) {
    if(!this.isModified('password'))
        return next();

    try {
        const key = new Buffer(this.password);
        const kdfResult = await scrypt.kdf(key, scryptParameters);
        this.password = kdfResult;
        return next();
    } catch (error) {
        console.log('scrypt failure');
        console.log(error);
        return next(error);
    }
});
userSchema.methods.comparePassword = async function(password) {
    try {
        return await scrypt.verifyKdf(this.password, new Buffer(password));
    } catch (error) {
        return false;
    }
};
userSchema.methods.toJSON = function() {
    let obj = this.toObject();
    delete obj.password;
    delete obj.tokens;
    return obj;
};
userSchema.methods.addToken = function(token) {
    this.tokens.push(token);
};

userSchema.methods.removeToken = function(token) {
    this.tokens = this.tokens.filter(t => t != token);
};

userSchema.methods.removeOldTokens = function() {
    this.tokens = auth.removeOldTokens(this.tokens);
};

const User = mongoose.model('User', userSchema);

async function login(user, res) {
    let token = auth.generateToken({
        id: user._id
    }, "24h");

    user.removeOldTokens();
    user.addToken(token);
    await user.save();

    return res
        .cookie("token", token, {
            expires: new Date(Date.now() + 86400 * 1000)
        })
        .status(200).send(user);
}
// Get current user if logged in.
router.get('/', auth.verifyToken, async (req, res) => {
  // look up user account
  const user = await User.findOne({
    _id: req.user_id
  });
  if (!user)
    return res.status(403).send({
      error: "must login"
    });

  return res.send(user);
});
// create a new user
router.post('/', async (req, res) => {
    if (!req.body.username || !req.body.password)
        return res.status(400).send({
            message: "username and password are required"
        });
    try {
        //  check to see if username already exists
        const existingUser = await User.findOne({
            username: req.body.username
        });
        if (existingUser)
            return res.status(403).send({
                message: "username already exists"
            });

        // create new user
        const user = new User({
            username: req.body.username,
            password: req.body.password
        });
        await user.save();
        return login(user, res);
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
});
// login
router.post('/login', async (req, res) => {
    if (!req.body.username || !req.body.password)
        return res.sendStatus(400);

    try {
        //  lookup user record
        const existingUser = await User.findOne({
            username: req.body.username
        });
        if (!existingUser)
            return res.status(403).send({
                message: "username or password is wrong"
            });

        // check password
        if (!existingUser.comparePassword(req.body.password))
            return res.status(403).send({
                error: "username or password is wrong"
            });

        return login(existingUser, res);
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
});
// Logout
router.delete("/", auth.verifyToken, async (req, res) => {
  // look up user account
  const user = await User.findOne({
    _id: req.user_id
  });
  if (!user)
    return res.clearCookie('token').status(403).send({
      error: "must login"
    });

  user.removeToken(req.token);
  await user.save();
  res.clearCookie('token');
  return res.sendStatus(200);
});

module.exports = router;
