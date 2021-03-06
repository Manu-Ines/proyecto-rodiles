require('dotenv').config()
const Donation = require('../models/projects/Donation.model')
const Project = require('../models/projects/Project.model')
const stripe = require('stripe')(process.env.SK_KEY)
const endpointSecret = process.env.END_POINT_SECRET

module.exports.createStripeCheckOut = (req, res, next) => {
    req.body.quantity = req.body.quantity <= 0 ? 1 : req.body.quantity

    return stripe.checkout.sessions
        .create({
            customer_email: req.currentUser.email,
            submit_type: 'donate',
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'eur',
                        product_data: {
                            name: req.body.projectTitle,
                            images: [req.body.projectImage],
                        },
                        unit_amount: req.body.quantity * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.HOST}/project/${req.body.projectSlug}?paid=true`,
            cancel_url: `${process.env.HOST}/project/${req.body.projectSlug}`,
        })
        .then((session) => {
            req.body.donator = req.currentUser.id
            req.body.project = req.body.projectId
            req.body.contribution = req.body.quantity
            req.body.stripeSession = session.id

            Donation.create(req.body)
                .then(() => {
                    res.json({ id: session.id })
                })
                .catch(next)
        })
        .catch(next)
}

module.exports.stripeHook = (req, res, next) => {
    const sig = req.headers['stripe-signature']

    let event

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
    } catch (err) {
        console.error(err)
        return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object

        Donation.findOneAndUpdate(
            { stripeSession: session.id },
            { paid: true },
            { useFindAndModify: false }
        )
            .then((donation) => {
                Project.findOne({ _id: donation.project })
                    .populate('donations')
                    .then((project) => {
                        let donationSum = project.donations
                            .filter((proj) => {
                                return proj.paid
                            })
                            .reduce((acc, curr) => {
                                return acc + curr.contribution
                            }, 0)

                        if (project.sum <= donationSum) {
                            Project.findOneAndUpdate(
                                { _id: project._id },
                                { completed: true },
                                { useFindAndModify: false }
                            ).catch(next)
                        }
                    })
                    .catch((e) => console.log(e))
                res.status(200).send(donation)
            })
            .catch((e) => res.status(500).send(e))
    }
}
