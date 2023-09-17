const express = require('express')
const { check, body } = require('express-validator')
const router = express.Router()

const auth = require('../controllers/auth')
const User = require('../models/user')

router.get('/login', auth.getLogin)

router.post('/login',[
    check('email').isEmail().withMessage('Please enter a valid email').normalizeEmail(),
    body('password', 'Please enter a valid Password').isLength({min: 5}).trim().isAlphanumeric()
], auth.postLogin)

router.post('/logout', auth.postLogout)

router.get('/signup', auth.getSignup)

router.post('/signup',
 [
    check('email').isEmail().withMessage('Please enter a valid email').normalizeEmail().custom(value=> {
        return User.findOne({ email: value })
        .then(existingUser => {
            if (existingUser) {
                return Promise.reject('E-mail already exits,please pick a different one.')
            }
        })
    }),
    body('password', 'Please enter a password with alphabets and numbers and at least 5 characters long').isLength({min: 5}).trim().isAlphanumeric(),
    body('confirmPassword', 'Confirm password should match Password').trim().custom((value, {req}) => {
        if(value !== req.body.password)return false
        return true
    })
 ],
 auth.postSignup)

router.get('/reset', auth.getReset)

router.post('/reset', auth.postReset)

router.get('/reset/:passwordToken', auth.getNewPassword)

router.post('/new-password', auth.postNewPassword)

module.exports = router