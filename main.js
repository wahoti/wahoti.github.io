var victor = require('victor');

function test_main() {
	console.log('test_main success! \t document.baseURI: ' + document.baseURI);
}

test_main();

var test_interval = setInterval(function(){
	console.log('yoo');
}, 1000);

var people = {};
var things = {};
var boxs = {};
var things_draw = {};
var things_count = 0;
var reverse = new victor(-1,-1)	;
var width = 1000;
var height = 1000;

//var draw_interval = setInterval(function(){ io.sockets.emit('draw', things_draw) }, 16)
//var energy_interval = setInterval(function(){ for(var x in people){ if(people[x].energy < 10){ people[x].energy++ } } }, 1000) 