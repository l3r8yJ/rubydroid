const winston = require("winston");

function logOnCommandError(name, id, err, ctx) {
  Date.prototype.today = function () {
    return ((this.getDate() < 10)?"0":"") + this.getDate() +"/"+(((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"/"+ this.getFullYear();
  }
  Date.prototype.timeNow = function () {
    return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
  }
  const datetime = new Date().today() + " @ " + new Date().timeNow();
  console.error(err)
  winston.error(`Chat_id: ${id}, Command: ${name}, Date: ${datetime}. `.concat(err.message))
  if (ctx) {
    ctx.reply("Unexpected error...")
  }
}

module.exports = { logOnCommandError }
