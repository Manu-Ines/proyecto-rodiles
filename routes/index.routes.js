const express = require('express')
const router = express.Router()
const passport = require('passport')
const commonController = require('../controllers/common.controller')
const userController = require('../controllers/user.controllers/user.controller')
const orgController = require('../controllers/org.controller/org.controller')
const indexController = require('../controllers/index.controller')
const secure = require('../middlewares/secure.middleware')
const upload = require('../configs/storage.config')

/* GET home page */
router.get('/', indexController.index)

// User routes ===================================================================
router.get('/register', secure.isNotAuthenticated, userController.register)
router.post(
    '/register',
    secure.isNotAuthenticated,
    upload.single('profilePicture'),
    userController.doRegister
)
router.get('/login', secure.isNotAuthenticated, userController.login)
router.post('/login', secure.isNotAuthenticated, userController.doLogin)
router.get(
    '/user/profile',
    secure.checkRoles('USER'),
    secure.isAuthenticated,
    userController.profile
)
router.get('/logout', secure.isAuthenticated, userController.doLogout)
router.get(
    '/activate/:token',
    secure.isNotAuthenticated,
    userController.activate
)
// Request info email ------------------------------------------------------------
router.post(
    '/request-info-email',
    secure.checkRoles('USER'),
    secure.isAuthenticated,
    userController.sendInfoEmail
)

// Social auth
router.post('/authenticate/google', (req, res, next) => {
    req.flash('currPath', req.body.currPath || '/')
    passport.authenticate('google-auth', { scope: ['email', 'profile'] })(
        req,
        res,
        next
    )
})
router.get('/authenticate/google/cb', userController.doLoginGoogle)

router.get(
    '/auth/facebook',
    passport.authenticate('facebook-auth', { scope: 'email' })
)
router.post('/auth/facebook', (req, res, next) => {
    req.flash('currPath', req.body.currPath || '/')
    passport.authenticate('facebook-auth', { scope: 'email' })(req, res, next)
})
router.get('/auth/facebook/callback', userController.doLoginFacebook)

// Org routes =======================================================================
router.get('/org/register', secure.isNotAuthenticated, orgController.register)
router.post(
    '/org/register',
    secure.isNotAuthenticated,
    upload.single('profilePicture'),
    orgController.doRegister
)
router.get(
    '/org/profile',
    secure.checkRoles('ORG'),
    secure.isAuthenticated,
    orgController.profile
)
router.get(
    '/my-area-org',
    secure.checkRoles('ORG'),
    secure.isAuthenticated,
    orgController.myArea
)

// Common routes =======================================================================

router.post(
    '/send-reset-email',
    secure.isNotAuthenticated,
    commonController.sendForgotPasswordEmail
)
router.get(
    '/reset-password/:token',
    secure.isNotAuthenticated,
    commonController.activationForgotPassword
)
router.post(
    '/reset-password',
    secure.isNotAuthenticated,
    commonController.resetPassword
)

// Legal routes =======================================================================
router.get('/condiciones', (req, res, next) => res.render('legal/condiciones'))
router.get('/privacidad', (req, res, next) => res.render('legal/privacidad'))
router.get('/cookies', (req, res, next) => res.render('legal/cookies'))

module.exports = router
