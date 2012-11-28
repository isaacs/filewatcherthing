#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var spawn = require('child_process').spawn
var args = process.argv.slice(2)

// first arg is file/folder to watch
var watchee = path.resolve(args.shift())
var cmd = args.shift()
var usage = 'filewatcherthing <file or folder> <command> [ command args... ]'

if (!watchee || !cmd)
  throw new Error(usage)

// Make sure it exists, and we can look at it.
fs.statSync(watchee)

var running = false

function run() {
  if (running)
    throw new Error('unpossible')

  running = true
  spawn(cmd, args, { stdio: 'inherit' }).on('exit', function(code, signal) {
    console.error('exited %j %j', code, signal)
    running = false
  })
}

function watch(watchee) {
  fs.watch(watchee, onwatch)
  // on osx, dir watching only catches rename events
  fs.readdir(watchee, function(er, children) {
    if (er) return;
    children.filter(function (c) {
      return c !== '.' && c !== '..'
    }).forEach(function (c) {
      watch(path.resolve(watchee, c))
    })
  })
}

function onwatch(event, file) {
  if (running) return
  console.error(event, file)
  run()
}

watch(watchee)
