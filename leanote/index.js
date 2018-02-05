const prompt = require('prompt');
const email = require("emailjs/email");
const json = require('./password.json');

const fileName = process.argv[2];

if (!fileName) {
	process.exit(1);
} 




const server 	= email.server.connect({
	user: "minjieliu@163.com", 
  password: json.email, 
  host: "smtp.163.com", 
  ssl: false
});


server.send({
	text: '',
  to: 'minjieliu@163.com',
  subject: 'leanote_bak',
  from: "minjieliu@163.com",
  attachment: [{
  	path:`./leanote/${fileName}`, type:"application/zip", name: fileName
  }]}, function (err, message) {
  	if (err) {
  		console.log(message);
  		console.error(err);
  		return;
  	}
  });
