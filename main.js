var victor = require('victor');

function test_main() {
	console.log('test_main success! \t document.baseURI: ' + document.baseURI);
}

test_main();

//var test_interval = setInterval(function(){
//	console.log('yoo');
//}, 1000);


//DARK SQUARES
var up = false;
var down = false;
var left = false;
var right = false;

var keydown = function(c){
	var key = c.keyCode
	switch(key){
		case 87://w
			up = true
			break
		case 83://s
			down = true
			break
		case 65://a
			left = true
			break	
		case 68://d
			right = true
			break
		case 32://space
			console.log('activate ability');
			//socket.emit('action', 'ability', [mx,my])
			break		
		case 16://shift
			console.log('activate spell');
			//socket.emit('action', 'spell', [mx,my])
		default:
	}
}

var keyup = function(c){
	var key = c.keyCode
	switch(key){
		case 87://w
			up = false
			break
		case 83://s
			down = false
			break
		case 65://a
			left = false
			break	
		case 68://d
			right = false
			break		
		default:
	}
}


var player = {};
var people = {};
var things = {};
var boxs = {};
var things_draw = {};
var things_count = 0;
var reverse = new victor(-1,-1)	;
var width = 1000;
var height = 1000;
//var energy_interval = setInterval(function(){ for(var x in people){ if(people[x].energy < 10){ people[x].energy++ } } }, 1000) 
	
var canvas = document.getElementById("field");
var hp_canvas = document.getElementById("hp");
var stamina_canvas = document.getElementById("stamina");
var ctx = canvas.getContext("2d");
var hp_ctx = hp_canvas.getContext("2d");
var stamina_ctx = stamina_canvas.getContext("2d");
hp_ctx.fillStyle = "#e60000";
stamina_ctx.fillStyle = "#00b300";

var draw_interval = setInterval(function(){
	ctx.clearRect(0, 0, 1000, 1000);
	hp_ctx.clearRect(0,0,300,30);
	stamina_ctx.clearRect(0,0,300,30);
	hp_ctx.fillRect(0,0,(player.health/10)*300,30);
	stamina_ctx.fillRect(0,0,(player.energy/10)*300,30);
	for(var x in things){
		size = things[x].size;
		_size = things[x].size/2;
		if(!things[x].isperson && !things[x].iszombie){
			ctx.fillStyle = things[x].color;
			ctx.fillRect(things[x].x - _size,things[x].y - _size,size,size);
		}
		else if(things_draw[x].isperson || things_draw[x].iszombie){
			__size = _size/2;
			if(!things[x].invisible){
				switch(things[x].phase){
					case "moving":
						ctx.fillStyle="#000000";
						break;
					case "dodging":
						ctx.fillStyle="#00ffff";
						break;
					case "knockback":
						ctx.fillStyle="#ff0000";
						break;
					case "frozen":
						ctx.fillStyle = "#0000ff";
						break;
					default:
						ctx.fillStyle="#000000";
				}
				ctx.fillRect(things[x].x - _size,things[x].y - _size,size,size);
			}
		}
	}
}, 16);

//keys
document.addEventListener("keydown", keydown, false);
document.addEventListener("keyup", keyup, false);

//mouse		
var mx = 0;
var my = 0;	
document.addEventListener('contextmenu', function(c) { c.preventDefault() }, false);
canvas.addEventListener("mousedown", function(c){
	coord = [(c.clientX - canvas.offsetLeft), (c.clientY - canvas.offsetTop)]
	if(c.which == 1){
		console.log('left click');
	} //DO LEFT CLICK HER 
	if(c.which == 3){
		console.log('right click');
	} //DO RIGHT CLICK HERE
}, false);
canvas.addEventListener('mousemove',function(c){
	mx = (c.clientX - canvas.offsetLeft);
	my = (c.clientY - canvas.offsetTop);
},false);

//buttons
var m1butt = document.getElementById('m1');
var _m1butt = document.getElementById('_m1');
m1butt.onclick = function(){
	console.log('weapon change');
	//CHANGE WEAPON HERE
	//socket.emit('change',_m1butt.options[_m1butt.selectedIndex].value,'weapon')
}

var m2butt = document.getElementById('m2');
var _m2butt = document.getElementById('_m2');
m2butt.onclick = function(){
	console.log('spell change');
	//CHANGE SPELL HERE
	//socket.emit('change',_m2butt.options[_m2butt.selectedIndex].value,'spell')
}

var space = document.getElementById('space');
var _space = document.getElementById('_space');
space.onclick = function(){
	console.log('ability change');
	//CHANGE ABILITY HERE
	//socket.emit('change',_space.options[_space.selectedIndex].value,'ability')
}			

var agentbutt = document.getElementById('agent');
var _agentbutt = document.getElementById('_agent');
agent.onclick = function(){
	console.log('new agent');
	//SPAWN AGENT HERE
	//socket.emit('agent',_agentbutt.options[_agentbutt.selectedIndex].value,'agent')
}			