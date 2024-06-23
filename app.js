const { Telegraf } = require('telegraf')
const TonWeb = require('tonweb')
const mongoose = require('mongoose')

const bot = new Telegraf('BOT_TOKEN')
const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC'))

const UserService = require('./db/services/user-services')
const PaymentService = require('./db/services/payment-services')
const { message } = require('telegraf/filters')

const walletAddress = 'WALLET_ADDRESS'

//генерируем случайную строку для Memo
const generateMemo = () => {
  return Math.random().toString(36).substring(2, 15)
}

const providerTokens = {
  yookassa: 'YOKASSA_TOKEN',
  stripe: 'STRIPE_TOKEN'
}

const getInvoice = (id, provider, currency, amount) => {
  return {
    chat_id: id,
    provider_token: provider,
    title: 'Криптобот | Оплата',
    description: 'Оплата месячного доступа',
    currency: currency,
    prices: [{ label: 'Криптобот | Оплата', amount: amount }],
    payload: {
      user_id: id,
      memo: generateMemo(),
    }
  }
}

const checkPayment = async (memo) => {
  try {
    const transactions = await tonweb.provider.getTransactions(walletAddress)
    console.log(`Список транзакций: `, transactions)

    const transaction = transactions.find((transaction) => transaction.in_msg.message === memo)
    const amount = parseInt(transaction.in_msg.value, 10) / 10**9
    return amount
  } catch (error) {
    // console.log('Ошибка получения статуса транзакции: ', error)
  }
  return 0
}

bot.start(async (ctx) => {
  ctx.replyWithHTML(`Привет ${ctx.message.from.first_name}!\nНажми на /crypto чтобы совершить оплату криптовалютой\nНажмите /kassa для оплаты ЮКассой\nНажмите /stripe для оплаты Stripe`)

  await UserService.saveUser({
    telegramId: ctx.chat.id,
    firstName: ctx.message.from.first_name,
    lastName: ctx.message.from.last_name,
    username: ctx.message.from.username,
  })
})

bot.command('crypto', async (ctx) => {
  const expectAmount = 0.2
  const memo = generateMemo()
  await ctx.replyWithHTML(`Отправьте <code>${expectAmount}</code> TON на адерс: <code>${walletAddress}</code>\n❗️При переводе ОБЯЗАТЕЛЬНО укажите Memo: <code>${memo}</code>`)

  await PaymentService.savePayment({
    telegramId: ctx.chat.id,
    memo: memo,
    time: Date.now()
  })

  //проверяем статус платежа
  const interval = setInterval(async () => {
    const amount = await checkPayment(memo)
    if (amount === expectAmount) {
      clearInterval(interval)
      await ctx.replyWithHTML(`✅Ваша оплата в размере <b>${amount} TON</b> прошла успешно!`)

      await PaymentService.edit(memo, { status: 1 })
      await UserService.edit(ctx.chat.id, { status: 1 })
    }
  }, 30 * 1000) //Проверяем каждые 30 секунд
})

bot.command('stripe', async (ctx) => {
  const invoice = getInvoice(ctx.chat.id, providerTokens.stripe, 'EUR', 500)
  await ctx.replyWithInvoice(invoice)

  PaymentService.savePayment({
    telegramId: ctx.chat.id,
    memo: invoice.payload.memo,
    time: Date.now()
  })
})

bot.command('kassa', async (ctx) => {
  const invoice = getInvoice(ctx.chat.id, providerTokens.yookassa, 'RUB', 50000)
  await ctx.replyWithInvoice(invoice)

  PaymentService.savePayment({
    telegramId: ctx.chat.id,
    memo: invoice.payload.memo,
    time: Date.now()
  })
})

bot.command('checkpay', async (ctx) => {
  const user = await UserService.getOne(ctx.chat.id)

  if (user.status === 1) {
    await ctx.replyWithHTML('✅Вы имеете доступ ко всем возможностям бота')
  } else {
    await ctx.replyWithHTML('❌Для начала оплатите подписку')
  }
})

bot.on('pre_checkout_query', async (ctx) => {
  await ctx.answerPreCheckoutQuery(true)
})

bot.on(message('successful_payment'), async (ctx) => {
  console.log('Payments data: ', ctx.message)

  await ctx.reply('Оплата прошла успешно')

  const payload = JSON.parse(ctx.message.successful_payment.invoice_payload)
  PaymentService.edit(payload.memo, { status: 1 })
  UserService.edit(payload.user_id, { status: 1 })
})

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect('DB_URL')
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error(err.message);
    // make the process fail
    process.exit(1);
  }
}

connectDB()

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))