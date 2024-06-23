const UserModel = require('../models/user-models')

const UserService = {
  getAll: async () => {
    return await UserModel.find()
  },

  getOne: async (telegramId) => {
    return await UserModel.findOne({ telegramId })
  },

  edit: async (telegramId, data) => {
    return await UserModel.findOneAndUpdate({ telegramId }, data, { new: true })
  },

  saveUser: async (data) => {
    return new Promise(async (resolve, reject) => {
      const isNew = await UserModel.findOne({ telegramId: data.telegramId })

      if (!isNew) {
        const newUser = new UserModel({
          telegramId: data.telegramId,
          firstName: data.firstName,
          lastName: data.lastName,
          username: data.username,
          status: 0,
          amount: 0
        })
        await newUser.save()
        resolve(true)
      } else {
        resolve(false)
      }
    })
  }
}

module.exports = UserService