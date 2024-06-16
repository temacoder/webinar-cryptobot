const mongoose = require('mongoose')

const Schema = mongoose.Schema

const UserSchema = new Schema({
  telegramId: String,
  firstName: String,
  lastName: String,
  username: String,
  status: Number,
  amount: Number
})

const User = mongoose.model('users', UserSchema)

module.exports = User