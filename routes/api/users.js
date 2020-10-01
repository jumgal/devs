const express = require('express');

const router = express.Router();

const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

const User = require('../../models/User');

const { body, validationResult } = require('express-validator');


// route      POST api/users
// desc       Register user
// @access    Public

router.post('/', [
  body('name', 'Name is required').not().isEmpty(),
  body('email', 'Please include a valid email').isEmail(),
  body('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })

],
  async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    try {

      let user = await User.findOne({ email })

      if (user) {
        return res.status(400).json({ msg: 'User already exists' })
      }

      const avatar = gravatar.url(email, {
        s: '200',
        r: 'pg',
        d: 'mm'
      })

      user = new User({
        name,
        email,
        avatar,
        password
      })

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      const payload = {
        user: {
          id: user.id
        }
      }

      jwt.sign(payload, config.get('jwtsecret'), { expiresIn: 360000 }, (err, token) => {
        if (err) throw err;
        res.json({ token })
      });

    } catch (err) {
      console.log(err.message);
      res.status(500).send('Server error');
    }
  })

module.exports = router;