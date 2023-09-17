const bcrypt = require('bcryptjs')
const Sib = require('sib-api-v3-sdk')
const crypto = require('crypto')
const { validationResult } = require('express-validator')

const User = require('../models/user')
const user = require('../models/user')

Sib.ApiClient.instance.authentications['api-key'].apiKey = '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'

exports.getSignup = (req, res, next) => {
    let errorMessage = req.flash('error')
    errorMessage = (errorMessage.length > 0) ? errorMessage : null
    res.render('auth/signup', {
        pageTitle: 'Signup',
        path: '/signup',
        errorMessage: errorMessage,
        oldData: {},
        validationError: []
    })
}

exports.postSignup = (req, res, next) => {
    const email = req.body.email
    const password = req.body.password
    const error = validationResult(req)
    if(!error.isEmpty()){
        return res.status(422).render('auth/signup', {
            pageTitle: 'Signup',
            path: '/signup',
            errorMessage: error.array()[0].msg,
            oldData: {email: email, password: password, confirmPassword: req.body.confirmPassword},
            validationError: error.array()
        })
    }
    bcrypt.hash(password, 12)
    .then(hashedPassword => {
        const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] }
        })
        return user.save()
    })
    .then((result) => {
        res.redirect('/login')
        // return new Sib.TransactionalEmailsApi().sendTransacEmail({
        //     sender: { email: 'shivabhattarai150@gmail.com', name: 'Shiva' },
        //     to: [{ email: email }],
        //     subject: 'SignUp succeeded!',
        //     htmlContent: '<h1>You successfully signed up!</h1>'
        // })
    })
    .catch(err => next(err))
}

exports.getLogin = (req, res, next) => {
    let message = req.flash('error')
    message = (message.length > 0) ? message : null
    res.render('auth/login', {
        pageTitle: 'Login',
        path: '/login',
        errorMessage: message,
        validationError: [],
        oldData: {}
    })
}

exports.postLogin = (req, res, next) => {
    // res.setHeader('Set-Cookie', 'loggedIn = true')
    const email = req.body.email
    const password = req.body.password
    const error = validationResult(req)
    if(!error.isEmpty()){
        return res.status(422).render('auth/login', {
            pageTitle: 'Login',
            path: '/login',
            errorMessage: error.array()[0].msg,
            validationError: error.array(),
            oldData: {email: email, password: password}
        })
    }
    User.findOne({ email: email })
        .then(user => {
            if (!user) {
                req.flash('error', 'Incorrect email or password.');
                return res.status(422).redirect('/login')
            }
            bcrypt.compare(password, user.password)
                .then(doMatch => {
                    if (doMatch) {
                        req.session.isAuthenticated = true
                        req.session.user = user
                        return req.session.save(err => {
                            if (err) console.log(err);
                            res.redirect('/')
                        })
                    }
                    else {
                        req.flash('error', 'Incorrect email or password.');
                        return res.redirect('/login')
                    }
                })
                .catch(err => next(err))
        })
        .catch(err => next(err))
}
exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        if (err) next(err);
        res.redirect('/')
    })
}

exports.getReset = (req, res, next) => {
    let message = req.flash('error')
    message = (message.length > 0) ? message : null
    res.render('auth/reset', {
        pageTitle: 'Forgot Password',
        path: '/reset',
        errorMessage: message
    })
}

exports.postReset = (req, res, next) => {
    crypto.randomBytes(32, (err, buffer)=>{
        if(err){
            console.log(err);
            return res.redirect('/reset')
        }
        const token = buffer.toString('hex')
        User.findOne({email: req.body.email})
        .then(user => {
            if(!user){
                req.flash('error', 'No account with that email found')
                return res.redirect('/reset')
            }
            user.resetToken = token,
            user.resetExpiration = Date.now() + 1800000
            return user.save()
            .then(result => {
                res.redirect('/reset')
                return new Sib.TransactionalEmailsApi().sendTransacEmail({
                    sender: { email: 'shivabhattarai150@gmail.com', name: 'Shiva' },
                    to: [{ email: req.body.email }],
                    subject: 'Password Reset',
                    htmlContent: `
                    <p>You requested a password reset</p>
                    <p>Click this <a href="localhost:3000/reset/${token}">link</a>to set a new password</p>
                    `
                })
            })
        })
        .catch(err => next(err))
    })
}

exports.getNewPassword = (req, res, next) => {
    const token = req.params.passwordToken
    User.findOne({resetToken: token, resetExpiration: {$gt: Date.now()}})
    .then(user => {
        if(!user){
            return res.status(404).render('404', { pageTitle: 'Page Not Found', path: '/404'})
        }
        let message = req.flash('error')
        message = (message.length > 0) ? message : null
        res.render('auth/new-password', {
            pageTitle: 'Reset Password',
            path: '/reset-password',
            errorMessage: message,
            passwordToken: token,
            userId: user._id.toString()
        })
    })
    .catch(err => next(err))

}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.newPassword
    const token = req.body.passwordToken
    const userId = req.body.userId

    User.findOne({resetToken: token, resetExpiration: {$gt: Date.now()}, _id: userId})
    .then(user => {
        if(!user){
            return res.status(404).render('404', { pageTitle: 'Page Not Found', path: '/404'})
        }
        return bcrypt.hash(newPassword, 12)
        .then(hashedNewPassword => {
            user.password = hashedNewPassword
            user.resetToken = undefined
            user.resetExpiration = undefined
            return user.save()
        })
        .then(result => {
            return res.redirect('/login')
        })
    })
    .catch(err => next(err))
}