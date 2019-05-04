"use strict"

const Cloner        = require('cloner')
const merge         = require('lodash.merge')




var a = {a: 1, b: 2}
var b = {b: 7, c: 3}

//var c = Cloner.shallow.merge({a: 3}, a);

merge(a, b)

b.b = 12

console.log(JSON.stringify(a))
console.log(JSON.stringify(b))
//console.log(JSON.stringify(c))





process.stdin.resume()
