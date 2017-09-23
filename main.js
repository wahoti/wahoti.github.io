var victor = require('victor');
var _ = require('lodash');
var domready = require("domready");
var shortid = require('shortid');
// var boxIntersect = require('box-intersect')

var what_is_going_on = false;

function test_main() {
	console.log('test_main success! \t document.baseURI: ' + document.baseURI);
}

domready(function () {
	test_main();
	add_event_listeners();
});


//DARK SQUARES//


function default_end(){
	if(this.is_agent){
		_.forEach(this.weapons, function(weapon){
			weapon.end();
		});	
	}
	//things[this.id] = {};
	delete things[this.id];
	delete this;
}

function Square(id, is_agent, step_function, collide_function, end_function, size, x, y, color) {
	this.id = id;
	this.is_agent = is_agent;//something that acts on the game opposed to a box or projectile
	this.color = color || '#000000';
	
	this.step = step_function || function(){};
	this.collide = collide_function || function(){};
	this.end = end_function || default_end;
	
	this.pos = new victor(x || -100, y || -100); //position
	this._pos = new victor(x || -100, y || -100); //test position
	this.direction = new victor(0,0);
	
	this.size = size || 10;
	this.speed = 0;
	
	this.phase = 'moving';
	this.phase_count = 0;
	this.phase_time = 0;
	this.phase_direction = new victor(0, 0);

	this.dodge_speed = 20;
	this.dodge_distance = 12;

	this.health = 10;
	this.energy = 10;
	this.weapons = {};
	this.collisions = [];
	
	this.draw = true;
	this.block = false;
	this.destroy_on_wall = false;
	this.trigger_on_wall = false;
}


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



function do_action(agent, action){
	if((agent.energy - action.cost) >= 0){
		agent.energy -= action.cost;
		action.go(agent);
	}
}

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
	beam: object = {
		cost: 3,
		step: function(){		
			this._pos.x = this.pos.x + (this.direction.x * this.speed);
			this._pos.y = this.pos.y + (this.direction.y * this.speed);
			this.pos.x = this._pos.x;
			this.pos.y = this._pos.y
			colliding(this, true);
			return;
		},
		collide: function(thing){//3 damage
			console.log('beam collide');
			if(thing.block){
				this.end();
				return;
			}				
			if(this.collisions.indexOf(thing.id) > -1){ return; }
			else{
				if(thing.is_agent){ hit(thing, 3); }	
				this.collisions.push(thing.id);
				return;
			}
		},
		go: function(player, coord){
			var shots = 0;
			beam_interval = setInterval(function(){
				if(shots >= 10){
					clearInterval(this);
					return;
				}
				shots++;		
				
				var direction = new victor(coord[0] - player.pos.x, coord[1] - player.pos.y);
				direction.normalize();
				
				var id = shortid.generate();
				things[id] = new Square(id, false, actions['beam'].step, actions['beam'].collide, default_end, 10, player.pos.x + (30*direction.x), player.pos.y + (30*direction.y));	
				things[id].direction = direction;
				things[id].speed = 20;
				things[id].color = '#FF00FF';
				things[id].destroy_on_wall = true;
			},10)	

			//setTimeout(function(){clearInterval(beam_interval)}, 500)
		}
	},

};



//AGENTS



function new_agent(agent) {
	agents[agent].go();
}

