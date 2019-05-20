'use strict'

const LogType       = Object.freeze({"FATAL":0, "ERROR":10, "WARNING":30, "INFO":40, "DEBUG":50, "TRACE":60})
const LogLevel      = LogType

module.exports = { LogType, LogLevel }