const mongoose = require('mongoose')

const Schema = mongoose.Schema

const PaymentSchema = new Schema({
  telegramId: String,
  memo: String,
  time: String,
  status: Number
})

const Payment = mongoose.model('payments', PaymentSchema)

module.exports = Payment