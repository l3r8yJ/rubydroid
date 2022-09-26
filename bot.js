const {Telegraf} = require('telegraf')
const axios = require('axios')
const {logOnCommandError} = require("./src/log");
const winston = require("winston");
const {response} = require("express");

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
    sendNameWarningMessage(ctx, id);
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

bot.command('deps', async ctx => {
  const id = ctx.chat.id
  const msgText = ctx.message.text
  if (msgText === '/deps') {
    sendNameWarningMessage(ctx, id)
  } else {
    const name = msgText.replaceAll('/deps', '').replaceAll(' ', '')
    const uri = `https://rubygems.org/api/v1/gems/${name}.json`
    let msg = `Dependencies for \"${name}\":\n`
    let dev = `\n<b>Development:</b>\n`
    let run = `\n<b>Runtime:</b>\n`
    axios
    .get(uri)
    .then(async res => {
      for (const dep of res.data.dependencies.development) {
        dev += await depsAsHtml(dep);
      }
      for (const dep of res.data.dependencies.runtime) {
        run += await depsAsHtml(dep)
      }
      ctx.replyWithHTML(msg.concat(dev).concat(run))
      .catch(err => logOnCommandError('deps', id, err, ctx))
    })
    .catch(err => logOnCommandError('deps', id, err, ctx))
  }
})

bot.launch().then(() => console.log('RubyRoid started!'))

const depsAsHtml = async (dep) => {
  const link = await axios
  .get(`https://rubygems.org/api/v1/gems/${dep.name}.json`)
  .then(response => {
    return response.data.project_uri;
  })
  console.log(link)
  if (link === undefined) {
    console.log('Data not presented!')
  }
  return `<b>Name:</b> ${dep.name}, <b>link:</b> ${link}\n`;
}

const gemsList = (res, msg) => {
  res.data
  .slice(0, 10)
  .forEach(gem => {
    const info = gem.info.toString().replaceAll('\n', ' ')
    msg += `\n<b>Gem:</b> ${gem.name}\n<b>Downloads:</b> ${gem.downloads}\n<b>Info:</b> ${info}\n<b>Link:</b> ${gem.project_uri}\n`
  })
  return msg;
}

const sendNameWarningMessage = (ctx, id) => {
  ctx
  .replyWithMarkdown(
      'You didn\'t specify a name of gem, try again please `/command gemName`')
  .then(() => console.log(id, 'empty name'))
}

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
