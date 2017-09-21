var victor = require('victor');
var _ = require('lodash');
var domready = require("domready");

var what_is_going_on = false;

function test_main() {
	console.log('test_main success! \t document.baseURI: ' + document.baseURI);
}

domready(function () {
	test_main();
	add_event_listeners();
});


//DARK SQUARES//



//KEYS / CONTROLLS



var up = false;
var down = false;
var left = false;
var right = false;

var keydown = function(c){
	var key = c.keyCode;
	switch(key){
		case 87://w
			up = true;
			break;
		case 83://s
			down = true;
			break;
		case 65://a
			left = true;
			break;
		case 68://d
			right = true;
			break;
		case 32://space
			do_action(things['player'], actions[things['player'].space]);
			break;
		case 16://shift
			do_action(things['player'], actions[things['player'].shift]);
			break;
		default:
	}
}

var keyup = function(c){
	var key = c.keyCode;
	switch(key){
		case 87://w
			up = false;
			break;
		case 83://s
			down = false;
			break;
		case 65://a
			left = false;
			break;	
		case 68://d
			right = false;
			break;		
		default:
	}
}


var mx = 0;
var my = 0;	
function add_event_listeners() {//CALL THIS IN DOMREADY
	document.addEventListener("keydown", keydown, false);
	document.addEventListener("keyup", keyup, false);
	
	document.addEventListener('contextmenu', function(c) { c.preventDefault() }, false);
	canvas.addEventListener("mousedown", function(c){
		coord = [(c.clientX - canvas.offsetLeft), (c.clientY - canvas.offsetTop)]
		if(c.which == 1){
			do_action(things['player'], things['player'].m1);
		}
		if(c.which == 3){
			do_action(things['player'], things['player'].m2);
		}
	}, false);
	canvas.addEventListener('mousemove',function(c){
		mx = (c.clientX - canvas.offsetLeft);
		my = (c.clientY - canvas.offsetTop);
	},false);

	//buttons
	var m1butt = document.getElementById('m1');
	var _m1butt = document.getElementById('_m1');
	m1butt.onclick = function(){
		things['player'].m1 = _m1butt.options[_m1butt.selectedIndex].value;
	}

	var m2butt = document.getElementById('m2');
	var _m2butt = document.getElementById('_m2');
	m2butt.onclick = function(){
		things['player'].m2 = _m2butt.options[_m2butt.selectedIndex].value;
	}

	var space = document.getElementById('space');
	var _space = document.getElementById('_space');
	space.onclick = function(){
		things['player'].space = _space.options[_space.selectedIndex].value;
	}			

	var agentbutt = document.getElementById('agent');
	var _agentbutt = document.getElementById('_agent');
	agent.onclick = function(){
		new_agent(_agentbutt.options[_agentbutt.selectedIndex].value);
	}	
}



//ACTIONS



var actions = {
	dodge: object = {
		cost: 1,
		go: function(player, coord){
			if(player.phase == "moving"){
				var dx = player.pos.x;
				var dy = player.pos.y;
				if(up){ dy -= 1; }
				else if(down){ dy += 1; }
				if(left){ dx -= 1; }
				else if(right){ dx += 1; }
				if((dx - player.pos.x) == 0 && (dy - player.pos.y) == 0){
					player.dodge_in_place = true;
					player.phase_count = 0;
					player.phase = "dodging";
				}
				else{
					player.dodge_in_place = false;
					player.phase_count = 0;
					player.phase_direction.x = dx - player.pos.x;
					player.phase_direction.y = dy - player.pos.y;
					player.phase_direction.normalize();
					player.phase = "dodging";
				}
			}
		}
	},
};

function do_action(agent, action){
	if((agent.energy - action.cost) >= 0){
		agent.energy -= action.cost;
		action.go(agent);
	}
}



//AGENTS



var agents = {
	
};

function new_agent(agent) {
	agents[agent].go();
}




//GAME VARIABLES



var things = {};
var reverse = new victor(-1,-1)	;
var width = 1000;
var height = 1000;
	