var agents = {
	agent: object = {
		//shoots bullets and dodges
		step: function(){
			this._pos.x = this.pos.x;
			this._pos.y = this.pos.y;
			var _size = this.size/2;
			var xQuad = this.pos.x/width;
			var yQuad = this.pos.y/height;
			if(this.xQuad != xQuad){
				this.xQuad = xQuad;
				this.xQuad_ = true;
			}
			else{
				this.xQuad_ = false;
			}
			if(this.yQuad != yQuad){
				this.yQuad = yQuad;
				this.yQuad_ = true;
			}
			else{
				this.yQuad_ = false;
			}
				
				
			switch(this.phase){
				case 'moving':
					var x_left = this.pos.x < width/2;
					var y_top = this.pos.y < height/2;
					if(x_left) this.direction.x = -this.pos.x;
					else this.direction.x = width-this.pos.x;
					if(y_top) this.direction.y = -this.pos.y;
					else this.direction.y = height-this.pos.y;
					this.direction.normalize();
					// console.log(this.direction.x, this.direction.y);
					this._pos.x += this.direction.x*this.speed;
					this._pos.y += this.direction.y*this.speed;
					this.dodge_cd_count++;
					if(this.dodge_cd_count >= this.dodge_cd){
						if(!x_left && !y_top){//bottom right
							this.phase_direction.x = Math.random() - 1;
							this.phase_direction.y = Math.random() - 1;
							this.phase_direction.normalize();				
						}
						else if(!x_left && y_top){//top right
							this.phase_direction.x = Math.random() - 1;
							this.phase_direction.y = Math.random();
							this.phase_direction.normalize();				
						}
						else if(x_left && y_top){//top left
							this.phase_direction.x = Math.random();
							this.phase_direction.y = Math.random();
							this.phase_direction.normalize();				
						}
						else if(x_left && !y_top){//bottom left
							this.phase_direction.x = Math.random();
							this.phase_direction.y = Math.random()-1;
							this.phase_direction.normalize();	
						}
						this.dodge_cd_count = 0;
						this.phase_count = 0;
						this.phase = 'dodging';
					}
					this.shoot_cd_count++;
					if(this.shoot_cd_count >= this.shoot_cd){
						this.shoot_cd_count = 0;
						actions['beam'].go(this, [things['player'].pos.x, things['player'].pos.y]);
					}							
					break;
				case 'dodging':
					this._pos.x += this.phase_direction.x * this.dodge_speed;
					this._pos.y += this.phase_direction.y * this.dodge_speed;
					this.phase_count += 1;
					if(this.phase_count == this.dodge_distance) this.phase = "moving";					
					break;
				case 'knockback':
					this._pos.x += this.phase_direction.x * this.dodge_speed;
					this._pos.y += this.phase_direction.y * this.dodge_speed;
					this.phase_count += 1;
					if(this.phase_count == this.dodge_distance) this.phase = "moving";
					break;
				case 'frozen':
					this.phase_count += 1;
					if(this.phase_count == this.phase_time) this.phase = "moving";
					break;
				default:
					console.log('no state');
			}
			if(colliding(this, true)) return;
			else{
				this.pos.x = this._pos.x;
				this.pos.y = this._pos.y;
				return;
			}
		},
		collide: function(square){
			console.log('agent collide!');
			
		},
		end: function(){
			
		},
		go: function(){
			var id = shortid.generate();
			things[id] = new Square(id, true, agents['agent'].step, agents['agent'].collide(), default_end, 10, -100, -100);
			things[id].speed = 3;
			things[id].dodge_cd = 100;
			things[id].dodge_cd_count = 0;
			things[id].dodge_speed = 20;
			things[id].dodge_distance = 30;
			things[id].shoot_cd = 200;
			things[id].shoot_cd_count = 0;
			random_teleport(things[id]);
		}
	},
	test: object = {
		//damage sponge - for testing
		step: function(){
			this._pos.x = this.pos.x;
			this._pos.y = this.pos.y;
			var _size = this.size/2;
				
			switch(this.phase){
				case 'moving':						
					break;
				case 'dodging':
					this._pos.x += this.phase_direction.x * this.dodge_speed;
					this._pos.y += this.phase_direction.y * this.dodge_speed;
					this.phase_count += 1;
					if(this.phase_count == this.dodge_distance) this.phase = "moving";					
					break;
				case 'knockback':
					this._pos.x += this.phase_direction.x * this.dodge_speed;
					this._pos.y += this.phase_direction.y * this.dodge_speed;
					this.phase_count += 1;
					if(this.phase_count == this.dodge_distance) this.phase = "moving";
					break;
				case 'frozen':
					this.phase_count += 1;
					if(this.phase_count == this.phase_time) this.phase = "moving";
					break;
				default:
					console.log('no state');
			}
			
			if(colliding(this, true)) return;
			else{
				this.pos.x = this._pos.x;
				this.pos.y = this._pos.y;
				return;
			}
		},
		collide: function(square){
			console.log('test collide!');
			
		},
		end: function(){
			
		},
		go: function(){
			var id = shortid.generate();
			things[id] = new Square(id, true, agents['test'].step, agents['test'].collide, default_end, 100, -100, -100);
			things[id].health = 100;
			random_teleport(things[id]);
		}
	},

};



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

