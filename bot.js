const { Telegraf } = require('telegraf')
const express = require('express')
require('dotenv').config()
const axios = require('axios')
const path = require('path')
const port = process.env.PORT || 3000
const expressApp = express()

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.command('start', ctx => {
  console.log(ctx.from)
  const greeting = 'Hello there! Welcome to RubyGems finder telegram bot!\nI\'m respond to /fresh. Please try it';
  bot.telegram.sendMessage(ctx.chat.id, greeting)
  .then(() => {
    console.log(ctx.from, 'greeting')
  })
})

bot.command('fresh', ctx => {
  console.log(ctx.from)
  axios.get('https://rubygems.org/api/v1/activity/just_updated.json')
  .then(res => {
    const gems = res.data
    gems.forEach(gem => {
      console.log(gem.name)
    })
  })
})

bot.launch()
  .then(() => {
  console.log('bot started...')
})
