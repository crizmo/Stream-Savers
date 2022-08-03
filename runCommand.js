var spawn = require('child_process').spawn;
module.exports = (cmd, args, onData, onFinish) => {
  var proc = spawn(cmd, args.split(' '));
  proc.stdout.on('data', onData);
  proc.stderr.setEncoding("utf8")
  proc.stderr.on('data', err => console.log(err) );
  proc.on('close', onFinish);
}