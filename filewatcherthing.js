#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var spawn = require('child_process').spawn
var args = process.argv.slice(2)

// first arg is file/folder to watch
var watchee = path.resolve(args.shift() || '')
var cmd = args.shift()
var usage = 'filewatcherthing <file or folder> <command> [ command args... ]'

if (!watchee || !cmd) {
  console.error(usage)
  process.exit(1)
}

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
  console.error('watching', watchee)
  fs.watch(watchee, onwatch)
  statPoll(watchee)

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

var stats = {}
function statPoll(watchee) {
  fs.stat(watchee, function(er, st) {
    if (running)
      return done()

    if (er)
      st = { mtime: new Date() }

    var m = st.mtime.toISOString()
    if (m !== stats[watchee])
      run()

    stats[watchee] = m
    done()
  })

  function done() {
    setTimeout(statPoll.bind(null, watchee), 1000)
  }
}

function onwatch(event, file) {
  console.error(event, file)
  if (running) return console.error('already running')
  run()
}

watch(watchee)
