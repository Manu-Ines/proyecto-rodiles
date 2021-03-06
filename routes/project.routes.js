const express = require('express')
const router = express.Router()
const projectController = require('../controllers/project.controller')
const secure = require('../middlewares/secure.middleware')
const upload = require('../configs/storage.config')

// Create new projects
router.get(
    '/project/create',
    secure.checkRoles('ORG'),
    secure.isAuthenticated,
    projectController.create
)

router.post(
    '/project/create',
    secure.checkRoles('ORG'),
    secure.isAuthenticated,
    upload.single('image'),
    projectController.doCreate
)

// Edit projects
router.get(
    '/project/edit/:slug',
    secure.checkRoles('ORG'),
    secure.isAuthenticated,
    projectController.edit
)

router.post(
    '/project/edit/:id',
    secure.checkRoles('ORG'),
    secure.isAuthenticated,
    upload.single('image'),
    projectController.doEdit
)
// Thank you email
router.post(
    '/send-thankyou-email-org',
    secure.checkRoles('ORG'),
    secure.isAuthenticated,
    projectController.thanksEmail
)
//Delete
router.post(
    '/delete-project/:id',
    secure.checkRoles('ORG'),
    secure.isAuthenticated,
    upload.single('image'),
    projectController.doDelete
)

// View Project
router.get('/projects/filter', projectController.filter)
router.get('/proyectos', projectController.list)
router.get('/project/:slug', projectController.detail)

module.exports = router
