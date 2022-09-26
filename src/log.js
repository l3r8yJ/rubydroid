const winston = require("winston");

winston.configure({
  transports: [
    new (winston.transports.File)({ filename: '../logs/logging.log' })
  ]
})

function logOnCommandError(name, id, err) {
  Date.prototype.today = function () {
    return ((this.getDate() < 10)?"0":"") + this.getDate() +"/"+(((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"/"+ this.getFullYear();
  }
  Date.prototype.timeNow = function () {
    return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
  }
  const datetime = new Date().today() + " @ " + new Date().timeNow();
  winston.error(`Chat_id: ${id} ${name}, date: ${datetime}, command `.concat(err.message))
}

module.exports = { logOnCommandError }
