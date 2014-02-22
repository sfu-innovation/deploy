
var https = require('https'),
	proxy = require('http-proxy').createProxyServer({ target: });


var proxies = [
	{ match: { path: /^\/474/ }, proxy: proxy.createProxyServer({ target: { host: 'localhost', port: 1888 }}) }
];

function find(req) {
	return proxies.filter(function(proxy) {
		if (!proxy.match) return false;
		if (proxy.match.path && !req.url.test(proxy.match.path)) return false;
		if (proxy.match.host && !req.headers['host'].test(proxy.match.host)) return false;
		return true;
	}).map(function(proxy) {
		return proxy.proxy;
	});
}

// Redirect anything on a non-secure channel to something on a secure one
http.createServer(function(req, res) {
	res.writeHead(302, 'https://'+req.headers['host']+req.url);
	res.end();
}).listen(80);

// Proxy requests to the backends
https.createServer({
	key: fs.readFileSync('/etc/ssl/private/innovate.cs.surrey.sfu.ca.key', 'utf8'),
	cert: fs.readFileSync('/etc/ssl/private/innovate.cs.surrey.sfu.ca.crt', 'utf8')
}).on('request', function(req, res) {
	var proxies = find(req);
	if (proxies.length === 1)
		return proxies[0].web(req, res);
	res.writeHead(500);
}).on('upgrade', function (req, socket, head) {
	var proxies = find(req);
	if (proxies.length === 1)
		return proxy.ws(req, socket, head);
	socket.close();
}).listen(443);

// Drop privileges after listening on 80 and 443 and reading the SSL certificates
process.initgroups('innovate');
process.setgid('innovate');
process.setuid('innovate');