function colliding(this_square, do_collision) {
	//NOTE this works only for squares
	var this_size = this_square.size / 2;
	
	//wall
	if(this_square._pos.x < this_size || this_square._pos.x > (width-this_size) || this_square._pos.y < this_size || this_square._pos.y > (height-this_size)){
		if(this_square.destroy_on_wall){
			console.log('destroy_on_wall');;
			this_square.end();
			return true;
		}
		if(this_square.trigger_on_wall){
			if(do_collision) this_square.wall_collision();
		}
		return true;
	}
	else{
	for(var x in things){
		var that_square = things[x];
		if(this_square.id != that_square.id){
			var that_size = that_square.size / 2;
			if((this_square._pos.x+this_size) >= (that_square._pos.x-that_size)&&(this_square._pos.x-this_size) <= (that_square._pos.x+that_size) &&
			   (this_square._pos.y+this_size) >= (that_square._pos.y-that_size)&&(this_square._pos.y-this_size) <= (that_square._pos.y+that_size)){ 	
				if(that_square.isweapon){
					if((that_square.owner != this_square.id) && do_collision){
						this_square.collide(that_square);
						return false;//weapons dont block
					}
				}
				else if(do_collision){
					this_square.collide(that_square);
					return true;
				}
			}
		}
	}
	}	  
	return false;
}

function random_teleport(square) {
	var done = false;
	while(!done){
		square._pos.x = Math.random() * (1000 - square.size) + square.size;
		square._pos.y = Math.random() * (1000 - square.size) + square.size;
		if(!colliding(square, false)){
			square.pos.x = square._pos.x;
			square.pos.y = square._pos.y;
			done = true;
		}
	}
	return; 
}

function hit(thing, damage){
	//console.log('hit')
	if(thing.is_agent){
		if((thing.phase != "dodging") && (thing.phase != "dead")){
			thing.health -= damage;
		}
	}
	else{
		thing.health -= damage;
	}
	
	if(thing.health <= 0){
		thing.end();
		return;
	}
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
	if(!colliding(this, true)){
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

function player_collide(square) {}//this is supposed to be empty

function player_end() {
	things['player'].phase = 'dead';
	things['player'].pos.x = -100;
	things['player'].pos.y = -100;
	setTimeout(function(){
		things['player'].health = 10;
		things['player'].phase = 'moving';
		random_teleport(things['player']);
	}, 5000);
}

function create_player() {
	things['player'] = new Square('player', true, player_step, player_collide, player_end, 10, 250, 250);
	things['player'].phase = 'moving';
	things['player'].speed = 5;
	things['player'].space = 'dodge';
	things['player'].shift = 'dodge';
	things['player'].m1 = 'dodge';
	things['player'].m2 = 'dodge';
	random_teleport(things['player']);
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
	_.forEach(things, function(value) {
		things[value.id].step();
	});
}, 17);

var second_interval = setInterval(function(){
	if (what_is_going_on){
		
	}
	
	for(var x in things){
		if(things[x].is_agent){
			if(things[x].energy < 10){
				things[x].energy++;
			}
		}
	}
}, 1000); 