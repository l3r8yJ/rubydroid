const { Telegraf } = require('telegraf')
const express = require('express')
const axios = require('axios')
const path = require('path')
const port = process.env.PORT || 3000
const expressApp = express()
const { logOnCommandError } = require("./log");

require('dotenv').config()

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.command('start', async ctx => {
  const greeting = 'Hello there! Welcome to RubyGems finder telegram bot!\nI\'m respond to /fresh /quit. Please try it';
  bot.telegram.sendMessage(ctx.chat.id, greeting)
    .then(() => console.log(ctx.from.id, 'greeting'))
})

bot.command('fresh', async ctx => {
  const id = ctx.chat.id;
  let msg = 'There 10 last gems:\n'
  axios
    .get('https://rubygems.org/api/v1/activity/just_updated.json')
    .then(res => {
      res.data
        .slice(0, 10)
        .forEach(gem => {
          const info = gem.info.toString().replaceAll('\n', ' ')
          msg += `\n*Gem*: ${gem.name}\n*Downloads*: ${gem.downloads}\n*Info*: ${info}\n*Link*: ${gem.project_uri}\n`
        })
      bot.telegram
        .sendMessage(id, msg, { parse_mode: 'Markdown' })
        .then(() => console.log(id, 'fresh'))
    })
    .catch(err => {
      logOnCommandError('fresh', id, err)
    })
})

bot.command('quit', ctx => {
  const id = ctx.chat.id;
  ctx.telegram
    .leaveChat(id).then(() => console.log(id, 'quit'))
    .catch(err => {
      logOnCommandError('quit', id, err)
    })
})

bot.launch().then(() => console.log('bot started...'))
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

