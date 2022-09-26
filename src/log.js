const winston = require("winston");

const now = () => {
  Date.prototype.today = function () {
    return ((this.getDate() < 10) ? "0" : "") + this.getDate() + "-"
        + (((this.getMonth() + 1) < 10) ? "0" : "") + (this.getMonth() + 1)
        + "-" + this.getFullYear();
  }
  Date.prototype.timeNow = function () {
    return ((this.getHours() < 10) ? "0" : "") + this.getHours() + ":"
        + ((this.getMinutes() < 10) ? "0" : "") + this.getMinutes() + ":"
        + ((this.getSeconds() < 10) ? "0" : "") + this.getSeconds();
  }
  return new Date().today() + '-' + new Date().timeNow();
}

const logOnCommandError = (name, id, err, ctx = undefined) => {
  console.error(err)
  winston.error(`Chat_id: ${id}, Command: ${name}, Date: ${now()}. `.concat(err.message))
  if (ctx !== undefined) {
    ctx.reply("Unexpected error...")
  }
}

const logInfo = (name, id, info, ctx = undefined) => {
  console.info(name)
  winston.info(`Chat_id: ${id}, Name: ${name}, Date: ${now()} `.concat(info))
  if (ctx !== undefined) {
    ctx.reply(info)
  }
}

module.exports = { logOnCommandError, logInfo, now }
