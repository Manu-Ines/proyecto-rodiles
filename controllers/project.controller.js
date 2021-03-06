require('dotenv').config()
const client = require('../configs/algolia.config')
const index = client.initIndex('projects')
const Project = require('../models/projects/Project.model')
const Donation = require('../models/projects/Donation.model')
const categs = require('../configs/categs.config')
const mailer = require('../configs/mailer.config')

// Create project
module.exports.create = (req, res, next) => {
    res.render('project/create', { categs: categs })
}

module.exports.doCreate = (req, res, next) => {
    let placeholders = [
        'https://res.cloudinary.com/dd5wme5hw/image/upload/v1615233330/express/default/placeholder-3_wr2twv.jpg',
        'https://res.cloudinary.com/dd5wme5hw/image/upload/v1615233330/express/default/placeholder-1_j41wgo.jpg',
        'https://res.cloudinary.com/dd5wme5hw/image/upload/v1615233330/express/default/placeholder-4_nsy0if.jpg',
        'https://res.cloudinary.com/dd5wme5hw/image/upload/v1615233330/express/default/placeholder-2_wx8cco.jpg',
    ]

    req.body.owner = req.currentUser.id
    req.body.image = req.file
        ? req.file.path
        : placeholders[Math.floor(Math.random() * (4 - 1) + 1)]

    Project.create(req.body)
        .then((project) => {
            index
                .saveObjects([project], {
                    autoGenerateObjectIDIfNotExist: true,
                })
                .then((obj) => {
                    Project.updateOne(
                        { _id: project._id },
                        { algoliaID: obj.objectIDs[0] }
                    ).then(() => {
                        res.redirect(`/project/${project.slug}`)
                    })
                })
                .catch(next)
        })
        .catch(next)
}

// View project
module.exports.detail = (req, res, next) => {
    Project.findOne({ slug: req.params.slug })
        .populate('owner')
        .populate({
            path: 'donations',
            options: { sort: { createdAt: -1 } },
            match: { paid: true },
            populate: {
                path: 'donator',
            },
        })
        .then((project) => {
            if (!project) next()

            let collectedTotal = project.donations.reduce(
                (acc, curr) => acc + curr.contribution,
                0
            )
            project.percent = (collectedTotal * 100) / project.sum
            let donors2show = project.donations.slice(0, 2)

            Project.find()
                .limit(3)
                .populate('owner')
                .populate('donations')
                .then((projs) => {
                    projs.map((obj) => {
                        obj.money = obj.donations
                            .filter((d) => d.paid)
                            .reduce((acc, cur) => {
                                return (acc += cur.contribution)
                            }, 0)
                        obj.percent = (obj.money * 100) / obj.sum
                        return obj
                    })

                    res.render('project/detail', {
                        project,
                        collectedTotal,
                        donatorsTotal: project.donations.length,
                        donors2show,
                        projs,
                    })
                })
        })
        .catch(() => next)
}

module.exports.list = (req, res, next) => {
    Project.find({ completed: false })
        .limit(50)
        .populate('owner')
        .populate('donations')
        .then((projects) => {
            projects.map((obj) => {
                obj.money = obj.donations
                    .filter((d) => d.paid)
                    .reduce((acc, cur) => {
                        return (acc += cur.contribution)
                    }, 0)
                obj.percent = (obj.money * 100) / obj.sum
                return obj
            })

            res.render('project/list', { projects, categs: categs })
        })
}

module.exports.filter = (req, res, next) => {
    let { category } = req.query

    let oneCateg = ''
    if (!req.query.category) { category = categs }
    if (typeof req.query.category === "string") { oneCateg = req.query.category }
    
    if (!req.query.category) {
        res.redirect('/proyectos') 
    } else {
        Project.find({ completed: false, categs: category })
        .limit(50)
        .populate('owner')
        .populate('donations')
        .then((projects) => {
            projects.map((obj) => {
                obj.money = obj.donations
                    .filter((d) => d.paid)
                    .reduce((acc, cur) => {
                        return (acc += cur.contribution)
                    }, 0)
                obj.percent = (obj.money * 100) / obj.sum
                return obj
            })

            res.render('project/list', { projects, categs: categs, params: req.query, oneCateg })
        })
    }
}

// Edit project
module.exports.edit = (req, res, next) => {
    Project.findOne({ slug: req.params.slug })
        .populate('owner')
        .then((project) => {
            if (project.owner.equals(req.currentUser._id)) {
                let createDate = new Date(project.endDate)
                let date = `${createDate.getFullYear()}-${(
                    '0' +
                    (createDate.getMonth() + 1)
                ).slice(-2)}-${createDate.getDate()}`

                Donation.find({ project: project._id }).then((donations) => {
                    if (donations.length == 0) {
                        let noProjects = true
                        res.render('project/edit', {
                            project,
                            date,
                            categs: categs,
                            noProjects,
                        })
                    } else {
                        res.render('project/edit', {
                            project,
                            date,
                            categs: categs,
                        })
                    }
                })
            } else {
                req.flash('flashMessage', 'No puedes editar este proyecto')
                res.redirect('/')
            }
        })
}

module.exports.doEdit = (req, res, next) => {
    if (req.file) {
        req.body.image = req.file.path
    }

    Project.findByIdAndUpdate({ _id: req.params.id }, req.body, {
        useFindAndModify: false,
    })
        .then((project) => {
            req.body.objectID = project.algoliaID
            index
                .partialUpdateObject(req.body)
                .then(() => {
                    res.redirect(`/project/${project.slug}`)
                })
                .catch(next)
        })
        .catch(next)
}
// completed: true (solo req.body)

module.exports.thanksEmail = (req, res, next) => {
    
    Project.findOne({ _id: req.body.projectId})
    .populate( 'owner' )
    .populate({ path: 'donations', populate: { path: 'donator' }})
    .then((project) => {
        const emailList = 'ipalmamasaveu@gmail.com'
        mailer.sendFinalEmail(emailList, req.body.messageThankyou, project.owner.name)
        res.redirect('/my-area-org')
    })
}

module.exports.doDelete = (req, res, next) => {
    Project.findOne({ _id: req.params.id })
        .populate('owner')
        .then((project) => {
            if (req.currentUser) {
                if (project.owner.equals(req.currentUser._id)) {
                    Donation.find({ project: project._id }).then(
                        (donations) => {
                            if (donations.length === 0) {
                                Project.deleteOne({ _id: project.id }).then(
                                    () => {
                                        index
                                            .deleteObjects([project.algoliaID])
                                            .then(() => {
                                                res.redirect('/org/profile')
                                            })
                                            .catch(next)
                                    }
                                )
                            } else {
                                mailer.deleteProyectRequest(
                                    'ipalmamasaveu@gmail.com',
                                    project.owner.name,
                                    project._id,
                                    req.body.reason
                                )
                                req.flash(
                                    'flashMessage',
                                    'Solicitud para eliminar el proyecto enviada'
                                )
                                res.redirect(`/project/${project.slug}`)
                            }
                        }
                    )
                } else {
                    req.flash(
                        'flashMessage',
                        'No puedes eliminar este proyecto'
                    )
                    res.redirect('/')
                }
            } else {
                req.flash('flashMessage', 'No puedes eliminar este proyecto')
                res.redirect('/')
            }
        })
        .catch(next)
}
