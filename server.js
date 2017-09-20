//test wahoti

var app  = require("express")();
var http = require('http').Server(app);


app.set('port', process.env.PORT || 3000);
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.get('/js/wahotiScript.js', function(req,res) {
	res.sendFile(__dirname + '/js/wahotiScript.js');
});

app.get('/js/three.min.js', function(req,res) {
	res.sendFile(__dirname + '/js/three.min.js');
});

app.get('/res/linkedinpic.jpg', function(req,res) {
	res.sendFile(__dirname + '/res/linkedinpic.jpg');
});

app.get('/res/symphony.png', function(req,res) {
	res.sendFile(__dirname + '/res/symphony.png');
});

http.listen(app.get('port'), function() {
	console.log('listening on ' + app.get('port') + '...');
});
