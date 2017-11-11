//browserify main.js -o bundle.js
//node server.js
var victor = require('victor');
var _ = require('lodash');
var domready = require("domready");
var shortid = require('shortid');
// var Futures = require('futures');
var async = require('async');
// var sequence = Futures.sequence();
var sequence = async.series();

function test_main() {
	console.log('test_main success! \t document.baseURI: ' + document.baseURI);
}

var last_tab = 'About Me';
function tab_event(tab_name) {
	//logic for tab select
	//don't want to use resources on a tab that isn't being used
	//add event listeners here? not sure how much sense it makes
	console.log(last_tab, '->', tab_name);
	
	hold_last_tab = last_tab;
	last_tab = tab_name;
	
	
	if(tab_name != 'Dark Squares' && hold_last_tab == 'Dark Squares'){
		stop_dark_squares();
	}
	else if (tab_name == 'Dark Squares' && hold_last_tab != 'Dark Squares'){
		start_dark_squares();
	}	

	if (tab_name == 'Chess Clock' && hold_last_tab != 'Chess Clock'){
		start_chess_clock();
	}
	else if (tab_name != 'Chess Clock' && hold_last_tab == 'Chess Clock'){
		stop_chess_clock();
	}
	
	if (tab_name == 'Bekaari' && hold_last_tab != 'Bekaari'){
		start_bekaari();
	}
	else if (tab_name != 'Bekaari' && hold_last_tab == 'Bekaari'){
		stop_bekaari();
	}
}

domready(function() {
	//this is called after all the resources are loaded available - I think???
	test_main();
	add_event_listeners();//put this in tab - and add remove_event_listeners()?????
	initiate_chess_clock();
	initiate_bekaari();
	// controller_stuff()//NOT NEEDED YO... YO
});

var gamepads = {};

function gamepadHandler(e, connecting) {
	var gp = connecting ? navigator.getGamepads()[e.gamepad.index] : e.gamepad;
	
	if (connecting) {
		console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.", gp.index, gp.id, gp.buttons.length, gp.axes.length);
		gamepads[gp.index] = gp;
		document.getElementById('gamepad_p').innerHTML = 'Gamepads Connected: ' + Object.keys(gamepads).length;
	} else {
		console.log("Gamepad ", gp.index, " disconnected");
		delete gamepads[gp.index];
		document.getElementById('gamepad_p').innerHTML = 'Gamepads Connected: ' + Object.keys(gamepads).length;
	}
}


function controller_stuff(){
	window.addEventListener("gamepadconnected", function(e) { gamepadHandler(e, true); }, false);
	window.addEventListener("gamepaddisconnected", function(e) { gamepadHandler(e, false); }, false);
}

//DARK SQUARES//


function default_end(){
	if(this.is_agent){
		_.forEach(this.weapons, function(weapon){
			things[weapon].end();
		});	
	}
	
	delete things[this.id];
	delete this;
}

function Square(id, is_agent, step_function, collide_function, end_function, size, x, y, color) {
	this.id = id;
	this.is_agent = is_agent;//something that acts on the game opposed to a box or projectile
	this.color = color || '#ffffff';
	
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
	this.phase_speed = 20;
	
	this.dodge_speed = 10;
	this.dodge_distance = 12;

	this.health = 10;
	this.energy = 10;
	this.weapons = {};
	this.collisions = [];
	
	this.draw = true;
	this.block = false;
	this.destroy_on_wall = false;
	this.trigger_on_wall = false;
	this.is_weapon = false;
	this.incorporeal = false;
}


//KEYS / CONTROLLS

var keydown = function(c){
	var key = c.keyCode;
	if(last_tab == 'Bekaari'){
		switch(key){
			case 87://w
				bekaari['selected'][1] -= 1;
				break;
			case 83://s
				bekaari['selected'][1] += 1;
				break;
			case 65://a
				bekaari['selected'][0] -= 1;
				break;
			case 68://d
				bekaari['selected'][0] += 1;
				break;
			case 32://space
				bekaari_select();
				break;
			case 16://shift
				next_map();
				break;
			case 190://, >
				bekaari_color_shift_forward();
				break;
			case 188://. <
				bekaari_color_shift_backward();
				break;
			case 221://, >
				bekaari_shift_forward();
				break;
			case 219://. <
				bekaari_shift_backward();
				break;
			case 79://O
				bekaari_new();
				break;
			case 80://P
				bekaari_start();
				break;
			case 73://L
				bekaari_restart();
				break;
			default:
		}
	}
	if(last_tab == 'Chess Clock'){
		switch(key){
			case 32://space
				console.log('space');
				turn_switch_chess_clock();
				break;
			default:
		}
	}
	if(last_tab == 'Dark Squares'){
		switch(key){
			case 87://w
				things['player'].up = true;
				break;
			case 83://s
				things['player'].down = true;
				break;
			case 65://a
				things['player'].left = true;
				break;
			case 68://d
				things['player'].right = true;
				break;
			case 32://space
				do_action(things['player'], actions[things['player'].space], [mx, my]);
				break;
			case 16://shift
				do_action(things['player'], actions[things['player'].shift], [mx, my]);
				break;
			default:
		}
	}
}

var keyup = function(c){
	var key = c.keyCode;
	if(last_tab == 'Dark Squares'){
		switch(key){
			case 87://w
				things['player'].up = false;
				break;
			case 83://s
				things['player'].down = false;
				break;
			case 65://a
				things['player'].left = false;
				break;	
			case 68://d
				things['player'].right = false;
				break;		
			default:
		}
	}
}


