var test = require('tap').test
var spawn = require('child_process').spawn
var fs = require('fs')
var path = require('path')
var script = path.resolve(__dirname, '..', 'filewatcherthing.js')
var args = [script, __dirname, 'ls', '-laF']

test('basic', function (t) {
  console.error(process.execPath, args.join(' '))
  var child = spawn(process.execPath, args)
  var stdout = ''
  var stderr = ''
  child.stdout.on('data', function(c) {
    stdout += c
  })
  child.stderr.on('data', function(c) {
    stderr += c
  })
  setTimeout(function() {
    fs.writeFileSync(__dirname + '/foo', 'bar\n')
  }, 100)
  setTimeout(function() {
    t.ok(stdout)
    t.ok(stderr)
    child.kill()
    t.end()
  }, 200)
})

test('cleanup', function(t) {
  fs.unlinkSync(__dirname + '/foo')
  t.pass('clean')
  t.end()
})