var canvas = document.getElementById("field");
var hp_canvas = document.getElementById("hp");
var stamina_canvas = document.getElementById("stamina");
var ctx = canvas.getContext("2d");
var hp_ctx = hp_canvas.getContext("2d");
var stamina_ctx = stamina_canvas.getContext("2d");
hp_ctx.fillStyle = "#e60000";
stamina_ctx.fillStyle = "#00b300";

function Square(id, draw, is_agent, step_function, size, x, y) {
	this.id = id;
	this.draw = draw;
	this.is_agent = is_agent;//something that acts on the game opposed to a box or projectile
	this.step = step_function || function(){};
	this.size = size || 10;
	this.pos = new victor(x || -100, y || -100); //position
	this._pos = new victor(x || -100, y || -100); //test position
	this.health = 10;
	this.energy = 10;
	this.speed = 0;
	this.phase = '';
	this.phase_count = 0;
	this.phase_direction = new victor(0, 0);
	this.dodge_speed = 20;
	this.dodge_distance = 12;
}

function colliding() {
	return false;
}

function player_step() {
	this._pos.x = this.pos.x;
	this._pos.y = this.pos.y;
	var _size = this.size/2;
	if(this.phase == "moving"){
		if(up){ this._pos.y -= this.speed; }
		else if(down){ this._pos.y += this.speed; }
		if(left){ this._pos.x -= this.speed; }
		else if(right){ this._pos.x += this.speed; }	
	}
	else if(this.phase == "dodging"){
		if(!this.dodge_in_place){
			this._pos.x += this.phase_direction.x * this.dodge_speed;
			this._pos.y += this.phase_direction.y * this.dodge_speed;
		}
		this.phase_count += 1;
		if(this.phase_count == this.dodge_distance) this.phase = "moving";
	}
	if(!colliding(this)){
		//move_weapons(this)
		this.pos.x = this._pos.x;
		this.pos.y = this._pos.y;
		return;
	}
	// else if(this.phase == "knockback"){
		// this._x += this.ddirection.x * this.dspeed
		// this._y += this.ddirection.y * this.dspeed
		// this.dcount += 1
		// if(this.dcount == this.ddistance){ this.phase = "moving" }
	// }
	// else if(this.phase == 'frozen'){
		// this.pcount += 1
		// if(this.pcount == this.ptime){ this.phase = "moving"}
	// }
	
	// update_weapons(this)
	// //for knockback, have colliding change _x/_y
	// if(!colliding(this)){
		// move_weapons(this)
		// this.x = this._x
		// this.y = this._y
		// return
	// }
}

function create_player() {
	things['player'] = new Square('player', true, true, player_step, 10, 250, 250);
	things['player'].phase = 'moving';
	things['player'].speed = 5;
	things['player'].space = 'dodge';
	things['player'].shift = 'freeze';
	things['player'].m1 = 'sword';
	things['player'].m2 = 'axe';
	
}

create_player();



//INTERVALS (LOOPS)



var dark_squares_draw_interval = setInterval(function(){
	ctx.clearRect(0, 0, width, height);
	hp_ctx.clearRect(0,0,300,30);
	stamina_ctx.clearRect(0,0,300,30);
	hp_ctx.fillRect(0,0,(things['player'].health/10)*300,30);
	stamina_ctx.fillRect(0,0,(things['player'].energy/10)*300,30);
	for(var x in things){
		if(things[x].draw){
			var size = things[x].size;
			var _size = things[x].size/2;
			var __size = _size/2;
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
			ctx.fillRect(things[x].pos.x - _size,things[x].pos.y - _size,size,size);
		}
		
	}
}, 17);	

var dark_squares_step_interval = setInterval(function(){
	for(var x in things){
		things[x].step();
	}
}, 17);

var second_interval = setInterval(function(){
	if (what_is_going_on){
		console.log(this.phase_count);
		console.log(this.pos.x, this.pos.y);
	}
	
	for(var x in things){
		if(things[x].is_agent){
			if(things[x].energy < 10){
				things[x].energy++;
			}
		}
	}
}, 1000) 