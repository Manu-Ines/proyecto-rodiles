const mongoose = require('mongoose')

const msgdirectSchema = new mongoose.Schema({
    sender: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    },
    reciever: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Org'
    },
    about: {
        project: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'Project'
        },
        volunt: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "Volunt"
        }
    },
    message: {
        type: String,
        required: true
    }
}, { timestamps: true })

const Msgdirect = mongoose.model('Msgdirect', msgdirectSchema)
module.exports = Msgdirect