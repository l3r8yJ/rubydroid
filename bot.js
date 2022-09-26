const {Telegraf} = require('telegraf')
const axios = require('axios')
const {logOnCommandError, logInfo, now} = require("./src/log");
const winston = require("winston");

require('dotenv').config()

winston.configure({
  transports: [new (winston.transports.File)({filename: `./logs/${now()}.log`})]
})

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.command('start', async ctx => {
  const greeting = 'Hello there! Welcome to RubyGems finder telegram bot!\nI respond to /latest /find + name of gem. Please try it';
  const id = ctx.chat.id;
  bot.telegram.sendMessage(id, greeting)
  .then(() => logInfo('start', id, `${id} registered`))
})

bot.command('latest', async ctx => {
  const id = ctx.chat.id;
  let msg = 'There are 10 last gems:\n'
  logInfo('latest', id, 'Searching latest gems.', ctx)
  axios
  .get('https://rubygems.org/api/v1/activity/just_updated.json')
  .then(res => {
    ctx.replyWithHTML(gemsList(res, msg))
    .then(() => logInfo('latest-success', id, 'latest found'))
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
    logInfo('find gems', id, `Searching gems with name "${name}"`, ctx)
    axios
    .get(uri)
    .then(res => {
      msg = gemsList(res, msg)
      ctx
      .replyWithHTML(msg)
      .then(() => logInfo('find-success', id, `${name} found`))
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
    logInfo('deps search', id, 'Searching dependencies.', ctx)
    axios
    .get(uri)
    .then(
        async res => {
          dev = await accumDeps(
              res.data.dependencies.development,
              dev
          )
          run = await accumDeps(
              res.data.dependencies.runtime,
              run
          )
          ctx.replyWithHTML(msg.concat(dev).concat(run))
          .catch(err => logOnCommandError('deps', id, err, ctx))
          logInfo('deps-success', id, `${name} deps found`)
        }
    )
    .catch(err => logOnCommandError('deps', id, err, ctx))
  }
})

bot.launch().then(() => logInfo('Bot started', null, 'bot started'))

const accumDeps = async (deps, accumulator) => {
  if (deps.length !== 0) {
    for (const dep of deps) {
      accumulator += await depsAsHtml(dep);
    }
  } else {
    accumulator += 'Dependencies not found...'
  }
  return accumulator;
}

const depsAsHtml = async (dep) => {
  const link = await axios
  .get(`https://rubygems.org/api/v1/gems/${dep.name}.json`)
  .then(response => {
    return response.data.project_uri;
  })
  if (link === undefined) {
    console.warn('Data not presented!')
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
  .then(() => console.warn(id, 'empty name'))
}

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
