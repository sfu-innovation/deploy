
var child_process = require('child_process'),
	config = JSON.parse(fs.readFileSync('config.json')),
	os = require('os');


var monitors = {

}

var notifierTypes = {
	"irc": function(opts) {
		var Client = require('irc').Client, bot = new Client(opts.server, opts.nick || 'sfu-bot');
		return function(notification, done) {
			
			opts.channels.forEach(function(channel) {
				bot.join(channel);
				bot.say(channel, notification.body);
				bot.part(channel);
			});
			
			done();
		}
	},
	"email": function(opts) {
		var mailer = require("nodemailer").createTransport(opts.transport, opts.settings)
		return function(notification, done) {
			var mailOptions = {
				from: opts.from, // sender address
				to: opts.to.join(', '), // list of receivers
				subject: (opts.prefix ? opts.prefix + ' ' : '') + notification.title, // Subject line
				text: notification.body, // plaintext body
				//html: "<b>Hello world ✔</b>" // html body
			}

			mailer.sendMail(mail, done);
		}
	}
}

var notifiers = config.notifications.map(function(notifier) {
	return notifierTypes[notifier.type](notifier.settings);
});

function notify(notification, done) {
	async.forEach(notifiers, function(notifier, next) {
		notifier(notification, next);
	}, done);
}


function deploy(entry) {
	var path = config.path+'/'+entry.id, branch = entry.branch || 'deploy'; 

	async.series([
		function git(next) {
			fs.exists(path+'/.git', function(exists) {
				if (exists)
					child_process.execFile('git', ['pull', '--recurse-submodules', 'origin', branch], { cwd: path }, next)
				else
					child_process.execFile('git', ['clone', '--recursive', '--branch', branch, url], { cwd: path }, next)
			});
		},
		function spawn(next) {
			if (monitors[entry.id]) {
				monitors[entry.id].restart();
				next();
			}
			else {
				var monitor = new (forever.Monitor)(path+'/server.js', {
					max: os.cpus.length,
					silent: true,
					options: [ ],
					env: { },
					cwd: path,
					logFile: 'xx',
					outFile: 'yy',
					errFile: 'zz'
				});

				monitor.on('start', function() {

				}).on('exit', function() {

				}).on('error', function(err) {
					notify({ title: 'Process Error '+entry.id, body: err })
				});

				monitors[entry.id] = monitor;

				next();
			}
		}
	], function(err) {
		if (err) {
			notify({ title: 'Error Deploying '+entry.id, body: err })
		}
	});
}

// GitHub hooks
(function github() {
	var http = require('http'), express = require('express'), app = express();

	// Verifier for github's signature
	function verify(req, res, buf) {
		var signature = req.headers['x-hub-signature'], 
			hmac = crypto.createHmac('sha1', secret);
		if (hmac.update(chunk).digest('hex') !== hmac.digest('hex'))
			throw new Error();
	}

	// Body parsers
	app.use(express.json({ verify: verify }));
	app.use(express.urlencoded({ verify: verify }))
	
	// Route handler
	app.post('/', function(req, res) {
		console.log(req.body);
		res.send(200);
	});

	// Listen
	http.createServer(app).listen(0, function() {
		this.address()
	});
})()