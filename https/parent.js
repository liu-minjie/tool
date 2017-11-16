
const spawn = require('child_process').spawn;
const str = '123';

const child = spawn('node', ['child.js', str], {
    stdio:  'ignore', //[ 'ignore', out, err ],
    detached: true,
});


setTimeout(() => {
	process.kill(child.pid);
}, 15000);