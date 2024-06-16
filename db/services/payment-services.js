const PaymentModel = require('../models/payment-models')

const PaymentService = {
  getAll: async () => {
    return await PaymentModel.find()
  },

  getOne: async (telegramId) => {
    return await PaymentModel.findOne({ telegramId })
  },

  edit: async (memo, data) => {
    return await PaymentModel.findOneAndUpdate({ memo }, data, { new: true })
  },

  savePayment: async (data) => {
    return new Promise(async (resolve, reject) => {
      const isNew = await PaymentModel.findOne({ telegramId: data.telegramId })

      if (!isNew) {
        const newPayment = new PaymentModel({
          telegramId: data.telegramId,
          memo: data.memo,
          time: data.time,
          status: 0
        })
        await newPayment.save()
        resolve(true)
      } else {
        reject(false)
      }
    })
  }
}

module.exports = PaymentService