var mx = 0;
var my = 0;	
function add_event_listeners() {//CALL THIS IN DOMREADY
	canvas = document.getElementById("field");
	hp_canvas = document.getElementById("hp");
	stamina_canvas = document.getElementById("stamina");
	ctx = canvas.getContext("2d");
	hp_ctx = hp_canvas.getContext("2d");
	stamina_ctx = stamina_canvas.getContext("2d");
	hp_ctx.fillStyle = "#e60000";
	stamina_ctx.fillStyle = "#00b300";


	document.addEventListener("tab", function(e) {
		tab_event(e.detail.tab_name);
	});

	document.addEventListener("keydown", keydown, false);
	document.addEventListener("keyup", keyup, false);
	
	document.addEventListener('contextmenu', function(c) { c.preventDefault() }, false);
	canvas.addEventListener("mousedown", function(c){
		coord = [(c.clientX - canvas.offsetLeft) * width_ratio, (c.clientY - canvas.offsetTop) * height_ratio];
		if(c.which == 1){
			do_action(things['player'], actions[things['player'].m1], coord);
		}
		if(c.which == 3){
			do_action(things['player'], actions[things['player'].m2], coord);
		}
	}, false);
	canvas.addEventListener('mousemove',function(c){
		mx = (c.clientX - canvas.offsetLeft) * width_ratio;
		my = (c.clientY - canvas.offsetTop) * height_ratio;
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

function do_action(agent, action, coord){
	if((agent.energy - action.cost) >= 0){
		agent.energy -= action.cost;
		action.go(agent, coord);
	}
}

function art_square(position, direction, speed, size, duration, color){
	var id = shortid.generate();
	things[id] = new Square(id, false, actions['beam'].step, function(){}, default_end, size, position.x, position.y);
	things[id].color = color;
	things[id].direction = direction;
	things[id].speed = speed;
	setTimeout(function(){things[id].end()}, duration);
}

var actions = {
	axe: object = {
		cost: 1,
		step: function(){
		},
		collide: function(thing){
			// if(thing.block){
				// things[name].end()
				// return
			// }}
			if(thing.id == this.owner.id) console.log('owner in collide');
			if(!(things[this.weapon_root].collisions.indexOf(thing.id) >= 0)){				
				if(thing.is_agent){
					hit(thing, 5);
					knockback(thing.id, this.owner)
				}
				if(thing.isweapon){
					if(thing.owner != this.owner){
						knockback(thing.owner, this.owner)
					}
				}
				things[this.weapon_root].collisions.push(thing.id);
			}	
			return;
		},
		end: function(){
			for(var x in this.sections_array){
				things[this.sections[x]].end();
			}
			delete things[this.owner].weapons['sword'];
			delete things[this.id];
			delete this;
		},
		update: function(){
			this.direction.rotate(this.rotation_speed).normalize();
			for(var x in this.sections_array){
				var R = this.sections_array[x];//RADIUS
				things[this.sections[x]]._pos.x = things[this.owner]._pos.x + (this.offset*R*this.direction.x);
				things[this.sections[x]]._pos.y = things[this.owner]._pos.y + (this.offset*R*this.direction.y);
				colliding(things[this.sections[x]], true);
			}		
		},
		move: function(){
			for(var x in this.sections_array){
				things[this.sections[x]].pos.x = things[this.sections[x]]._pos.x;
				things[this.sections[x]].pos.y = things[this.sections[x]]._pos.y;
			}
		},
		go: function(player, coord){
			if(player.weapons['sword']){ things[player.weapons['sword']].end(); }

			var direction = new victor(coord[0] - player.pos.x, coord[1] - player.pos.y);
			direction.rotate(-1.5).normalize();	
			direction.normalize();
			var id = shortid.generate();
			things[id] = new Square(id, false, actions['axe'].step, function(thing){}, actions['axe'].end, 10, player.pos.x + (30*direction.x), player.pos.y + (30*direction.y));	
			things[id].direction = direction;
			things[id].owner = player.id;
			things[id].incorporeal = true;
			things[id].offset = 20;
			things[id].sections_array = [1,2,3,4,5];
			things[id].sections = {};
			things[id].update = actions['axe'].update;
			things[id].move = actions['axe'].move;
			things[id].rotation_speed = .30	;
			
			//do sections
			for(var x in things[id].sections_array){
				var R = things[id].sections_array[x];//RADIUS
				var _id = shortid.generate();
				things[_id] = new Square(_id, false, function(){}, actions['axe'].collide, default_end, 20, player.pos.x + (things[id].offset*R*direction.x), player.pos.y + (things[id].offset*R*direction.y));	
				things[_id].owner = player.id;
				things[_id].weapon_root = id;
				things[_id].direction = things[id].direction;
				things[_id].block = true;
				things[_id].is_weapon = true;
				things[id].sections[x] = _id;
			}
			
			player.weapons['sword'] = id;
			
			setTimeout(function(){
				if(things[id]) things[id].end();
			}, 150)
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
			if(thing.block){
				this.end();
				return;
			}				
			if(!(this.collisions.indexOf(thing.id) >= 0)){
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
			},20)	

			//setTimeout(function(){clearInterval(beam_interval)}, 500)
		}
	},
	dodge: object = {//note this is for players not agents
		cost: 1,
		go: function(player, coord){
			if(player.phase == "moving"){
				var dx = player.pos.x;
				var dy = player.pos.y;
				if(player.up){ dy -= 1; }
				else if(player.down){ dy += 1; }
				if(player.left){ dx -= 1; }
				else if(player.right){ dx += 1; }
				if((dx - player.pos.x) == 0 && (dy - player.pos.y) == 0) player.dodge_in_place = true;
				else player.dodge_in_place = false;
				player.phase_count = 0;
				player.phase_speed = player.dodge_speed;
				player.phase_time = player.dodge_distance;
				player.phase_direction.x = dx - player.pos.x;
				player.phase_direction.y = dy - player.pos.y;
				player.phase_direction.normalize();
				player.phase = "dodging";
			}
		}
	},
	freeze: object = {
		cost: 1,
		collide: function(thing){
			if(!(this.collisions.indexOf(thing.id) >= 0)){				
				if(thing.is_agent){
					thing.phase = 'frozen';
					thing.phase_count = 0;
					thing.phase_time = 100;
				}
				this.collisions.push(thing.id);
			}	
		},
		go: function(player, coord){		
			var direction = new victor(coord[0] - player.pos.x, coord[1] - player.pos.y);
			direction.normalize();
			var id = shortid.generate();
			things[id] = new Square(id, false, actions['beam'].step, actions['freeze'].collide, default_end, 60, player.pos.x + (60*direction.x), player.pos.y + (60*direction.y));	
			things[id].direction = direction;
			things[id].speed = 6;
			things[id].color = '#00ccff';
			this.collisions = [];
			things[id].destroy_on_wall = true;
		}
	},
	fist_of_the_north_star: object = {
		cost: 1,
		step: function(){
		},
		collide: function(thing){
			// if(thing.block){
				// things[name].end()
				// return
			// }}
			if(thing.id == this.owner.id) console.log('owner in collide');
			if(!(things[this.weapon_root].collisions.indexOf(thing.id) >= 0)){				
				if(thing.is_agent){
					document.getElementById('omae.mp3').play();
					setTimeout(function(){
						var tl = new victor(-.5, -.5);
						var tr = new victor(.5, -.5);
						var bl = new victor(-.5, .5);
						var br = new victor(.5, .5);
						art_square(thing.pos, tl, 3, thing.size/4, 1000, "#ffffff");
						art_square(thing.pos, tr, 3, thing.size/4, 1000, "#ffffff");
						art_square(thing.pos, bl, 3, thing.size/4, 1000, "#ffffff");
						art_square(thing.pos, br, 3, thing.size/4, 1000, "#ffffff");
						hit(thing, 10000000);
					}, 3000)
				}
				if(thing.isweapon){
					if(thing.owner != this.owner){
						knockback(thing.owner, this.owner)
					}
				}
				things[this.weapon_root].collisions.push(thing.id);
			}	
			return;
		},
		end: function(){
			for(var x in this.sections_array){
				things[this.sections[x]].end();
			}
			delete things[this.owner].weapons['sword'];
			delete things[this.id];
			delete this;
		},
		update: function(){
			this.direction.rotate(this.rotation_speed).normalize();
			for(var x in this.sections_array){
				var R = this.sections_array[x];//RADIUS
				things[this.sections[x]]._pos.x = things[this.owner]._pos.x + (this.offset*R*this.direction.x);
				things[this.sections[x]]._pos.y = things[this.owner]._pos.y + (this.offset*R*this.direction.y);
				colliding(things[this.sections[x]], true);
			}		
		},
		move: function(){
			for(var x in this.sections_array){
				things[this.sections[x]].pos.x = things[this.sections[x]]._pos.x;
				things[this.sections[x]].pos.y = things[this.sections[x]]._pos.y;
			}
		},
		go: function(player, coord){
			if(player.weapons['sword']){ things[player.weapons['sword']].end(); }

			var direction = new victor(coord[0] - player.pos.x, coord[1] - player.pos.y);
			direction.rotate(-1.5).normalize();	
			direction.normalize();
			var id = shortid.generate();
			things[id] = new Square(id, false, actions['fist_of_the_north_star'].step, function(thing){}, actions['axe'].end, 10, player.pos.x + (30*direction.x), player.pos.y + (30*direction.y));	
			things[id].direction = direction;
			things[id].owner = player.id;
			things[id].incorporeal = true;
			things[id].offset = 20;
			things[id].sections_array = [1];
			things[id].sections = {};
			things[id].update = actions['fist_of_the_north_star'].update;
			things[id].move = actions['fist_of_the_north_star'].move;
			things[id].rotation_speed = .30	;
			
			//do sections
			for(var x in things[id].sections_array){
				var R = things[id].sections_array[x];//RADIUS
				var _id = shortid.generate();
				things[_id] = new Square(_id, false, function(){}, actions['fist_of_the_north_star'].collide, default_end, 20, player.pos.x + (things[id].offset*R*direction.x), player.pos.y + (things[id].offset*R*direction.y));	
				things[_id].owner = player.id;
				things[_id].weapon_root = id;
				things[_id].direction = things[id].direction;
				things[_id].block = true;
				things[_id].is_weapon = true;
				things[id].sections[x] = _id;
			}
			
			player.weapons['sword'] = id;
			
			setTimeout(function(){
				if(things[id]) things[id].end();
			}, 150)
		}
	},
	sword: object = {
		cost: 1,
		step: function(){
		},
		collide: function(thing){
			// if(thing.block){
				// things[name].end()
				// return
			// }}
			if(thing.id == this.owner.id) console.log('owner in collide');
			if(!(things[this.weapon_root].collisions.indexOf(thing.id) >= 0)){			
				if(thing.is_agent){
					hit(thing, 5);
					knockback(thing.id, this.owner)
				}
				if(thing.isweapon){
					if(thing.owner != this.owner){
						knockback(thing.owner, this.owner)
					}
				}
				things[this.weapon_root].collisions.push(thing.id);
			}	
			return;
		},
		end: function(){
			for(var x in this.sections_array){
				things[this.sections[x]].end();
			}
			delete things[this.owner].weapons['sword'];
			delete things[this.id];
			delete this;
		},
		update: function(){
			for(var x in this.sections_array){
				var R = this.sections_array[x];//RADIUS
				things[this.sections[x]]._pos.x = things[this.owner]._pos.x + (this.offset*R*this.direction.x);
				things[this.sections[x]]._pos.y = things[this.owner]._pos.y + (this.offset*R*this.direction.y);
				colliding(things[this.sections[x]], true);
			}		
		},
		move: function(){
			for(var x in this.sections_array){
				things[this.sections[x]].pos.x = things[this.sections[x]]._pos.x;
				things[this.sections[x]].pos.y = things[this.sections[x]]._pos.y;
			}
		},
		go: function(player, coord){
			if(player.weapons['sword']){ things[player.weapons['sword']].end(); }

			var direction = new victor(coord[0] - player.pos.x, coord[1] - player.pos.y);
			direction.normalize();
			var id = shortid.generate();
			things[id] = new Square(id, false, actions['sword'].step, function(thing){}, actions['sword'].end, 10, player.pos.x + (30*direction.x), player.pos.y + (30*direction.y));	
			things[id].direction = direction;
			things[id].owner = player.id;
			things[id].incorporeal = true;
			things[id].offset = 20;
			things[id].sections_array = [1,2,3,4,5];
			things[id].sections = {};
			things[id].update = actions['sword'].update;
			things[id].move = actions['sword'].move;
			
			//do sections
			for(var x in things[id].sections_array){
				var R = things[id].sections_array[x];//RADIUS
				var _id = shortid.generate();
				things[_id] = new Square(_id, false, function(){}, actions['sword'].collide, default_end, 20, player.pos.x + (things[id].offset*R*direction.x), player.pos.y + (things[id].offset*R*direction.y));	
				things[_id].owner = player.id;
				things[_id].weapon_root = id;
				things[_id].direction = things[id].direction;
				things[_id].block = true;
				things[_id].is_weapon = true;
				things[id].sections[x] = _id;
			}
			
			player.weapons['sword'] = id;
			
			setTimeout(function(){
				if(things[id]) things[id].end();
			}, 500)
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
					this._pos.x += this.direction.x*this.speed;
					this._pos.y += this.direction.y*this.speed;
					this.dodge_cd_count++;
					if(this.dodge_cd_count >= this.dodge_cd){//if dodge cd up - do a dodge - make cd variable????
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
						this.phase_time = this.dodge_distance;
						this.phase_speed = this.dodge_speed;
						this.phase_count = 0;
						this.phase = 'dodging';
					}
					this.shoot_cd_count++;
					if(this.shoot_cd_count >= this.shoot_cd){//if shoot cooldown up - do a shoot
						this.shoot_cd_count = 0;
						actions['beam'].go(this, [things['player'].pos.x, things['player'].pos.y]);//todo - get target
					}							
					break;
				case 'dodging':
					this._pos.x += this.phase_direction.x * this.phase_speed;
					this._pos.y += this.phase_direction.y * this.phase_speed;
					this.phase_count += 1;
					if(this.phase_count == this.phase_time) this.phase = "moving";		
					break;
				case 'knockback':
					this._pos.x += this.phase_direction.x * this.phase_speed;
					this._pos.y += this.phase_direction.y * this.phase_speed;
					this.phase_count += 1;
					if(this.phase_count >= this.phase_time) this.phase = "moving";
					break;
				case 'frozen':
					this.phase_count += 1;
					if(this.phase_count == this.phase_time) this.phase = "moving";
					break;
				default:
					console.log('no state', this.phase);
			}
			if(!colliding(this, true)){ 
				this.pos.x = this._pos.x;
				this.pos.y = this._pos.y;
				return;
			}
		},
		collide: function(square){
			
		},
		end: function(){
			
		},
		go: function(){
			var id = shortid.generate();
			things[id] = new Square(id, true, agents['agent'].step, agents['agent'].collide(), default_end, 20, -100, -100);
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
	samurai: object = {
		step: function(){
			this._pos.x = this.pos.x;
			this._pos.y = this.pos.y
			var target = things[this.target];
			var distance = Math.sqrt(Math.pow(target.pos.x - this.pos.x, 2) + Math.pow(target.pos.y - this.pos.y, 2));
			this.direction.x = target.pos.x - this.pos.x;
			this.direction.y = target.pos.y - this.pos.y
			this.direction.normalize();
			//handle null targets	
				
			switch(this.phase){
				case 'default':		
					if(this.attack_phase == 'attacking'){
						if(!this.has_attacked){//swing sword if haven't already
							this.has_attacked = true;
							actions['axe'].go(things[this.id], [target.pos.x, target.pos.y]);
						}
						this.attack_phase_count++;
						if(this.attack_phase_count == this.attack_duration){//retreat if attack duration is up
							this.attack_phase = 'waiting';
							this.has_attacked = false;
							this.attack_phase_count = 0;
							
							this.phase = 'dodging';						
							this.phase_direction.x = this.pos.x - target.pos.x;
							this.phase_direction.y = this.pos.y - target.pos.y;
							this.phase_direction.normalize();
							this.phase_count = 0;
							this.phase_time = this.dodge_distance;
							this.phase_speed = this.dodge_speed;
						}
						else{//maintain a distance of 100
							if(target != null){
								if(distance > 100){
									this._pos.x = this.pos.x + (this.direction.x * this.speed);
									this._pos.y = this.pos.y + (this.direction.y * this.speed);
								}
								else if(distance < 100){
									this._pos.x = this.pos.x - (this.direction.x * this.speed);
									this._pos.y = this.pos.y - (this.direction.y * this.speed);
								}
							}
						}
					}				
					else if(this.attack_phase == 'waiting'){
						this.attack_phase_count++;
						if(target != null){
							if(distance > 400){//maintain a distance of 400
								this._pos.x = this.pos.x + (this.direction.x * this.speed);
								this._pos.y = this.pos.y + (this.direction.y * this.speed);
							}
							else if(distance < 400){
								this._pos.x = this.pos.x - (this.direction.x * this.speed);
								this._pos.y = this.pos.y - (this.direction.y * this.speed);
							}
							if(this.attack_phase_count >= this.attack_cd){//if attack cooldown is up - attack
								this.attack_phase = 'attacking';	
								this.attack_phase_count = 0;
							
								this.phase = 'dodging';
								this.phase_direction.x = this.direction.x;
								this.phase_direction.y = this.direction.y;
								this.phase_count = 0;
								this.phase_time = (((distance - 60) / this.dodge_speed) > 0) ? ((distance - 60) / this.dodge_speed) : 0;
								//this.phase_time = distance / this.dodge_speed;
								this.phase_speed = this.dodge_speed;
							}
						}
					}
					break;
				case 'dodging':
					this._pos.x += this.phase_direction.x * this.phase_speed;
					this._pos.y += this.phase_direction.y * this.phase_speed;
					this.phase_count += 1;
					if(this.phase_count >= this.phase_time) this.phase = "default";
					break;
				case 'knockback':
					this._pos.x += this.phase_direction.x * this.phase_speed;
					this._pos.y += this.phase_direction.y * this.phase_speed;
					this.phase_count += 1;
					if(this.phase_count >= this.phase_time) this.phase = "default";
					break;
				case 'frozen':
					this.phase_count += 1;
					if(this.phase_count == this.phase_time) this.phase = "default";
					break;
				default:
					console.log('no state');
			}
				
			for(var weapon in this.weapons){
				if (typeof things[this.weapons[weapon]] != 'undefined') things[this.weapons[weapon]].update();
				else console.log('UNDEFINED: things[weapon] IN player_step() - update', things[this.weapons[weapon]]);
			}
			
			if(!colliding(this, true)){
				for(var weapon in this.weapons){
					if (typeof things[this.weapons[weapon]] != 'undefined') things[this.weapons[weapon]].move();
					else console.log('UNDEFINED: things[weapon] IN player_step() - move');
				}
				this.pos.x = this._pos.x;
				this.pos.y = this._pos.y;
				return;
			}
		},
		collide: function(){
			
		},
		end: function(){
			
		},
		go: function(){
			var id = shortid.generate();
			things[id] = new Square(id, true, agents['samurai'].step, agents['samurai'].collide, default_end, 20, -3000, -3000, '#000000');
			things[id].target = 'player';//todo set target to closest player
			things[id].phase = 'default';
			
			things[id].attack_phase = 'waiting';
			things[id].attack_cd = 300;
			things[id].attack_duration = 50;
			things[id].attack_phase_count = 0;
			things[id].has_attacked = false;
			
			things[id].dodge_speed = 20;
			things[id].dodge_distance = 30;
			things[id].speed = 2;
			things[id].health = 10;
		
			random_teleport(things[id]);
		},		
	},
	samurai_boss: object = {
		step: function(){
			this._pos.x = this.pos.x;
			this._pos.y = this.pos.y
			var target = things[this.target];
			var distance = Math.sqrt(Math.pow(target.pos.x - this.pos.x, 2) + Math.pow(target.pos.y - this.pos.y, 2));
			this.direction.x = target.pos.x - this.pos.x;
			this.direction.y = target.pos.y - this.pos.y
			this.direction.normalize();
			//handle null targets	
				
			switch(this.phase){
				case 'default':		
					if(this.attack_phase == 'attacking'){
						if(!this.has_attacked){//swing sword if haven't already
							this.has_attacked = true;
							actions['axe'].go(things[this.id], [target.pos.x, target.pos.y]);
						}
						this.attack_phase_count++;
						if(this.attack_phase_count == this.attack_duration){//retreat if attack duration is up
							this.attack_phase = 'waiting';
							this.has_attacked = false;
							this.attack_phase_count = 0;
							
							this.phase = 'dodging';						
							this.phase_direction.x = this.pos.x - target.pos.x;
							this.phase_direction.y = this.pos.y - target.pos.y;
							this.phase_direction.normalize();
							this.phase_count = 0;
							this.phase_time = this.dodge_distance;
							this.phase_speed = this.dodge_speed;
						}
						else{//maintain a distance of 100
							if(target != null){
								if(distance > 100){
									this._pos.x = this.pos.x + (this.direction.x * this.speed);
									this._pos.y = this.pos.y + (this.direction.y * this.speed);
								}
								else if(distance < 100){
									this._pos.x = this.pos.x - (this.direction.x * this.speed);
									this._pos.y = this.pos.y - (this.direction.y * this.speed);
								}
							}
						}
					}				
					else if(this.attack_phase == 'waiting'){
						this.attack_phase_count++;
						if(target != null){
							if(distance > 400){//maintain a distance of 400
								this._pos.x = this.pos.x + (this.direction.x * this.speed);
								this._pos.y = this.pos.y + (this.direction.y * this.speed);
							}
							else if(distance < 400){
								this._pos.x = this.pos.x - (this.direction.x * this.speed);
								this._pos.y = this.pos.y - (this.direction.y * this.speed);
							}
							if(this.attack_phase_count >= this.attack_cd){//if attack cooldown is up - attack
								this.attack_phase = 'attacking';	
								this.attack_phase_count = 0;
							
								this.phase = 'dodging';
								this.phase_direction.x = this.direction.x;
								this.phase_direction.y = this.direction.y;
								this.phase_count = 0;
								this.phase_time = (((distance - 60) / this.dodge_speed) > 0) ? ((distance - 60) / this.dodge_speed) : 0;
								//this.phase_time = distance / this.dodge_speed;
								this.phase_speed = this.dodge_speed;
							}
						}
					}
					break;
				case 'dodging':
					this._pos.x += this.phase_direction.x * this.phase_speed;
					this._pos.y += this.phase_direction.y * this.phase_speed;
					this.phase_count += 1;
					if(this.phase_count >= this.phase_time) this.phase = "default";
					break;
				case 'knockback':
					this._pos.x += this.phase_direction.x * this.phase_speed;
					this._pos.y += this.phase_direction.y * this.phase_speed;
					this.phase_count += 1;
					if(this.phase_count >= this.phase_time) this.phase = "default";
					break;
				case 'frozen':
					this.phase_count += 1;
					if(this.phase_count == this.phase_time) this.phase = "default";
					break;
				default:
					console.log('no state');
			}
				
			for(var weapon in this.weapons){
				if (typeof things[this.weapons[weapon]] != 'undefined') things[this.weapons[weapon]].update();
				else console.log('UNDEFINED: things[weapon] IN player_step() - update', things[this.weapons[weapon]]);
			}
			
			if(!colliding(this, true)){
				for(var weapon in this.weapons){
					if (typeof things[this.weapons[weapon]] != 'undefined') things[this.weapons[weapon]].move();
					else console.log('UNDEFINED: things[weapon] IN player_step() - move');
				}
				this.pos.x = this._pos.x;
				this.pos.y = this._pos.y;
				return;
			}
		},
		collide: function(){
			
		},
		end: function(){
			
		},
		go: function(){
			var id = shortid.generate();
			things[id] = new Square(id, true, agents['samurai'].step, agents['samurai'].collide, default_end, 20, -3000, -3000, '#ffffff');
			things[id].target = 'player';//todo set target to closest player
			things[id].phase = 'default';
			
			things[id].attack_phase = 'waiting';
			things[id].attack_cd = 300;
			things[id].attack_duration = 50;
			things[id].attack_phase_count = 0;
			things[id].has_attacked = false;
			
			things[id].dodge_speed = 20;
			things[id].dodge_distance = 30;
			things[id].speed = 2;
			things[id].health = 10;
		
			random_teleport(things[id]);
		},		
	},
	test: object = {
		//damage sponge - for testing
		step: function(){
			this._pos.x = this.pos.x;
			this._pos.y = this.pos.y;
				
			switch(this.phase){
				case 'moving':						
					break;
				case 'dodging':
					this._pos.x += this.phase_direction.x * this.phase_speed;
					this._pos.y += this.phase_direction.y * this.phase_speed;
					this.phase_count += 1;
					if(this.phase_count == this.dodge_distance) this.phase = "moving";					
					break;
				case 'knockback':
					this._pos.x += this.phase_direction.x * this.phase_speed;
					this._pos.y += this.phase_direction.y * this.phase_speed;
					this.phase_count += 1;
					if(this.phase_count == this.phase_time) this.phase = "moving";
					break;
				case 'frozen':
					this.phase_count += 1;
					if(this.phase_count == this.phase_time) this.phase = "moving";
					break;
				default:
					console.log('no state');
			}
			
			if(!colliding(this, true)){
				this.pos.x = this._pos.x;
				this.pos.y = this._pos.y;
				return;
			}
		},
		collide: function(square){
			
		},
		end: function(){
			
		},
		go: function(){
			var id = shortid.generate();
			things[id] = new Square(id, true, agents['test'].step, agents['test'].collide, default_end, 100, -100, -100);
			things[id].health = 20;
			random_teleport(things[id]);
		}
	},

};



//GAME VARIABLES



var things = {};
var players = {};
var reverse = new victor(-1,-1)	;
var width = 1000;
var height = 1000;
var style_width = 500;
var style_height = 500;//NOTE NEED TO CHANGE THIS IN THE STYLE AND HERE - canvas clicks will be wrong otherwise
var width_ratio = width / style_width;
var height_ratio = height / style_height;
	
var canvas = {};
var hp_canvas = {};
var stamina_canvas = {};
ctx = {};
hp_ctx = {};
stamina_ctx = {};
	
// var canvas = document.getElementById("field");
// var hp_canvas = document.getElementById("hp");
// var stamina_canvas = document.getElementById("stamina");
// var ctx = canvas.getContext("2d");
// var hp_ctx = hp_canvas.getContext("2d");
// var stamina_ctx = stamina_canvas.getContext("2d");
// hp_ctx.fillStyle = "#e60000";
// stamina_ctx.fillStyle = "#00b300";

function knockback(target_id, source_id){
	if((typeof things[target_id] != 'undefined') && (typeof things[source_id] != 'undefined')){
		things[target_id].phase = 'knockback';
		things[target_id].phase_count = 0;
		things[target_id].phase_time = 10;
		things[target_id].phase_speed = 25;
		things[target_id].phase_direction.x = things[target_id].pos.x - things[source_id].pos.x;
		things[target_id].phase_direction.y = things[target_id].pos.y - things[source_id].pos.y;
		things[target_id].phase_direction.normalize();
	}
}

function colliding(this_square, do_collision) {
	//NOTE this works only for squares
	var this_size = this_square.size / 2;
	
	//wall
	if(this_square._pos.x < this_size || this_square._pos.x > (width-this_size) || this_square._pos.y < this_size || this_square._pos.y > (height-this_size)){
		if(this_square.destroy_on_wall){
			console.log('destroy_on_wall');
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
		if((this_square.id != that_square.id) && !that_square.incorporeal){
			var that_size = that_square.size / 2;
			if((this_square._pos.x+this_size) >= (that_square._pos.x-that_size)&&(this_square._pos.x-this_size) <= (that_square._pos.x+that_size) &&
			   (this_square._pos.y+this_size) >= (that_square._pos.y-that_size)&&(this_square._pos.y-this_size) <= (that_square._pos.y+that_size)){ 	
				if(that_square.is_weapon || this_square.is_weapon){
					if((that_square.owner != this_square.id) && (that_square.owner != this_square.owner) && (this_square.owner != that_square.id) && do_collision){
						this_square.collide(that_square);
						//no return because weapon don't block
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
	if(thing.is_agent){
		if((thing.phase != "dodging") && (thing.phase != "dead")){
			thing.health -= damage;
		}
	
		if(thing.health <= 0){
			thing.end();
			return;
		}
	}
}

function player_step() {
	this._pos.x = this.pos.x;
	this._pos.y = this.pos.y;
	var _size = this.size/2;
	switch(this.phase){
		case 'moving':
			if(this.gamepad_index != null){
				var gamepad = navigator.getGamepads()[this.gamepad_index];
				if(gamepad){
					if(gamepad.buttons[12].pressed) this.up = true;
					else this.up = false;
					if(gamepad.buttons[13].pressed) this.down = true;
					else this.down = false;
					if(gamepad.buttons[14].pressed) this.left = true;
					else this.left = false;
					if(gamepad.buttons[15].pressed) this.right = true;
					else this.right = false;
					
					//get direction from movement or use R3???
					var dx = this.pos.x;
					var dy = this.pos.y;
					if(this.up) dy -= 1;
					else if(this.down) dy += 1;
					if(this.left) dx -= 1;
					else if(this.right) dx += 1;
					
					if(gamepad.buttons[0].pressed){//X
						if(!this.X_pressed){
							do_action(things[this.id], actions[things[this.id].space], [dx, dy]);
							this.X_pressed = true;
						}
					}
					else this.X_pressed = false;
					if(gamepad.buttons[1].pressed){//O
						if(!this.O_pressed){
							do_action(things[this.id], actions[things[this.id].shift], [dx, dy]);
							this.O_pressed = true;
						}
					}
					else this.O_pressed = false;
					if(gamepad.buttons[2].pressed){//[] 
						if(!this.square_pressed){
							do_action(things[this.id], actions[things[this.id].m1], [dx, dy]);
							this.square_pressed = true;
						}
					}
					else this.square_pressed = false;
					if(gamepad.buttons[3].pressed){//<|
						if(!this.triangle_pressed || true){
							do_action(things[this.id], actions[things[this.id].m2], [dx, dy]);	
							this.triangle_pressed = true;
						}
					}
					else this.triangle_pressed = false;
					for(var x in gamepad.buttons){
						//if(gamepad.buttons[x].pressed) console.log(x, gamepad.buttons[x]);
					}
				}
			}
			if(this.up){ this._pos.y -= this.speed; }
			else if(this.down){ this._pos.y += this.speed; }
			if(this.left){ this._pos.x -= this.speed; }
			else if(this.right){ this._pos.x += this.speed; }
			break;
		case 'dodging':
			if(!this.dodge_in_place){
				this._pos.x += this.phase_direction.x * this.phase_speed;
				this._pos.y += this.phase_direction.y * this.phase_speed;
			}
			this.phase_count += 1;
			if(this.phase_count == this.phase_time) this.phase = "moving";
			break;
		case 'knockback':
			this._pos.x += this.phase_direction.x * this.phase_speed;
			this._pos.y += this.phase_direction.y * this.phase_speed;
			this.phase_count += 1;
			if(this.phase_count >= this.phase_time) this.phase = "moving";
			break;
		case 'frozen':
			this.phase_count += 1;
			if(this.phase_count == this.phase_time) this.phase = "moving";
			break;
		default:
			console.log('no state', this.phase);
	}
	
	for(var weapon in this.weapons){
		if (typeof things[this.weapons[weapon]] != 'undefined') things[this.weapons[weapon]].update();
		else console.log('UNDEFINED: things[weapon] IN player_step() - update', things[this.weapons[weapon]]);
	}
	
	if(!colliding(this, true)){
		for(var weapon in this.weapons){
			if (typeof things[this.weapons[weapon]] != 'undefined') things[this.weapons[weapon]].move();
			else console.log('UNDEFINED: things[weapon] IN player_step() - move');
		}
		this.pos.x = this._pos.x;
		this.pos.y = this._pos.y;
		return;
	}
}

function player_collide(square) {}//this is supposed to be empty

function player_end() {
	var id = this.id;
	things[id].phase = 'dead';
	things[id].pos.x = -100;
	things[id].pos.y = -100;
	setTimeout(function(){
		things[id].health = 10;
		things[id].phase = 'moving';
		random_teleport(things[id]);
	}, 5000);
}

function remove_player(id){
	_.forEach(things[id].weapons, function(weapon){
		things[weapon].end();
	});	
	delete things[id];
	delete players[id];
}

function create_player(id) {
	things[id] = new Square(id, true, player_step, player_collide, player_end, 15, 250, 250);
	things[id].up = false;
	things[id].down = false;
	things[id].left = false;
	things[id].right = false;
	things[id].X_pressed = false;
	things[id].O_pressed = false;
	things[id].square_pressed = false;
	things[id].triangle_pressed = false;
	things[id].gamepad_direction = new victor(0,0);
	things[id].phase = 'moving';
	things[id].speed = 5;
	things[id].space = 'dodge';
	things[id].shift = 'freeze';
	things[id].m1 = 'sword';
	things[id].m2 = 'axe';
	things[id].is_player = true;
	things[id].gamepad_index = null;
	players[id] = things[id];
	random_teleport(things[id]);
	return id;
}

create_player('player');



//INTERVALS (LOOPS)

var intervals = {};
var chess_clock = {};
var bekaari = {}

function reset_chess_clock(){
var now = new Date().getTime();
	chess_clock['end_time'] = new Date(now + 60*60000).getTime();
	chess_clock['player1_time'] = new Date(now).getTime();
	chess_clock['player1_turn_start_time'] = new Date(now).getTime();
	chess_clock['player2_time'] = new Date(now).getTime();
	chess_clock['player2_turn_start_time'] = new Date(now).getTime();
	chess_clock['turn'] = 0;
	chess_clock['hold_turn'] = 1; //for pausing
	display_chess_clock('player1');
	display_chess_clock('player2');	
}

function initiate_chess_clock(){
	console.log('initiate chess clock');
	chess_clock['player1_div'] = document.getElementById("player1_div");
	chess_clock['player2_div'] = document.getElementById("player2_div");
	var now = new Date().getTime();
	chess_clock['end_time'] = new Date(now + 60*60000).getTime();
	chess_clock['player1_time'] = new Date(now).getTime();
	chess_clock['player1_turn_start_time'] = new Date(now).getTime();
	chess_clock['player2_time'] = new Date(now).getTime();
	chess_clock['player2_turn_start_time'] = new Date(now).getTime();
	chess_clock['turn'] = 0;
	chess_clock['hold_turn'] = 1; //for pausing
	display_chess_clock('player1');
	display_chess_clock('player2');
	//on turn start get a new now time
	//on turn end find difference from turn start time.
		// add that to player_time
		// calculate remaining time
		
		
	document.getElementById("chess_clock_start_stop").onclick = function(){
		if(chess_clock['turn'] == 0){
			unpause_chess_clock();
		}
		else{
			pause_chess_clock();
		}
	}
	document.getElementById("chess_clock_switch").onclick = turn_switch_chess_clock;
	document.getElementById("chess_clock_reset").onclick = reset_chess_clock;
}

function turn_start_chess_clock(player){
	chess_clock[player + '_turn_start_time'] = new Date().getTime();
}

function turn_end_chess_clock(player){
	var now = new Date().getTime();
	var distance = now - chess_clock[player + '_turn_start_time'];
	chess_clock[player + '_time'] = new Date(chess_clock[player + '_time'] + distance).getTime();
}

function turn_switch_chess_clock(){
	if (chess_clock['turn'] == 1){
		chess_clock['turn'] = 2;
		turn_end_chess_clock('player1');
		turn_start_chess_clock('player2');
	}
	else if (chess_clock['turn'] == 2){
		chess_clock['turn'] = 1;
		turn_end_chess_clock('player2');
		turn_start_chess_clock('player1');
	}
}

function pause_chess_clock(){
	if (chess_clock['turn'] == 1){
		chess_clock['hold_turn'] = chess_clock['turn'];
		chess_clock['turn'] = 0;
		turn_end_chess_clock('player1');
	}
	else if (chess_clock['turn'] == 2){
		chess_clock['hold_turn'] = chess_clock['turn'];
		chess_clock['turn'] = 0;
		turn_end_chess_clock('player2');
	}	
}

function unpause_chess_clock(){
	if (chess_clock['hold_turn'] == 1){
		turn_start_chess_clock('player1');
		chess_clock['turn'] = 1;
	}
	else if (chess_clock['hold_turn'] == 2){
		turn_start_chess_clock('player2');
		chess_clock['turn'] = 2;
	}	
}

function display_chess_clock(player){
	var distance = chess_clock['end_time'] - chess_clock[player + '_time'];
	var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString();
	var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)).toString();
	var seconds = Math.floor((distance % (1000 * 60)) / 1000).toString();
	chess_clock[player + '_div'].innerHTML = hours + ':' + minutes + ':' + seconds;
	
	if(chess_clock['turn'] == 1){
		chess_clock['player1_div'].classList.add('active_player');
		chess_clock['player2_div'].classList.remove('active_player');
	}
	else if(chess_clock['turn'] == 2){
		chess_clock['player2_div'].classList.add('active_player');
		chess_clock['player1_div'].classList.remove('active_player');
	}
}

function stop_chess_clock(){
	console.log('stop chess clock');
	clearInterval(intervals['chess_clock_interval']);
}

function start_chess_clock(){
	console.log('start chess clock');
	intervals['chess_clock_interval'] = setInterval(function(){
		if(chess_clock['turn'] == 1){
			turn_end_chess_clock('player1');
			turn_start_chess_clock('player1');
			display_chess_clock('player1');
		}
		else if(chess_clock['turn'] == 2){
			turn_end_chess_clock('player2');
			turn_start_chess_clock('player2');
			display_chess_clock('player2');
		}		
	}, 500)
}

var dude_list = {
	obstacle: object = {
		description: "obstacle:<br/> can't move can't be captured",
		tag: '  #',
		mobility: false,
		movement_patterns: [],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [],
		custom_attack_pattern: function(position){
			return [];
		},
	},
	wall: object = {
		description: "wall:<br/> can't move can be captured",
		tag: ' ---',
		mobility: false,
		movement_patterns: [],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [],
		custom_attack_pattern: function(position){
			return [];
		},
	},
	rook: object = {
		description: 'rook:<br/>moves/attacks on columns and rows.',
		tag: 'Rk',
		mobility: false,
		movement_patterns: [
			[0, -1, 1, 7],
			[1, 0, 1, 7],
			[0, 1, 1, 7],
			[-1, 0, 1, 7]
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [
			[0, -1, 1, 7],
			[1, 0, 1, 7],
			[0, 1, 1, 7],
			[-1, 0, 1, 7]
		],
		custom_attack_pattern: function(position){
			return [];
		},
	},
	pawn: object = {
		description: 'pawn:<br/>moves on columns and rows. attacks on diagonals.',
		tag: 'p',
		mobility: false,
		movement_patterns: [
			[0, -1, 1, 1],
			[1, 0, 1, 1],
			[0, 1, 1, 1],
			[-1, 0, 1, 1]
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [
			[1, -1, 1, 1],
			[1, 1, 1, 1],
			[-1, -1, 1, 1],
			[-1, 1, 1, 1]
		],
		custom_attack_pattern: function(position){
			return [];
		},
	},
	pawn_S: object = {
		description: 'pawn:<br/>moves on columns and rows. attacks on diagonals.',
		tag: 'ps',
		mobility: false,
		movement_patterns: [
			[0, 1, 1, 1]
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [
			[1, 1, 1, 1],
			[-1, 1, 1, 1]
		],
		custom_attack_pattern: function(position){
			return [];
		},
	},
	pawn_N: object = {
		description: 'pawn:<br/>moves on columns and rows. attacks on diagonals.',
		tag: 'pn',
		mobility: false,
		movement_patterns: [
			[0, -1, 1, 1]
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [
			[1, -1, 1, 1],
			[-1, -1, 1, 1]
		],
		custom_attack_pattern: function(position){
			return [];
		},
	},
	pawn_E: object = {
		description: 'pawn:<br/>moves on columns and rows. attacks on diagonals.',
		tag: 'pe',
		mobility: false,
		movement_patterns: [
			[1, 0, 1, 1]
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [
			[1, -1, 1, 1],
			[1, 1, 1, 1]
		],
		custom_attack_pattern: function(position){
			return [];
		},
	},
	pawn_W: object = {
		description: 'pawn:<br/>moves on columns and rows. attacks on diagonals.',
		tag: 'pw',
		mobility: false,
		movement_patterns: [
			[-1, 0, 1, 1]
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [
			[-1, -1, 1, 1],
			[-1, 1, 1, 1]
		],
		custom_attack_pattern: function(position){
			return [];
		},
	},
	bishop: object = {
		description: 'bishop:<br/>moves/attacks on diagonals.',
		tag: 'Bh',
		mobility: false,
		movement_patterns: [
			[1, -1, 1, 7],
			[1, 1, 1, 7],
			[-1, -1, 1, 7],
			[-1, 1, 1, 7]
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [
			[1, -1, 1, 7],
			[1, 1, 1, 7],
			[-1, -1, 1, 7],
			[-1, 1, 1, 7]
		],
		custom_attack_pattern: function(position){
			return [];
		},
	},
	queen: object = {
		description: 'quen:<br/>moves/attacks in all directions.',
		tag: 'Qn',
		mobility: false,
		movement_patterns: [
			[1, -1, 1, 7],
			[1, 1, 1, 7],
			[-1, -1, 1, 7],
			[-1, 1, 1, 7],
			[0, -1, 1, 7],
			[1, 0, 1, 7],
			[0, 1, 1, 7],
			[-1, 0, 1, 7]
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [
			[1, -1, 1, 7],
			[1, 1, 1, 7],
			[-1, -1, 1, 7],
			[-1, 1, 1, 7],
			[0, -1, 1, 7],
			[1, 0, 1, 7],
			[0, 1, 1, 7],
			[-1, 0, 1, 7]
		],
		custom_attack_pattern: function(position){
			return [];
		},
	},
	king: object = {
		description: 'king:<br/>moves/attacks in all directions.',
		tag: 'Kg',
		mobility: false,
		movement_patterns: [
			[1, -1, 1, 1],
			[1, 1, 1, 1],
			[-1, -1, 1, 1],
			[-1, 1, 1, 1],
			[0, -1, 1, 1],
			[1, 0, 1, 1],
			[0, 1, 1, 1],
			[-1, 0, 1, 1]
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [
			[1, -1, 1, 1],
			[1, 1, 1, 1],
			[-1, -1, 1, 1],
			[-1, 1, 1, 1],
			[0, -1, 1, 1],
			[1, 0, 1, 1],
			[0, 1, 1, 1],
			[-1, 0, 1, 1]
		],
		custom_attack_pattern: function(position){
			return [];
		},
	},
	knight: object = {
		description: 'knight:<br/>moves/attacks in an L patter - can move over intervening dudes.',
		tag: 'Kt',
		mobility: false,
		movement_patterns: [
		],
		custom_movement_pattern: function(position){
			var positions = [];
			positions.push([position[0]+2,position[1]+1]);
			positions.push([position[0]+2,position[1]-1]);
			positions.push([position[0]-2,position[1]+1]);
			positions.push([position[0]-2,position[1]-1]);
			positions.push([position[0]+1,position[1]+2]);
			positions.push([position[0]+1,position[1]-2]);
			positions.push([position[0]-1,position[1]+2]);
			positions.push([position[0]-1,position[1]-2]);
			return positions;
		},
		attack_patterns: [
		],
		custom_attack_pattern: function(position){
			var positions = [];
			positions.push([position[0]+2,position[1]+1]);
			positions.push([position[0]+2,position[1]-1]);
			positions.push([position[0]-2,position[1]+1]);
			positions.push([position[0]-2,position[1]-1]);
			positions.push([position[0]+1,position[1]+2]);
			positions.push([position[0]+1,position[1]-2]);
			positions.push([position[0]-1,position[1]+2]);
			positions.push([position[0]-1,position[1]-2]);
			return positions;
		},
	},

};
var dude_list_keys = Object.keys(dude_list);

function get_positions(dude, position){
	//pattern = [x,y,min,max]
	return dude_list[dude].custom_movement_pattern(position).concat(
		_.flatten(_.map(dude_list[dude].movement_patterns, function(pattern, index, collection){
			var positions = [];
			for(var i = pattern[2]; i <= pattern[3]; i++){
				var new_position = [position[0]+(pattern[0] * i), position[1]+(pattern[1] * i)];
				if(get_occupant_position(new_position)){
					i = pattern[3] + 1;
					break;
				}
				else{
					positions.push(new_position);
				}
			}
			return positions;
		}))
	);
}

function get_atack_positions(dude, position){
	//pattern = [x,y,min,max]
	return dude_list[dude].custom_attack_pattern(position).concat(
		_.flatten(_.map(dude_list[dude].attack_patterns, function(pattern, index, collection){
			var positions = [];
			for(var i = pattern[2]; i <= pattern[3]; i++){
				var new_position = [position[0]+(pattern[0] * i), position[1]+(pattern[1] * i)];
				var occupant = get_occupant_position(new_position);
				if(occupant){
					if(occupant.type != 'obstacle'){
						positions.push(new_position);
					}
					i = pattern[3] + 1;
					break;
					
				}
				else{
					positions.push(new_position);
				}
			}
			return positions;
		}))
	);
}


function Pattern(x, y, min, max){
	this.direction = [x, y];
	this.min = min;
	this.max = max;
}

function Position(x, y){
	this.x = x;
	this.y = y;
	this.occupant = null;//this will the string of the id of the occupant
}

function Dude(id, position, type, color){
	this.id = id;
	this.position = [];
	this.position[0] = position[0];
	this.position[1] = position[1];
	this.type = type;
	this.color = color;
}

function place_dude_with(dude_type, dudes, position, field, color){
	if(bekaari[field][position[0]][position[1]].occupant == null){
		var id = shortid.generate();
		bekaari[dudes][id] = new Dude(id, position, dude_type, color);
		bekaari[field][position[0]][position[1]].occupant = id;
	}
}

function place_dude(){
	if(bekaari['field'][bekaari['selected'][0]][bekaari['selected'][1]].occupant == null){
		var id = shortid.generate();
		bekaari['dudes'][id] = new Dude(id, bekaari['selected'], bekaari['deployment'].selected, bekaari['deployment'].color);
		bekaari['field'][bekaari['selected'][0]][bekaari['selected'][1]].occupant = id;
	}
}

function bekaari_shift_forward(){
	switch(bekaari['game_mode']){
		case 'game_start':
			break;
		case 'deployment':
			var index = dude_list_keys.indexOf(bekaari['deployment'].selected);
			var new_index = 0;
			if((index+1) < dude_list_keys.length) new_index = index+1;
			bekaari['deployment'].selected = dude_list_keys[new_index];
			// document.getElementById('bekaari_infobox').innerHTML = dude_list[bekaari['deployment'].selected].description;
			// bekaari['infobox'].innerHTML = dude_list[bekaari['deployment'].selected].description;
			break;
		default:
	}
}

function bekaari_shift_backward(){
	switch(bekaari['game_mode']){
		case 'game_start':
			break;
		case 'deployment':
			var index = dude_list_keys.indexOf(bekaari['deployment'].selected);
			var new_index = dude_list_keys.length-1;
			if((index-1) >= 0) new_index = index-1;
			bekaari['deployment'].selected = dude_list_keys[new_index];
			// document.getElementById('bekaari_infobox').innerHTML = dude_list[bekaari['deployment'].selected].description;
			// bekaari['infobox'].innerHTML = dude_list[bekaari['deployment'].selected].description;
			break;
		default:
	}
}

color_list = ['#FFFFFF', '#00FF00', '#FF0000', '#00FFFF']
function bekaari_color_shift_forward(){
	switch(bekaari['game_mode']){
		case 'game_start':
			break;
		case 'deployment':
			var index = color_list.indexOf(bekaari['deployment'].color);
			var new_index = 0;
			if((index+1) < color_list.length) new_index = index+1;
			bekaari['deployment'].color = color_list[new_index];
			break;
		default:
	}	
}
function bekaari_color_shift_backward(){
	switch(bekaari['game_mode']){
		case 'game_start':
			break;
		case 'deployment':
			var index = color_list.indexOf(bekaari['deployment'].color);
			var new_index = color_list.length-1;
			if((index-1) >= 0) new_index = index-1;
			bekaari['deployment'].color = color_list[new_index];
			break;
		default:
	}	
}

function bekaari_new_matrix(matrix){
	bekaari[matrix] = [];
	for(var x=0; x<bekaari['width']; x++) {
		bekaari[matrix][x] = [];
		for(var y=0; y<bekaari['height']; y++){
			bekaari[matrix][x][y] = new Position(x, y);
		}
	}
}

function bekaari_select(){
	switch(bekaari['game_mode']){
		case 'game_start':
			switch(bekaari['game_start'].mode){
				case 'idle':
					var occupant = get_occupant_selected();
					if(occupant){
						bekaari['game_start'].selected_id = occupant.id;
						bekaari['game_start'].selected_position[0] = bekaari['selected'][0];
						bekaari['game_start'].selected_position[1] = bekaari['selected'][1];
						bekaari['game_start'].mode = 'moving';
						bekaari['game_start'].selected_positions = _.uniqBy(
							get_positions(occupant.type, occupant.position).concat(get_atack_positions(occupant.type, occupant.position)),
							function(arr){
								return arr[0].toString() + arr[1].toString();
							}
						);
					}
					break;
				case 'moving':
					_.forEach(bekaari['game_start'].selected_positions, function(position){
						if((position[0] == bekaari['selected'][0]) && (position[1] == bekaari['selected'][1])){
							move_dude(bekaari['game_start'].selected_id, bekaari['game_start'].selected_position,  position);
							bekaari['game_start'].mode = 'idle';
						}
					});
					break;
				case 'activating':
					bekaari['game_start'].mode = 'idle';
					break;
				default:
			}
			break;
		case 'deployment':
			place_dude();
			break;
		default:
	}
}

function initiate_chess_map(){
	var field = 'chess_field';
	var dudes = 'chess_dudes';
	
	bekaari_new_matrix(field);
	bekaari[dudes] = {};
	
	var wall_color = '#AAAAAA';
	var rows_1 = [0,1,10,11];
	_.forEach(rows_1, function(y){
		for(var x=0; x<bekaari['width']; x++){
			place_dude_with('obstacle', dudes, [x, y], field, wall_color);
		}
	});
	var rows_2 = [2,3,4,5,6,7,8,9];
	_.forEach(rows_2, function(y){
		for(var a=0; a<8; a++){
			place_dude_with('obstacle', dudes, [a, y], field, wall_color);
		}
		for(var b=16; b<bekaari['width']; b++){
			place_dude_with('obstacle', dudes, [b, y], field, wall_color);
		}
	});
	
	var W_color = '#FFFFFF';
	var E_color = '#FF00FF';
	place_dude_with('rook', dudes, [8, 2], field, W_color);
	place_dude_with('rook', dudes, [8, 9], field, W_color);
	place_dude_with('rook', dudes, [15, 2], field, E_color);
	place_dude_with('rook', dudes, [15, 9], field, E_color);
	
	place_dude_with('knight', dudes, [8, 3], field, W_color);
	place_dude_with('knight', dudes, [8, 8], field, W_color);
	place_dude_with('knight', dudes, [15, 3], field, E_color);
	place_dude_with('knight', dudes, [15, 8], field, E_color);
	
	place_dude_with('bishop', dudes, [8, 4], field, W_color);
	place_dude_with('bishop', dudes, [8, 7], field, W_color);
	place_dude_with('bishop', dudes, [15, 4], field, E_color);
	place_dude_with('bishop', dudes, [15, 7], field, E_color);
	
	place_dude_with('king', dudes, [8, 5], field, W_color);
	place_dude_with('queen', dudes, [8, 6], field, W_color);
	place_dude_with('king', dudes, [15, 5], field, E_color);
	place_dude_with('queen', dudes, [15, 6], field, E_color);
	
	for(var c=2; c<10; c++){
		place_dude_with('pawn_E', dudes, [9, c], field, W_color);
		place_dude_with('pawn_W', dudes, [14, c], field, E_color);
	}
}

function next_map(){
	console.log('next_map');
	var index = bekaari['maps'].indexOf(bekaari['map']);
	var new_index = bekaari['maps'].length-1;
	if((index-1) >= 0) new_index = index-1;
	bekaari['map'] = bekaari['maps'][new_index];
	if(bekaari['maps'][new_index] == ''){
		bekaari_new();
	}
	else{
		var new_field = bekaari['maps'][new_index] + 'field';
		var new_dudes = bekaari['maps'][new_index] + 'dudes';
		console.log(new_field, new_dudes);
		// console.log(bekaari[new_field], bekaari[new_dudes]);
		set_map('field', bekaari[new_field], 'dudes', bekaari[new_dudes]);
	}
}

function set_map(field, new_field, dudes, new_dudes){
	bekaari_new_matrix(field);
	for(var x=0; x<bekaari['width']; x++){
		for(var y=0; y<bekaari['height']; y++){
			bekaari[field][x][y].occupant = new_field[x][y].occupant;
		}
	}
	bekaari[dudes] = {};
	_.forEach(new_dudes, function(dude){
		bekaari[dudes][dude.id] = new Dude(dude.id, dude.position, dude.type, dude.color);
	});
}

function bekaari_restart(){
	console.log('bekaari_restart');
	set_map('field', bekaari['save_field'], 'dudes', bekaari['save_dudes']);
	bekaari['game_mode'] = 'game_start';
	bekaari['game_start'].mode = 'idle';
	bekaari['game_mode_infobox'].innerHTML = 'Game Start';
}

function bekaari_new(){
	console.log('bekaari_new');
	bekaari['dudes'] = {};
	bekaari['game_mode'] = 'deployment';
	bekaari_new_matrix('field');
	bekaari['game_mode_infobox'].innerHTML = 'Deployment';
}

function bekaari_start(){
	console.log('bekaari_start');
	set_map('save_field', bekaari['field'], 'save_dudes', bekaari['dudes']);
	bekaari['game_mode'] = 'game_start';
	bekaari['game_start'].mode = 'idle';
	bekaari['game_mode_infobox'].innerHTML = 'Game Start';
}

function initiate_bekaari(){
	//get the canvas element and ctx
	bekaari['grid_canvas'] = document.getElementById("bekaari_grid_canvas");
	bekaari['grid_ctx'] = bekaari['grid_canvas'].getContext("2d");
	bekaari['canvas'] = document.getElementById("bekaari_canvas");
	bekaari['ctx'] = bekaari['canvas'].getContext("2d");
	document.getElementById("bekaari_new").onclick = bekaari_new;
	document.getElementById("bekaari_start").onclick = bekaari_start;
	document.getElementById("bekaari_restart").onclick = bekaari_restart;
	document.getElementById("bekaari_map").onclick = next_map;
	
	//calculate the width and height of field based on canvas size and desired size of position
	bekaari['field'] = [];
	bekaari['save_field'] = [];
	bekaari['position_radius'] = 80;//note: this will be half? 
	bekaari['width'] = bekaari['canvas'].width / bekaari['position_radius'];
	bekaari['height'] = bekaari['canvas'].height / bekaari['position_radius'];
	bekaari['selected'] = [2, 2];
	bekaari['gamepads'] = {};
	bekaari['game_mode'] = 'deployment';
	bekaari['dudes'] = {};
	bekaari['save_dudes'] = {};
	bekaari['deployment'] = {};
	bekaari['deployment'].selected = 'rook';
	bekaari['deployment'].color = '#FFFFFF';
	bekaari['game_start'] = {};
	bekaari['game_start'].mode = 'idle';
	bekaari['game_start'].selected_id = '';
	bekaari['game_start'].selected_positions = [];
	bekaari['game_start'].selected_position = [0,0];
	bekaari['infobox'] = document.getElementById('bekaari_infobox');
	bekaari['game_mode_infobox'] = document.getElementById("bekaari_mode");
	
	bekaari['map'] = '';
	bekaari['maps'] = ['chess_',''];
	
	bekaari_new_matrix('field');
	bekaari_new_matrix('save_field');
	initiate_chess_map();
	bekaari['width_ratio'] = 2;
	bekaari['height_ratio'] = 2;
	bekaari['canvas'].addEventListener("mousedown", function(c){
		coord = [(c.clientX - bekaari['canvas'].offsetLeft) * bekaari['width_ratio'], (c.clientY - bekaari['canvas'].offsetTop - 40) * bekaari['height_ratio']];
		if(c.which == 1){
			//bekaari['selected']][0] = coord;
			// bekaari['selected'] = [Math.floor(coord[0]/bekaari['position_radius']), Math.floor(coord[1]/bekaari['position_radius'])];
			bekaari_select();
		}
		if(c.which == 3){
			bekaari_color_shift_forward();
		}
	}, false);
	bekaari['canvas'].addEventListener("mousewheel", function(c){
		if(c.deltaY > 0){
			bekaari_shift_forward();
		}
		else if(c.deltaY < 0){
			bekaari_shift_backward();
		}
	}, false);
	bekaari['canvas'].addEventListener('mousemove',function(c){
		coord = [(c.clientX - bekaari['canvas'].offsetLeft) * bekaari['width_ratio'], (c.clientY - bekaari['canvas'].offsetTop - 40) * bekaari['height_ratio']];
		bekaari['selected'][0] = Math.floor(coord[0]/bekaari['position_radius']);
		bekaari['selected'][1] = Math.floor(coord[1]/bekaari['position_radius']);
	},false);
	
	//draw grid
	for(var x = 0; x<=bekaari['width']; x++){
		bekaari['grid_ctx'].moveTo(x*bekaari['position_radius'], 0);
		bekaari['grid_ctx'].lineTo(x*bekaari['position_radius'], bekaari['grid_canvas'].height);
	}
	for(var y = 0; y<=bekaari['height']; y++){
		bekaari['grid_ctx'].moveTo(0, y*bekaari['position_radius']);
		bekaari['grid_ctx'].lineTo(bekaari['grid_canvas'].width, y*bekaari['position_radius']);
	}
	bekaari['grid_ctx'].strokeStyle = "grey";
	bekaari['grid_ctx'].stroke();
	//controller stuff?
	//key press?
	//first do draw;
}

function capture_dude(dude_id){
	delete bekaari['dudes'][dude_id];
}

function move_dude(dude_id, old_position, position){
	async.series([
		function(callback) {
			// do some stuff ...
			var occupant = get_occupant_position(position);
			if(occupant){
				if(occupant.type != 'obstacle'){
					capture_dude(occupant.id);
					callback(null, true);
				}
				else{
					callback(null, false);
				}
			}
			else{
				callback(null, true);
			}
		}
	], function(err, result){
		if(result[0]){
			if(bekaari['dudes'][dude_id]){
				bekaari['dudes'][dude_id].position[0] = position[0];
				bekaari['dudes'][dude_id].position[1] = position[1];
			}
			else{
				console.log('dudes[dude_id] undefined???');
			}
			bekaari['field'][old_position[0]][old_position[1]].occupant = '';
			bekaari['field'][position[0]][position[1]].occupant = dude_id;
		}
		else {
		}
		
	});
}

function position_valid(position){
	if(
		(position[0] < 0) ||
		(position [0] >= bekaari['width']) ||
		(position[1] < 0) ||
		(position [1] >= bekaari['height'])
	) return false;
	else return true;
}

function get_occupant_position(position){
	if(position_valid(position)) return bekaari['dudes'][bekaari['field'][position[0]][position[1]].occupant];
	else return false;
}

function get_occupant_selected(){
	return  bekaari['dudes'][bekaari['field'][bekaari['selected'][0]][bekaari['selected'][1]].occupant];
}

function draw_patterns(dude){;
	if(dude){
		_.forEach(get_positions(dude.type, dude.position), function(position){
			bekaari['ctx'].setLineDash([]);
			bekaari['ctx'].lineWidth=1;
			bekaari['ctx'].strokeStyle="#FFFFFF";
			bekaari['ctx'].strokeRect(
				position[0]*bekaari['position_radius'],
				position[1]*bekaari['position_radius'],
				bekaari['position_radius'],
				bekaari['position_radius']
			);
		});
		_.forEach(get_atack_positions(dude.type, dude.position), function(position){
			bekaari['ctx'].setLineDash([20,bekaari['position_radius']-40, 20, 0]);
			bekaari['ctx'].lineWidth=3;
			bekaari['ctx'].strokeStyle= dude.color;
			bekaari['ctx'].strokeRect(
				position[0]*bekaari['position_radius'],
				position[1]*bekaari['position_radius'],
				bekaari['position_radius'],
				bekaari['position_radius']
			);
		});
	}
}

function stop_bekaari(){
	console.log('stop_bekaari');
	clearInterval(intervals['bekaari_draw_interval']);
	clearInterval(intervals['bekaari_step_interval']);
	clearInterval(intervals['bekaari_second_interval']);
}

function start_bekaari(){
	console.log('start_bekaari');
	intervals['bekaari_draw_interval'] = setInterval(function(){
		bekaari['ctx'].clearRect(0, 0, bekaari['canvas'].width, bekaari['canvas'].height);
		switch(bekaari['game_mode']){
			case 'deployment':
				//draw the dude tag
				bekaari['ctx'].font = '40pt Calibri';
				bekaari['ctx'].fillStyle = bekaari['deployment'].color;
				bekaari['ctx'].fillText(
					dude_list[bekaari['deployment'].selected].tag,
					bekaari['selected'][0]*bekaari['position_radius'],
					((bekaari['selected'][1]+1)*bekaari['position_radius']) - 15
				);
				
				//draw the description
				var info = '';
				info += "mouse-wheel [ ] (L1 R1) switch dude<br /><br />right-click < > (L2 R2) switch color<br /><br />left-click space (X) deploy<br /><br />Selected:<br />"
				info += dude_list[bekaari['deployment'].selected].description;
				bekaari['infobox'].innerHTML = info;
				break;
			case 'game_start':
				var info = '';
				switch(bekaari['game_start'].mode){
					case 'idle':
						info += "idle:<br/><br/>";
						var occupant = get_occupant_selected();
						if(occupant){
							draw_patterns(occupant)
							info += dude_list[occupant.type].description;
						}
						break;
					case 'moving':
						draw_patterns(get_occupant_position(bekaari['game_start'].selected_position));
						bekaari['']
						info += "moving:<br/><br/>";
						break;
					case 'activating':
						info += "activating:<br/><br/>";
						break;
					default:
				}
				bekaari['infobox'].innerHTML = info;
				break;
			default:
		}
		//draw selected
		bekaari['ctx'].strokeStyle="#ffffff";
		bekaari['ctx'].setLineDash([]);
		bekaari['ctx'].strokeRect(
			bekaari['selected'][0]*bekaari['position_radius'],
			bekaari['selected'][1]*bekaari['position_radius'],
			bekaari['position_radius'],
			bekaari['position_radius']
		);
		//draw dude tag
		_.forEach(bekaari['dudes'], function(dude){
			bekaari['ctx'].fillStyle = dude.color;
			bekaari['ctx'].fillText(
				dude_list[dude.type].tag,
				dude.position[0]*bekaari['position_radius'],
				((dude.position[1]+1)*bekaari['position_radius']) - 15
			);
		});
	},17);
	intervals['bekaari_step_interval'] = setInterval(function(){
		_.forEach(bekaari['gamepads'], function(gamepad){
			var index = gamepad.gamepad_index;
			var gamepad = navigator.getGamepads()[index];
			if(gamepad){
				if(gamepad.buttons[4].pressed && bekaari['gamepads'][index].l1 == false){
					bekaari['gamepads'][index].l1 = true;
					bekaari['selected'][0] = 0;
				}
				else if(!gamepad.buttons[4].pressed) bekaari['gamepads'][index].l1 = false;
				
				if(gamepad.buttons[5].pressed && bekaari['gamepads'][index].r1 == false){
					bekaari['gamepads'][index].r1 = true;
					bekaari['selected'][0] = bekaari['width'] - 1;
				}
				else if(!gamepad.buttons[5].pressed) bekaari['gamepads'][index].r1 = false;
				
				if(gamepad.buttons[12].pressed && bekaari['gamepads'][index].up == false){
					bekaari['gamepads'][index].up = true;
					bekaari['selected'][1] -= 1;
				}
				else if(!gamepad.buttons[12].pressed) bekaari['gamepads'][index].up = false;
				if(gamepad.buttons[13].pressed && bekaari['gamepads'][index].down == false){
					bekaari['gamepads'][index].down = true;
					bekaari['selected'][1] += 1;
				}
				else if(!gamepad.buttons[13].pressed) bekaari['gamepads'][index].down = false;
				if(gamepad.buttons[14].pressed && bekaari['gamepads'][index].left == false){
					bekaari['gamepads'][index].left = true;
					bekaari['selected'][0] -= 1;
				}
				else if(!gamepad.buttons[14].pressed) bekaari['gamepads'][index].left = false;
				if(gamepad.buttons[15].pressed && bekaari['gamepads'][index].right == false){
					bekaari['gamepads'][index].right = true;
					bekaari['selected'][0] += 1;
				}
				else if(!gamepad.buttons[15].pressed) bekaari['gamepads'][index].right = false;
			}
		});
	}, 17);
	intervals['bekaari_second_interval'] = setInterval(function(){
		document.getElementById('gamepad_p_bekaari').innerHTML = 'Gamepads Connected: ' + Object.keys(bekaari['gamepads']).length;
		_.forEach(navigator.getGamepads(), function(gamepad){
			if(gamepad){
				if(!gamepad.id.includes('Unknown')){
					var playa = _.filter(bekaari['gamepads'], {'gamepad_index': gamepad.index});
					if(!playa.length){
						console.log('gamepad detected');
						bekaari['gamepads'][gamepad.index] = {};
						bekaari['gamepads'][gamepad.index].gamepad_index = gamepad.index;
						bekaari['gamepads'][gamepad.index].up = false;
						bekaari['gamepads'][gamepad.index].down = false;
						bekaari['gamepads'][gamepad.index].left = false;
						bekaari['gamepads'][gamepad.index].right = false;
						bekaari['gamepads'][gamepad.index].cross = false;
						bekaari['gamepads'][gamepad.index].r1 = false;
						bekaari['gamepads'][gamepad.index].l1 = false;
					}
				}
			}
		})
	}, 1000);
}

function stop_dark_squares(){
	console.log('stop_dark_squares');
	clearInterval(intervals['dark_squares_draw_interval']);
	clearInterval(intervals['dark_squares_step_interval']);
	clearInterval(intervals['dark_squares_second_interval']);
}

function start_dark_squares(){
	console.log('start_dark_squares');
	intervals['dark_squares_draw_interval'] = setInterval(function(){
		ctx.clearRect(0, 0, width, height);
		hp_ctx.clearRect(0,0,300,30);
		stamina_ctx.clearRect(0,0,300,30);
		hp_ctx.fillRect(0,0,(things['player'].health/10)*300,30);
		stamina_ctx.fillRect(0,0,(things['player'].energy/10)*300,30);
		for(var x in things){
			if(!things[x].incorporeal){
				var size = things[x].size;
				var _size = things[x].size/2;
				var __size = _size/2;
				if(things[x].is_agent){
					switch(things[x].phase){
						case "moving":
							ctx.fillStyle="#ffffff";
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
							ctx.fillStyle="#ffffff";
					}
				}
				else ctx.fillStyle = things[x].color;
				ctx.fillRect(things[x].pos.x - _size,things[x].pos.y - _size,size,size);
			}
			
		}
	}, 17);	

	intervals['dark_squares_step_interval'] = setInterval(function(){
		_.forEach(things, function(value) {
			if(typeof things[value.id] != 'undefined') things[value.id].step();
			else console.log('UNDEFINED: things[value.id] IN dark_squares_step_interval\t', value);
		});
	}, 17);

	intervals['dark_squares_second_interval'] = setInterval(function(){
		// //navigator.getGamepads()[e.gamepad.index]
		document.getElementById('gamepad_p').innerHTML = 'Gamepads Connected: ' + (Object.keys(players).length-1);
		_.forEach(navigator.getGamepads(), function(gamepad){
			if(gamepad){
				if(!gamepad.id.includes('Unknown')){
					var playa = _.filter(players, {'gamepad_index': gamepad.index});
					if(!playa.length){
						console.log('assigning gamepad to player');
						var id = create_player(shortid.generate());
						things[id].gamepad_index = gamepad.index;
					}
				}
			}
		});

		
		for(var x in things){
			if(things[x].is_agent){
				if(things[x].energy < 10){
					things[x].energy++;
				}
			}
		}
	}, 1000); 
}