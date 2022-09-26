const {Telegraf} = require('telegraf')
const axios = require('axios')
const {logOnCommandError} = require("./src/log");
const winston = require("winston");

require('dotenv').config()

winston.configure({
  transports: [new (winston.transports.File)({filename: './logs/logging.log'})]
})

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.command('start', async ctx => {
  const greeting = 'Hello there! Welcome to RubyGems finder telegram bot!\nI respond to /latest /find + name of gem. Please try it';
  bot.telegram.sendMessage(ctx.chat.id, greeting)
  .then(() => console.log(ctx.from.id, 'greeting'))
})

const gemsList = (res, msg) => {
  res.data
  .slice(0, 10)
  .forEach(gem => {
    const info = gem.info.toString().replaceAll('\n', ' ')
    msg += `\n<b>Gem:</b> ${gem.name}\n<b>Downloads:</b> ${gem.downloads}\n<b>Info:</b> ${info}\n<b>Link:</b> ${gem.project_uri}\n`
  })
  return msg;
}

bot.command('latest', async ctx => {
  const id = ctx.chat.id;
  let msg = 'There are 10 last gems:\n'
  axios
  .get('https://rubygems.org/api/v1/activity/just_updated.json')
  .then(res => {
    ctx.replyWithHTML(gemsList(res, msg))
    .then(() => console.log(id, 'latest'))
    .catch(err => logOnCommandError('latest', id, err, ctx))
  })
  .catch(err => logOnCommandError('latest', id, err, ctx))
})

bot.command('find', async ctx => {
  const id = ctx.chat.id
  const msgText = ctx.message.text
  if (msgText === '/find') {
    ctx
    .replyWithMarkdown(
        'You didn\'t specify a name of gem, try again please `/find gem`')
    .then(() => console.log(id, 'empty name'))
  } else {
    const name = msgText.replaceAll('/find', '')
    const uri = `https://rubygems.org/api/v1/search.json?query=${name}`
    let msg = 'Search result:\n'
    axios
    .get(uri)
    .then(res => {
      msg = gemsList(res, msg)
      ctx
      .replyWithHTML(msg)
      .then(() => console.log(id, 'success find'))
      .catch(err => logOnCommandError('find', id, err, ctx))
    })
    .catch(err => logOnCommandError('find', id, err, ctx))
  }
})
.catch(err => logOnCommandError('find', 'none', err))

bot.command('quit', async ctx => {
  const id = ctx.chat.id
  ctx.telegram
  .leaveChat(id).then(() => console.log(id, 'quit'))
  .catch(err => {
    logOnCommandError('quit', id, err)
    bot.telegram.sendMessage(id, 'Unexpected error...')
  })
})

bot.launch().then(() => console.log('bot started...'))
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
