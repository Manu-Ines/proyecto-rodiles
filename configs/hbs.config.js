require('dotenv').config()
const hbs = require('hbs')
const { join } = require('path')
const CryptoJS = require('crypto-js')

hbs.registerPartials(join(__dirname, '..', 'views', 'partials'))

// Comprobar si es organizacion
hbs.registerHelper('isOrg', function (val, options) {
    return val === 'ORG' ? options.fn() : options.inverse()
})

// Comprobar si es user
hbs.registerHelper('isUser', function (val, options) {
    return val === 'USER' ? options.fn() : options.inverse()
})

// Code
hbs.registerHelper('decrypt', function (val) {
    let bytes = CryptoJS.AES.decrypt(val, process.env.ENCRYPT_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
})

hbs.registerHelper('bankAcc', function (val) {
    let bytes = CryptoJS.AES.decrypt(val, process.env.ENCRYPT_KEY)
    let decryptedText = bytes.toString(CryptoJS.enc.Utf8)

    return '••••' + decryptedText.slice(20)
})

// Parse date
hbs.registerHelper('dateHelper', function (val) {
    let dateParsed = new Date(val)
    return `${dateParsed.getDay()}/${dateParsed.getMonth() + 1}/${dateParsed.getFullYear()}`
})

// Since date
hbs.registerHelper('sinceHelper', function (val) {
    let dateParsed = new Date(val).getTime()
    let today = new Date().getTime()
    var diff = today - dateParsed

    let days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days <= 0) {
        return Math.floor(diff / (1000 * 60 * 60)) + ' horas'
    } else {
        return Math.floor(diff / (1000 * 60 * 60 * 24)) + ' días'
    }
})
