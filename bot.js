const {Telegraf} = require('telegraf')
const axios = require('axios')
const {logOnCommandError, logInfo, now} = require("./src/log");
const winston = require("winston");
require('dotenv').config()
const express = require('express')
const app = express()

app.listen(process.env.PORT || 3000, '0.0.0.0', () => {
  console.log('Server started...')
})

winston.configure({
  transports: [new (winston.transports.File)({filename: `./logs/${now()}.log`})]
})

const bot = new Telegraf(process.env.BOT_TOKEN)
bot.launch({ port: process.env.PORT }).then(() => logInfo('Bot started', null, 'bot started'))

bot.command('start', async ctx => {
  const greeting = 'Hello there! Welcome to RubyGems finder telegram bot!\nI respond to /latest /find /deps /ver /docs. Please try it';
  const id = ctx.chat.id;
  bot.telegram
  .sendMessage(id, greeting)
  .then(() => logInfo(`start for ${id}`, id, `${id} registered`))
})

bot.command('latest', async ctx => {
  const id = ctx.chat.id;
  let msg = 'There are 10 last gems:\n'
  logInfo('latest', id, 'Searching latest gems.', ctx)
  axios
  .get('https://rubygems.org/api/v1/activity/just_updated.json')
  .then(res => ctx.replyWithHTML(gemsList(res, msg)))
  .then(() => logInfo('latest-success', id, 'latest found'))
  .catch(err => logOnCommandError('latest', id, err, ctx))
})
.catch(err => logOnCommandError('latest', 'none', err))

bot.command('find', async ctx => {
  const id = ctx.chat.id
  const text = ctx.message.text
  checkOnName(text, '/find', ctx)
  const name = purgeName(text, '/find')
  const uri = `https://rubygems.org/api/v1/search.json?query=${name}`
  let msg = 'Search result:\n'
  logInfo('find gems', id, `Searching gems with name "${name}"`, ctx)
  axios
  .get(uri)
  .then(res => msg = gemsList(res, msg))
  .then(async () => ctx.replyWithHTML(msg))
  .then(async () => logInfo('find-success', id, `${name} found`))
  .catch(err => logOnCommandError('find', id, err, ctx))
})
.catch(err => logOnCommandError('find', 'none', err))

bot.command('deps', async ctx => {
  const id = ctx.chat.id
  const text = ctx.message.text
  checkOnName(text, '/deps',ctx);
  const name = purgeName(text, '/deps')
  const uri = `https://rubygems.org/api/v1/gems/${name}.json`
  let msg = `Dependencies for \"${name}\":\n`
  let dev = `\n<b>Development:</b>\n`
  let run = `\n<b>Runtime:</b>\n`
  logInfo('deps search', id, 'Searching dependencies.', ctx)
  axios
  .get(uri)
  .then(async res => {
    dev += await accumDeps(res.data.dependencies.development)
    run += await accumDeps(res.data.dependencies.runtime)
  })
  .then(async () => ctx.replyWithHTML(msg.concat(dev).concat(run)))
  .then(async () => logInfo('deps-success', id, `${name} deps found`))
  .catch(err => logOnCommandError('deps', id, err, ctx))
})
.catch(err => logOnCommandError('Empty name', null, err))

bot.command('ver', async ctx => {
  const id = ctx.chat.id
  const text = ctx.message.text
  checkOnName(text, '/ver', ctx)
  const name = purgeName(text, '/ver')
  let msg = `Last version of ${name} – `
  const uri = `https://rubygems.org/api/v1/gems/${name}.json`
  logInfo('version searching', id, `Searching version for "${name}".`, ctx)
  axios
  .get(uri)
  .then(async res => msg += res.data.version)
  .then(async () => ctx.reply(msg))
  .then(async () => logInfo('version found', id, `version found for ${name}`))
  .catch(err => logOnCommandError('ver', id, err, ctx))
})

bot.command('docs', async ctx => {
  const id = ctx.chat.id
  const text = ctx.message.text
  checkOnName(text, '/docs', ctx)
  const name = purgeName(text, '/docs')
  const uri = `https://rubygems.org/api/v1/gems/${name}.json`
  logInfo('source searching', id, `Searching source for "${name}".`, ctx)
  axios
  .get(uri)
  .then(async res => res.data.documentation_uri)
  .then(async src => ctx.reply(`Documentation for ${name}: ${src}`))
  .then(async () => logInfo('docs', id, `docs for ${name}.`))
  .catch(err => logOnCommandError('docs', id, err, ctx))
})

const checkOnName = (text, cmd, ctx) => {
  if (text === cmd) {
    sendNameWarningMessage(ctx, cmd)
    throw new Error('Empty name')
  }
}

const purgeName = (text, cmd) => {
  return text.replaceAll(cmd, '').replaceAll(' ', '');
}

const accumDeps = async (deps) => {
  let accumulator = ''
  if (deps.length === 0) {
    accumulator = 'Dependencies not found...'
  }
  for (const dep of deps) {
    accumulator += await depsAsHtml(dep);
  }
  return accumulator;
}

const depsAsHtml = async (dep) => {
  const link = await axios
  .get(`https://rubygems.org/api/v1/gems/${dep.name}.json`)
  .then(response => response.data.project_uri)
  if (link === undefined) {
    logInfo('empty link', null, `${dep.name} link not found`)
  }
  return `<b>Name:</b> ${dep.name}\n<b>Link:</b> ${link}\n`;
}

const gemsList = (res, msg) => {
  res.data
  .slice(0, 10)
  .forEach(gem => {
    let info = gem.info.toString().replaceAll('\n', ' ')
    if (info.length > 150) {
      info = info.substring(0, 37).concat('...')
    }
    msg += `\n<b>Gem:</b> ${gem.name}\n<b>Downloads:</b> ${gem.downloads}\n<b>Info:</b> ${info}\n<b>Link:</b> ${gem.project_uri}\n`;
  })
  return msg;
}

const sendNameWarningMessage = (ctx, cmd) => {
  ctx.replyWithMarkdown(`You didn't specify a name of gem, try again please, for example: "${cmd} jini"`)
}

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
