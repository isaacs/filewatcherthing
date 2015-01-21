#!/usr/bin/env node

var fs = require('fs')
var path = require('path')
var spawn = require('child_process').spawn
var args = process.argv.slice(2)
var glob = require('glob')

// first arg is file/folder to watch
// if there's a -- then that's the separator
var split = args.indexOf('--')
var watchee
var command
if (split === -1) {
  watchee = [args.shift()]
  command = args.join(' ').trim()
} else {
  watchee = args.slice(0, split)
  if (watchee.length === 0)
    watchee = [ '*' ]
  command = args.slice(split + 1).join(' ').trim()
}

var usage = 'filewatcherthing <files or folders> -- <command> [ command args... ]'

if (!watchee || !command) {
  console.error(usage)
  process.exit(1)
}

var files = watchee.map(function (w) {
  return glob.sync(w)
}).reduce(function (set, f) {
  return set.concat(f)
}, [])

if (!files.length)
  console.error('could not find file(s): ' + watchee)


var running = false

var shell
var options = {
  stdio: 'inherit'
}
if (process.platform === 'win32') {
  shell = process.env.comspec || 'cmd.exe';
  args = ['/s', '/c', '"' + command + '"'];
  // Make a shallow copy before patching so we don't clobber the user's
  // options object.
  options.windowsVerbatimArguments = true;
} else {
  shell = '/bin/sh';
  args = ['-c', command];
}

function run() {
  if (running)
    throw new Error('unpossible')

  running = true
  neverdid = false
  spawn(shell, args, options).on('exit', function(code, signal) {
    console.error('exited %s %s', code || 'ok', signal || '')
    running = false
  })
}

function watch(watchee) {
  console.error('watching', watchee)

  // on osx, dir watching only catches rename events
  // so we only watch dir entries, not directories themselves
  fs.readdir(watchee, function(er, children) {
    if (er) {
      fs.watch(watchee, onwatch)
      statPoll(watchee)
      return
    }
    children.filter(function (c) {
      return c.charAt(0) !== '.'
    }).forEach(function (c) {
      watch(path.resolve(watchee, c))
    })
  })
}

var stats = {}
var neverdid = true
function statPoll(watchee) {
  fs.stat(watchee, function(er, st) {
    if (running)
      return done()

    if (er)
      st = { mtime: new Date() }

    var m = st.mtime.toISOString()
    if (m !== stats[watchee] && (neverdid || stats[watchee]))
      run()

    stats[watchee] = m
    done()
  })

  function done() {
    setTimeout(statPoll.bind(null, watchee), 1000)
  }
}

function onwatch(event, file) {
  if (running) return
  run()
}

files.forEach(watch)
