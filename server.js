//test wahoti

var app  = require("express")();
var http = require('http').Server(app);


app.set('port', process.env.PORT || 3000);
app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

app.get('/js/test_import.js', function(req,res) {
	res.sendFile(__dirname + '/js/test_import.js');
});

app.get('/js/three.min.js', function(req,res) {
	res.sendFile(__dirname + '/js/three.min.js');
});

http.listen(app.get('port'), function() {
	console.log('listening on ' + app.get('port') + '...');
});
