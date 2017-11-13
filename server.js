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

app.get('/bundle.js', function(req,res) {
	res.sendFile(__dirname + '/bundle.js');
});

app.get('/res/linkedinpic.jpg', function(req,res) {
	res.sendFile(__dirname + '/res/linkedinpic.jpg');
});

app.get('/res/githubpic.jpg', function(req,res) {
	res.sendFile(__dirname + '/res/githubpic.jpg');
});

app.get('/res/profilepic.jpg', function(req,res) {
	res.sendFile(__dirname + '/res/profilepic.jpg');
});

app.get('/res/backgroundpic.jpg', function(req,res) {
	res.sendFile(__dirname + '/res/backgroundpic.jpg');
});

app.get('/res/my_pixelized_dude.png', function(req,res) {
	res.sendFile(__dirname + '/res/my_pixelized_dude.png');
});

app.get('/res/gascoigne.png', function(req,res) {
	res.sendFile(__dirname + '/res/gascoigne.png');
});

app.get('/res/necromancer.png', function(req,res) {
	res.sendFile(__dirname + '/res/necromancer.png');
});

app.get('/res/cool_guy.png', function(req,res) {
	res.sendFile(__dirname + '/res/cool_guy.png');
});

app.get('/res/symphony.png', function(req,res) {
	res.sendFile(__dirname + '/res/symphony.png');
});

app.get('/res/omae.mp3', function(req,res) {
	res.sendFile(__dirname + '/res/omae.mp3');
});

http.listen(app.get('port'), function() {
	console.log('listening on ' + app.get('port') + '...');
});
