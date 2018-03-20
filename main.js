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
	if (tab_name == 'SF' && hold_last_tab != 'SF'){
		start_SF();
	}
	else if (tab_name != 'SF' && hold_last_tab == 'SF'){
		stop_SF();
	}
	if (tab_name == 'REM' && hold_last_tab != 'REM'){
		start_REM();
	}
	else if (tab_name != 'REM' && hold_last_tab == 'REM'){
		stop_REM();
	}
	if (tab_name == 'd3_stuff' && hold_last_tab != 'd3_stuff'){
		start_d3_stuff();
	}
	else if (tab_name != 'd3_stuff' && hold_last_tab == 'd3_stuff'){
		stop_d3_stuff();
	}
}

domready(function() {
	//this is called after all the resources are loaded available - I think???
	test_main();
	add_event_listeners();//put this in tab - and add remove_event_listeners()?????
	initiate_chess_clock();
	initiate_bekaari();
	initiate_SF();
	initiate_REM();
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
			case 39://d
				bekaari['selected'][0] += 1;
				break;
			case 38://w
				bekaari['selected'][1] -= 1;
				break;
			case 40://s
				bekaari['selected'][1] += 1;
				break;
			case 37://a
				bekaari['selected'][0] -= 1;
				break;
			case 68://d
				bekaari['selected'][0] += 1;
				break;
			case 32://space
				bekaari_select();
				break;
			case 16://shift
				bekaari['view_action'] = true;
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
			case 77://M
				next_map();
				break;
			case 78://N
				next_piece();
				break;
			case 75://K
				bekaari_cancel();
				break;
			case 85://U
				bekaari_to_deployment();
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
	if(last_tab == 'Bekaari'){
		switch(key){
			case 16://shift
				bekaari['view_action'] = false;
				break;
			default:
		}
	}
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
	things[id].shift = 'fist_of_the_north_star';
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
var bekaari = {};
var SF = {};
var REM = {};

function reset_chess_clock(){
	var now = new Date().getTime();
	chess_clock['end_time'] = new Date(now + 60*60000).getTime();
	chess_clock['player1_time'] = new Date(now).getTime();
	chess_clock['player1_turn_start_time'] = new Date(now).getTime();
	chess_clock['player2_time'] = new Date(now).getTime();
	chess_clock['player2_turn_start_time'] = new Date(now).getTime();
	chess_clock['turn'] = 0;
	chess_clock['hold_turn'] = 1; //for pausing
	chess_clock['player1_score'] = 0;
	chess_clock['player2_score'] = 0;
	chess_clock['player1_score_div'].innerHTML = chess_clock['player1_score'];
	chess_clock['player2_score_div'].innerHTML = chess_clock['player2_score'];
	chess_clock['start_stop_div'].classList.remove('active_player');
	display_chess_clock('player1');
	display_chess_clock('player2');	
}

function initiate_chess_clock(){
	console.log('initiate chess clock');
	chess_clock['player1_div'] = document.getElementById("player1_div");
	chess_clock['player2_div'] = document.getElementById("player2_div");
	chess_clock['player1_score_div'] = document.getElementById("player1_score");
	chess_clock['player2_score_div'] = document.getElementById("player2_score");
	chess_clock['start_stop_div'] = document.getElementById("chess_clock_start_stop");
	chess_clock['player1_score'] = 0;
	chess_clock['player2_score'] = 0;
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
	chess_clock['player1_score_div'].onclick = player1_score
	chess_clock['player2_score_div'].onclick = player2_score
}

function player1_score(e){
	var pWidth = chess_clock['player1_score_div'].offsetWidth;
	var pOffset = chess_clock['player1_score_div'].offsetLeft; 
	var x = e.pageX - pOffset;
    if(pWidth/2 > x){
		chess_clock['player1_score'] -= 1;
	}
	else{
		chess_clock['player1_score'] += 1;
	}
	chess_clock['player1_score_div'].innerHTML = chess_clock['player1_score'];
}
function player2_score(e){
	var pWidth = chess_clock['player2_score_div'].offsetWidth;
	var pOffset = chess_clock['player2_score_div'].offsetLeft; 
	var x = e.pageX - pOffset;
    if(pWidth/2 > x){
		chess_clock['player2_score'] -= 1;
	}
	else{
		chess_clock['player2_score'] += 1;
	}
	chess_clock['player2_score_div'].innerHTML = chess_clock['player2_score'];
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
	chess_clock['start_stop_div'].classList.remove('active_player');
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
	chess_clock['start_stop_div'].classList.add('active_player');
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

function get_adjacent(position){
	var x = position[0];
	var y = position[1];
	var adj = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,1],[1,-1],[1,0]];
	var positions = [];
	_.forEach(adj, function(pos){
		if(position_valid([x+pos[0],y+pos[1]])) positions.push([x+pos[0],y+pos[1]]);
	});
	return positions;
}

function attack_position(position){
	var id = place_dude_capture('attack', 'dudes', [position[0],position[1]], 'field', '#ff0000');
	setTimeout(function(){
		remove_dude(id);
	}, 500);
	
}

function knight_movement(position){
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
}

var dude_list = {
	attack: object = {
		description: "attack:<br/> used for visuals",
		tag: 'XX',
		mobility: false,
		is_piece: false,
		movement_patterns: [],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [],
		custom_attack_pattern: function(position){
			return [];
		},
		action_patterns: [],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(position){
			
		},
	},
	obstacle: object = {
		description: "obstacle:<br/> can't move can't be captured",
		tag: '  #',
		mobility: false,
		is_piece: false,
		movement_patterns: [],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [],
		custom_attack_pattern: function(position){
			return [];
		},
		action_patterns: [],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(target_position, dude_position){
			
		},
	},
	wall: object = {
		description: "wall:<br/> can't move can be captured.",
		tag: ' ---',
		mobility: false,
		is_piece: false,
		lifespan: 1,
		movement_patterns: [],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [],
		custom_attack_pattern: function(position){
			return [];
		},
		action_patterns: [],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(position){
			
		}
	},
	fire_wall: object = {
		description: "fire_wall:<br/> can't move can be captured - dude that captures it is captured.",
		tag: '^^^',
		mobility: false,
		is_piece: false,
		movement_patterns: [],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [],
		custom_attack_pattern: function(position){
			return [];
		},
		action_patterns: [],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(position){
			
		},
		on_captured: function(capturer_id, position){
			if(bekaari['game_start'].selected_id == capturer_id) bekaari['game_start'].mode = 'idle';
			if(!dude_list[bekaari['dudes'][capturer_id].type].immunity_fire) remove_dude(capturer_id);
		},
		on_turn: function(dude_id){
			var x = bekaari['dudes'][dude_id].position[0];
			var y = bekaari['dudes'][dude_id].position[1];
			var color = bekaari['dudes'][dude_id].color;
			for(var i = -1; i<2; i++){
				for(var j = -1; j<2; j++){
					if((Math.random() * 100) <= 10){
						var burn = true;
						var occupant = get_occupant_position([x+i, y+j]);
						if(occupant){
							if(!dude_list[occupant.type].immunity_fire){
								place_dude_capture('fire_wall', 'dudes', [x+i, y+j], 'field', color);
							}
						}
						else{
							place_dude_with('fire_wall', 'dudes', [x+i, y+j], 'field', color);
						}
					}
				}
			}
			if((Math.random() * 100) <= 80) remove_dude(dude_id);
		}
	},
	ice_wall: object = {
		description: "ice_wall:<br/> can't move can be captured - dude that captures it is frozen.",
		tag: 'ice',
		mobility: false,
		is_piece: false,
		lifespan: 1,
		movement_patterns: [],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [],
		custom_attack_pattern: function(position){
			return [];
		},
		action_patterns: [],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(position){
			
		},
		on_captured: function(capturer_id, position){
			if(bekaari['dudes'][capturer_id]){
				bekaari['dudes'][capturer_id].frozen = true;
			}
		}
	},
	tree_of_life: object = {
		description: "tree_of_life:<br/>brings life to dudes.",
		tag: 'Tr',
		sprite: 'tree',
		sprite_height: 80,
		sprite_width: 80,
		mobility: false,
		is_piece: true,
		lives: 0,
		cost: 15,
		movement_patterns: [
			[1,0,1,2],
			[-1,0,1,2],
			[0,1,1,2],
			[0,-1,1,2],
			[1,1,1,2],
			[-1,-1,1,2],
			[1,-1,1,2],
			[-1,1,1,2]
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [],
		custom_attack_pattern: function(position){
			return [];
		},
		action_patterns: [
			[1,0,1,1],
			[-1,0,1,1],
			[0,1,1,1],
			[0,-1,1,1]
		],
		custom_action_pattern: function(position){
			var spots = [
				[2,0],
				[-2,0],
				[0,2],
				[0,-2],
				[2, -2],
				[2, 2],
				[-2, -2],
				[-2, 2]
			];
			var free = [];
			_.forEach(spots, function(spot){
				var x = position[0] + spot[0];
				var y = position[1] + spot[1];
				if(!get_occupant_position([x,y])){
					free.push([x,y]);
				}
			});
			return [];
		},
		action: function(target_position, dude_position){
			var x_dir = target_position[0] - dude_position[0];
			var y_dir = target_position[1] - dude_position[1];
			var x = target_position[0];
			var y = target_position[1];
			if((Math.abs(x_dir) == 2) || ((Math.abs(y_dir) == 2))){
				move_dude(bekaari['game_start'].selected_id, bekaari['game_start'].selected_position,  target_position);
			}
			else if((x_dir == 0) && (y_dir == 0)){
				console.log('tree middle');
			}
			else{
				var occupant = get_occupant_position(target_position);
				if(occupant){
					if(dude_list[occupant.type].is_piece){
						bekaari['dudes'][occupant.id].captured_count -= 1;
					}
				}
			}
		},
	},
	wraith: object = {
		description: "wraith:<br/>spooky.",
		tag: 'Wr',
		sprite: 'wraith',
		sprite_height: 80,
		sprite_width: 51,
		mobility: false,
		is_piece: true,
		lives: 1,
		cost: 8,
		movement_patterns: [],
		custom_movement_pattern: function(position){
			var movement = [];
			for(var x = position[0]-10; x<position[0]+10; x++){
				for(var y = position[1]-10; y<position[1]+10; y++){
					if(position_valid([x,y])) movement.push([x,y]);
				}
			}
			return movement;
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
		custom_attack_pattern: knight_movement,
		action_patterns: [
		],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(target_position, dude_position){
		},
	},
	wizard: object = {
		description: "wizard:<br/>.",
		tag: 'wiz',
		mobility: false,
		is_piece: true,
		immunity_fire: true,
		lives: 0,
		cost: 10,
		movement_patterns: [
			[1, -1, 1, 1],
			[1, 1, 1, 1],
			[-1, -1, 1, 1],
			[-1, 1, 1, 1],
			[0, -1, 1, 2],
			[1, 0, 1, 2],
			[0, 1, 1, 2],
			[-1, 0, 1, 2]
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [
		],
		custom_attack_pattern: function(position){
			return [];
		},
		action_patterns: [
			[-1, 1, 3, 3],
			[-1, -1, 3, 3],
			[1, 1, 3, 3],
			[1, -1, 3, 3],
			[0, 1, 4, 4],
			[0, -1, 4, 4],
			[1, 0, 6, 6],
			[-1, 0, 6, 6],
			[1, 0, 3, 3],
			[-1, 0, 3, 3]
		],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(target_position, dude_position){
			var x = target_position[0];
			var y = target_position[1];
			var r = 2;
			var dude_color = get_occupant_position(dude_position).color;
			for(var a=x-r; a<=x+r; a++){
				for(var b=y-r; b<=y+r; b++){
					var occupant = get_occupant_position([a,b]);
					if(occupant){
						if(!dude_list[occupant.type].is_piece){
							if((Math.random()*100)>50){
								place_dude_capture('fire_wall', 'dudes', [a,b], 'field', dude_color);
							}
						}
					}
					else if((Math.random()*100)<=25){
						place_dude_capture('fire_wall', 'dudes', [a,b], 'field', dude_color);
					}
				}
			}
		},
	},
	frost_giant: object = {
		description: "frost_giant:<br/> freezes stuff.",
		tag: 'iii',
		sprite: 'frost_giant',
		sprite_width: 57,
		sprite_height: 80,
		mobility: false,
		is_piece: true,
		lives: 0,
		cost: 10,
		movement_patterns: [
			[1,0,1,2],
			[-1,0,1,2],
			[0,1,1,2],
			[0,-1,1,2],
			[1, -1, 1, 2],
			[1, 1, 1, 2],
			[-1, -1, 1, 2],
			[-1, 1, 1, 2]	
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [
			[1,0,1,1],
			[-1,0,1,1],
			[0,1,1,1],
			[0,-1,1,1],
			[1, -1, 1, 1],
			[1, 1, 1, 1],
			[-1, -1, 1, 1],
			[-1, 1, 1, 1]		
		],
		custom_attack_pattern: function(position){
			return [];
		},
		action_patterns: [
			[1,0,1,1],
			[-1,0,1,1],
			[0,1,1,1],
			[0,-1,1,1],
			[0,0,1,1],
			[1, -1, 1, 1],
			[1, 1, 1, 1],
			[-1, -1, 1, 1],
			[-1, 1, 1, 1]	
		],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(target_position, dude_position){
			var x_dir = target_position[0] - dude_position[0];
			var y_dir = target_position[1] - dude_position[1];
			var x = dude_position[0];
			var y = dude_position[1];
			var dude_color = get_occupant_position(dude_position).color;
			if((x_dir == 0) && (y_dir == 0)){
				var r = 4;
				for(var i = x-r; i <= x+r; i++){
					for(var j = y-r; j<=y+r; j++){
						if((Math.random()*100)<=15){
							var occupant = get_occupant_position([i,j]);
							if(occupant){
								if(dude_list[occupant.type].is_piece){
									if(occupant.color != dude_color) bekaari['dudes'][occupant.id].frozen = true;
								}
								else place_dude_capture('ice_wall', 'dudes', position, 'field', dude_color);
							}
							else{
								place_dude_with('ice_wall', 'dudes', [i,j], 'field', dude_color);
							}
						}
					}
				}
			}
			else{
				if((Math.abs(x_dir) == 1) && (Math.abs(y_dir) == 1)){
					var spray_area = [
						[x+(x_dir*1),y+(y_dir*1)],
						[x+(x_dir*2),y+(y_dir*2)],
						[x+(x_dir*2),y+(y_dir*1)],
						[x+(x_dir*1),y+(y_dir*2)],
						[x+(x_dir*3),y+(y_dir*1)],
						[x+(x_dir*1),y+(y_dir*3)],
						[x+(x_dir*3),y+(y_dir*3)]
					];
				}
				else if(y_dir == 0){
					var spray_area = [
						[x+(x_dir*1),y+(y_dir)],
						[x+(x_dir*2),y+(y_dir)],
						[x+(x_dir*3),y+(y_dir)],
						[x+(x_dir*2),y-1],
						[x+(x_dir*2),y+1],
						[x+(x_dir*3),y-2],
						[x+(x_dir*3),y+2]						
					];
				}
				else{
					var spray_area = [
						[x+(x_dir),y+(y_dir*1)],
						[x+(x_dir),y+(y_dir*2)],
						[x+(x_dir),y+(y_dir*3)],
						[x-1,y+(y_dir*2)],
						[x+1,y+(y_dir*2)],
						[x-2,y+(y_dir*3)],
						[x+2,y+(y_dir*3)]
					];
				}
				_.forEach(spray_area, function(position){
					var occupant = get_occupant_position(position);
					if(occupant){
						if(dude_list[occupant.type].is_piece) bekaari['dudes'][occupant.id].frozen = true;
						else place_dude_capture('ice_wall', 'dudes', position, 'field', dude_color);
					}
					else{
						place_dude_with('ice_wall', 'dudes', position, 'field', dude_color);
					}
				});
			}
		},
		on_captured: function(capturer_id, position){
			if(bekaari['dudes'][capturer_id]){
				bekaari['dudes'][capturer_id].frozen = true;
			}
		}
	},
	wind_guy: object = {
		description: "wind_guy:<br/> woosh.",
		tag: 'Wd',
		sprite: 'windy',
		sprite_height: 80,
		sprite_width: 79,
		mobility: false,
		is_piece: true,
		lives: 0,
		cost: 13,
		movement_patterns: [
			[1, 0, 1, 2],
			[0, 1, 1, 2],
			[-1, 0, 1, 2],
			[0, -1, 1, 2],
			[1, -1, 1, 2],
			[1, 1, 1, 2],
			[-1, -1, 1, 2],
			[-1, 1, 1, 2]
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [
		],
		custom_attack_pattern: function(position){
			return [];
		},
		action_patterns: [
			[1, 0, 3, 3],
			[0, 1, 3, 3],
			[-1, 0, 3, 3],
			[0, -1, 3, 3],			
			[1, 0, 1, 1],
			[0, 1, 1, 1],
			[-1, 0, 1, 1],
			[0, -1, 1, 1]
		],
		custom_action_pattern: knight_movement,
		action: function(target_position, dude_position){
			var x_dir = target_position[0] - dude_position[0];
			var y_dir = target_position[1] - dude_position[1];
			var x = dude_position[0];
			var y = dude_position[1];
			var r = 3;
			if((x_dir == 3) && (y_dir == 0)){
				//east right
				//everything in 4 columns out moves 2 squares east
				var start_x = x + r;
				var end_x = x + 1;
				var iter_x = -1;
				var push_x = 2; 
				var start_y = y-r;
				var end_y = y+r//bekaari['height']-1;
				var iter_y = 1;
				var push_y = 0; 
				var x_list = [];
				var y_list = [];
				for(var i=start_x; i>=end_x; i += iter_x) x_list.push(i);
				for(var j=start_y; j<=end_y; j += iter_y) y_list.push(j);
			}
			else if((x_dir == 1) && (y_dir == 0)){
				//east left
				var start_x = x + 1;
				var end_x = x + r;
				var iter_x = 1;
				var push_x = -2; 
				var start_y = y-r;
				var end_y = y+r;
				var iter_y = 1;
				var push_y = 0; 
				var x_list = [];
				var y_list = [];
				for(var i=start_x; i<=end_x; i += iter_x) x_list.push(i);
				for(var j=start_y; j<=end_y; j += iter_y) y_list.push(j);
			}
			else if((x_dir == 2) && (y_dir == 1)){
				//east bottom
				//everything in 4 columns out moves 2 squares south
				var start_x = x + 1;
				var end_x = x + r;
				var iter_x = 1;
				var push_x = 0; 
				var start_y = y+r;
				var end_y = y-r;
				var iter_y = -1;
				var push_y = 2; 
				var x_list = [];
				var y_list = [];
				for(var i=start_x; i<=end_x; i += iter_x) x_list.push(i);
				for(var j=start_y; j>=end_y; j += iter_y) y_list.push(j);
			}
			else if((x_dir == 2) && (y_dir == -1)){
				//east top
				//everything in 4 columns out moves 2 squares north
				var start_x = x + 1;
				var end_x = x + r;
				var iter_x = 1;
				var push_x = 0; 
				var start_y = y-r;
				var end_y = y+r;
				var iter_y = 1;
				var push_y = -2; 
				var x_list = [];
				var y_list = [];
				for(var i=start_x; i<=end_x; i += iter_x) x_list.push(i);
				for(var j=start_y; j<=end_y; j += iter_y) y_list.push(j);
			}
			else if((x_dir == -3) && (y_dir == 0)){
				//west left
				//everything in 4 columns west moves 2 squares west
				var start_x = x - r;
				var end_x = x - 1;
				var iter_x = 1;
				var push_x = -2; 
				var start_y = y-r;
				var end_y = y+r;
				var iter_y = 1;
				var push_y = 0; 
				var x_list = [];
				var y_list = [];
				for(var i=start_x; i<=end_x; i += iter_x) x_list.push(i);
				for(var j=start_y; j<=end_y; j += iter_y) y_list.push(j);
			}
			else if((x_dir == -1) && (y_dir == 0)){
				//west right
				//everything in 4 columns west moves 2 squares east
				var start_x = x - 1;
				var end_x = x - r;
				var iter_x = -1;
				var push_x = 2; 
				var start_y = y-r;
				var end_y = y+r;
				var iter_y = 1;
				var push_y = 0; 
				var x_list = [];
				var y_list = [];
				for(var i=start_x; i>=end_x; i += iter_x) x_list.push(i);
				for(var j=start_y; j<=end_y; j += iter_y) y_list.push(j);
			}
			else if((x_dir == -2) && (y_dir == -1)){
				//west top
				//everything in 4 columns west moves 2 squares north
				var start_x = x - 1;
				var end_x = x - r;
				var iter_x = -1;
				var push_x = 0; 
				var start_y = y-r;
				var end_y = y+r;
				var iter_y = 1;
				var push_y = -2; 
				var x_list = [];
				var y_list = [];
				for(var i=start_x; i>=end_x; i += iter_x) x_list.push(i);
				for(var j=start_y; j<=end_y; j += iter_y) y_list.push(j);
			}
			else if((x_dir == -2) && (y_dir == 1)){
				//west bottom
				//everything in 4 columns west moves 2 squares south
				var start_x = x - 1;
				var end_x = x - r;
				var iter_x = -1;
				var push_x = 0; 
				var start_y = y+r;
				var end_y = y-r;
				var iter_y = -1;
				var push_y = 2; 
				var x_list = [];
				var y_list = [];
				for(var i=start_x; i>=end_x; i += iter_x) x_list.push(i);
				for(var j=start_y; j>=end_y; j += iter_y) y_list.push(j);
			}
			else if((x_dir == 0) && (y_dir == 3)){
				//south bottom
				var start_x = x-r;
				var end_x = x+r;
				var iter_x = 1;
				var push_x = 0; 
				var start_y = y + r;
				var end_y = y + 1;
				var iter_y = -1;
				var push_y = 2; 
				var x_list = [];
				var y_list = [];
				for(var i=start_x; i<=end_x; i += iter_x) x_list.push(i);
				for(var j=start_y; j>=end_y; j += iter_y) y_list.push(j);
			}
			else if((x_dir == 0) && (y_dir == 1)){
				//south top
				var start_x = x-r;
				var end_x = x+r;
				var iter_x = 1;
				var push_x = 0; 
				var start_y = y + 1;
				var end_y = y + r;
				var iter_y = 1;
				var push_y = -2; 
				var x_list = [];
				var y_list = [];
				for(var i=start_x; i<=end_x; i += iter_x) x_list.push(i);
				for(var j=start_y; j<=end_y; j += iter_y) y_list.push(j);
			}
			else if((x_dir == 1) && (y_dir == 2)){
				//south east
				var start_x = x+r;
				var end_x = x-r;
				var iter_x = -1;
				var push_x = 2; 
				var start_y = y + 1;
				var end_y = y + r;
				var iter_y = 1;
				var push_y = 0; 
				var x_list = [];
				var y_list = [];
				for(var i=start_x; i>=end_x; i += iter_x) x_list.push(i);
				for(var j=start_y; j<=end_y; j += iter_y) y_list.push(j);
			}	
			else if((x_dir == -1) && (y_dir == 2)){
				//south west
				var start_x = x-r;
				var end_x = x+r;
				var iter_x = 1;
				var push_x = -2; 
				var start_y = y + 1;
				var end_y = y + r;
				var iter_y = 1;
				var push_y = 0; 
				var x_list = [];
				var y_list = [];
				for(var i=start_x; i<=end_x; i += iter_x) x_list.push(i);
				for(var j=start_y; j<=end_y; j += iter_y) y_list.push(j);
			}
			else if((x_dir == 0) && (y_dir == -3)){
				//north north
				var start_x = x+r;
				var end_x = x-r;
				var iter_x = -1;
				var push_x = 0; 
				var start_y = y - r;
				var end_y = y - 1;
				var iter_y = 1;
				var push_y = -2; 
				var x_list = [];
				var y_list = [];
				for(var i=start_x; i>=end_x; i += iter_x) x_list.push(i);
				for(var j=start_y; j<=end_y; j += iter_y) y_list.push(j);
			}			
			else if((x_dir == 0) && (y_dir == -1)){
				//north south
				var start_x = x+r;
				var end_x = x-r;
				var iter_x = -1;
				var push_x = 0; 
				var start_y = y - 1;
				var end_y = y - r;
				var iter_y = -1;
				var push_y = +2; 
				var x_list = [];
				var y_list = [];
				for(var i=start_x; i>=end_x; i += iter_x) x_list.push(i);
				for(var j=start_y; j>=end_y; j += iter_y) y_list.push(j);
			}			
			else if((x_dir == -1) && (y_dir == -2)){
				//north west
				var start_x = x-r;
				var end_x = x+r;
				var iter_x = 1;
				var push_x = -2; 
				var start_y = y - 1;
				var end_y = y - r;
				var iter_y = -1;
				var push_y = 0; 
				var x_list = [];
				var y_list = [];
				for(var i=start_x; i<=end_x; i += iter_x) x_list.push(i);
				for(var j=start_y; j>=end_y; j += iter_y) y_list.push(j);
			}
			else if((x_dir == 1) && (y_dir == -2)){
				//north east
				var start_x = x+r;
				var end_x = x-r;
				var iter_x = -1;
				var push_x = 2; 
				var start_y = y - 1;
				var end_y = y - r;
				var iter_y = -1;
				var push_y = 0; 
				var x_list = [];
				var y_list = [];
				for(var i=start_x; i>=end_x; i += iter_x) x_list.push(i);
				for(var j=start_y; j>=end_y; j += iter_y) y_list.push(j);
			}
			var series = [];
		
			_.forEach(x_list, function(i){
				_.forEach(y_list, function(j){
					var occupant = get_occupant_position([i,j]);
					if(occupant){
						if(occupant.type != 'obstacle'){
							//dude_id, old_position, position
							series.push([occupant.id, [occupant.position[0], occupant.position[1]], [i+(push_x/2), j+(push_y/2)]]);
							series.push([occupant.id, [occupant.position[0]+(push_x/2), occupant.position[1]+(push_y/2)], [i+push_x, j+push_y]]);
						}
					}
				});
			});

			var iter = -1;
			var end = series.length;
			var move_interval = setInterval(function(){
				iter += 1;
				if(iter < series.length){
					move_dude(series[iter][0], series[iter][1], series[iter][2]);
				}
				else{
					clearInterval(move_interval);
				}
			}, 150);
		},
	},
	dervish: object = {
		description: "dervish:<br/> activates thrice",
		tag: 'Dv',
		sprite: 'dervish',
		sprite_height: 80,
		sprite_width: 59,
		mobility: false,
		is_piece: true,
		lives: 0,
		moves: 2,
		cost: 7,
		movement_patterns: [
			[1, -1, 1, 2],
			[1, 1, 1, 2],
			[-1, -1, 1, 2],
			[-1, 1, 1, 2]
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [
			[1, -1, 1, 2],
			[1, 1, 1, 2],
			[-1, -1, 1, 2],
			[-1, 1, 1, 2]
		],
		custom_attack_pattern: function(position){
			return [];
		},
		action_patterns: [
			[1, 0, 1, 2],
			[0, 1, 1, 2],
			[-1, 0, 1, 2],
			[-0, -1, 1, 2]
		],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(target_position, dude_position){
			move_dude(bekaari['game_start'].selected_id, bekaari['game_start'].selected_position,  target_position);
		},
	},
	dragon: object = {
		description: "dragon:<br/> dont let the dragon drag on man.",
		tag: 'Dg',
		immunity_fire: true,
		mobility: false,
		is_piece: true,
		sprite: 'dragon',
		sprite_width: 80,
		sprite_height: 73,
		lives: 0,
		cost: 23,
		movement_patterns: [
		],
		custom_movement_pattern: function(position){return [];},
		attack_patterns: [
		],
		custom_attack_pattern: function(position){return [];},
		action_patterns: [
			[1, 0, 1, 1],
			[0, 1, 1, 1],
			[-1, 0, 1, 1],
			[0, -1, 1, 1]
		],
		custom_action_pattern: function(position){
			var positions = [];
			_.forEach([
				[-5,-2],[5,2],[5,-2],[-5,2],
				[7,0],[-7,0],[0,5],[0,-5],
				[3,4],[-3,-4],[3,-4],[-3,4],
			], function(spot){
				var x = position[0] + spot[0]; 
				var y = position[1] + spot[1]; 
				if(!get_occupant_position([x, y])){
					positions.push([x, y]);
				}
			})
			return positions;
		},
		action: function(target_position, dude_position){
			var x_dir = target_position[0] - dude_position[0];
			var y_dir = target_position[1] - dude_position[1];
			var x = target_position[0];
			var y = target_position[1];
			var dude_color = get_occupant_position(dude_position).color;
			if((x_dir < 2) && (x_dir > -2) && (y_dir < 2) && (y_dir > -2)){
				if(y_dir == 0){
					place_dude_capture('fire_wall', 'dudes', [x+(x_dir*1),y], 'field', dude_color);
					place_dude_capture('fire_wall', 'dudes', [x+(x_dir*2),y-1], 'field', dude_color);
					place_dude_capture('fire_wall', 'dudes', [x+(x_dir*2),y+1], 'field', dude_color);
					place_dude_capture('fire_wall', 'dudes', [x+(x_dir*2),y+0], 'field', dude_color);
				}
				else{
					place_dude_capture('fire_wall', 'dudes', [x+0,y+(y_dir*1)], 'field', dude_color);
					place_dude_capture('fire_wall', 'dudes', [x+0,y+(y_dir*2)], 'field', dude_color);
					place_dude_capture('fire_wall', 'dudes', [x+1,y+(y_dir*2)], 'field', dude_color);
					place_dude_capture('fire_wall', 'dudes', [x-1,y+(y_dir*2)], 'field', dude_color);
				}
				
			}
			else{
				move_dude(bekaari['game_start'].selected_id, bekaari['game_start'].selected_position,  target_position);
				place_dude_capture('fire_wall', 'dudes', [x+1,y+1], 'field', dude_color);
				place_dude_capture('fire_wall', 'dudes', [x+1,y-1], 'field', dude_color);
				place_dude_capture('fire_wall', 'dudes', [x-1,y+1], 'field', dude_color);
				place_dude_capture('fire_wall', 'dudes', [x-1,y-1], 'field', dude_color);
				place_dude_capture('fire_wall', 'dudes', [x+1,y+0], 'field', dude_color);
				place_dude_capture('fire_wall', 'dudes', [x-1,y+0], 'field', dude_color);
				place_dude_capture('fire_wall', 'dudes', [x+0,y+1], 'field', dude_color);
				place_dude_capture('fire_wall', 'dudes', [x+0,y-1], 'field', dude_color);
			}
		},
		action_attack_patterns: function(position){
			var x = position[0];
			var y = position[1];
			var attack_positions = [];
			var action_positions = dude_list['dragon'].custom_action_pattern(position);
			_.forEach(action_positions, function(act_pos){
				_.forEach(get_adjacent(act_pos), function(adj){
					attack_positions.push(adj);
				})
			});
			return attack_positions;
		},
	},
	archer: object = {
		description: "bow_dude:<br/>long range attacks",
		tag: 'bd',
		mobility: false,
		is_piece: true,
		sprite: 'archer',
		sprite_width: 78,
		sprite_height: 80,
		lives: 0,
		cost: 12,
		movement_patterns: [
			[1, -1, 1, 1],
			[1, 1, 1, 1],
			[-1, -1, 1, 1],
			[-1, 1, 1, 1],
			[1, 0, 1, 2],
			[0, 1, 1, 2],
			[-1, 0, 1, 2],
			[0, -1, 1, 2]
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [],
		custom_attack_pattern: function(position){
			return [];
		},
		action_patterns: [
			[1, -1, 1, 1],
			[1, 1, 1, 1],
			[-1, -1, 1, 1],
			[-1, 1, 1, 1],
			[1, 0, 1, 1],
			[0, 1, 1, 1],
			[-1, 0, 1, 1],
			[0, -1, 1, 1]
		],
		custom_action_pattern: function(position){

			return [];
		},
		action: function(target_position, dude_position){
			var x_dir = target_position[0] - dude_position[0];
			var y_dir = target_position[1] - dude_position[1];
			var hit = false;
			var i = 0;
			var hit_positions = [];
			while(!hit){
				i++;
				var position = [dude_position[0] + (x_dir*i), dude_position[1] + (y_dir*i)];
				if(
					(position[0] >= 0) &&
					(position[1] >= 1) &&
					(position[0] < bekaari['width']) &&
					(position[1] < bekaari['height'])
				){
					var occupant = get_occupant_position(position);
					hit_positions.push(position);
					if(occupant) hit = true;
							
				}
				else{
					hit = true;
				}
			}
			var j = -1;
			var hit_interval = setInterval(function(){
				j++; 
				if(j >= hit_positions.length) clearInterval(hit_interval);
				else attack_position(hit_positions[j]);
			}, 150);
		},
	},
	lance: object = {
		description: "lance:<br/>lance",
		tag: '>>',
		sprite: 'odin',
		sprite_width: 80,
		sprite_height: 72,
		mobility: false,
		is_piece: true,
		lives: 0,
		cost: 15,
		movement_patterns: [
			[1, -1, 1, 4],
			[1, 1, 1, 4],
			[-1, -1, 1, 4],
			[-1, 1, 1, 4],
			[1, 0, 1, 4],
			[0, 1, 1, 4],
			[-1, 0, 1, 4],
			[0, -1, 1, 4]
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [
		],
		custom_attack_pattern: function(position){
			return [];
		},
		action_patterns: [
			[1, -1, 1, 1],
			[1, 1, 1, 1],
			[-1, -1, 1, 1],
			[-1, 1, 1, 1],
			[1, 0, 1, 1],
			[0, 1, 1, 1],
			[-1, 0, 1, 1],
			[0, -1, 1, 1],
			[0, 0, 1, 1]
		],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(target_position, dude_position){
			var dude_color = get_occupant_position(dude_position).color;
			var x_dir = target_position[0] - dude_position[0];
			var y_dir = target_position[1] - dude_position[1];
			var x = dude_position[0];
			var y = dude_position[1];
			var r = 3;
			if((x_dir == 0) && (y_dir == 0)){
				for(var i = x-r; i<=x+r; i++){
					place_dude_with('wall', 'dudes', [i,y-r], 'field', dude_color);
					place_dude_with('wall', 'dudes', [i,y+r], 'field', dude_color);
				}
				for(var j = y-r; j<= y+r; j++){
					place_dude_with('wall', 'dudes', [x+r,j], 'field', dude_color);
					place_dude_with('wall', 'dudes', [x-r,j], 'field', dude_color);
				}
				place_dude_with('wall', 'dudes', [x,y], 'field', dude_color);
			}
			else{
				attack_position([dude_position[0] + x_dir, dude_position[1] + y_dir]);
				attack_position([dude_position[0] + (x_dir*2), dude_position[1] + (y_dir*2)]);
			}
		},
	},
	ninja: object = {
		description: "ninja:<br/>Nani!?.",
		tag: 'Nj',
		sprite: 'cool_guy',
		sprite_width: 56,
		sprite_height: 80,
		mobility: false,
		is_piece: true,
		lives: 0,
		moves: 4,
		cost: 8,
		movement_patterns: [
			[1,0,1,2],
			[-1,0,1,2],
			[0,1,1,2],
			[0,-1,1,2]
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [
			[1,0,1,1],
			[-1,0,1,1],
			[0,1,1,1],
			[0,-1,1,1]
		],
		custom_attack_pattern: function(position){
			return [];
		},
		action_patterns: [],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(position){
			move_dude(bekaari['game_start'].selected_id, bekaari['game_start'].selected_position,  position);
		},
	},
	axe_dude: object = {
		description: "axe_dude:<br/>swings axe.",
		tag: 'AX',
		sprite: 'gascoigne',
		sprite_width: 57,
		sprite_height: 80,
		mobility: true,
		is_piece: true,
		lives: 0,
		cost: 10,
		movement_patterns: [
			[0, -1, 1, 3],
			[1, 0, 1, 3],
			[0, 1, 1, 3],
			[-1, 0, 1, 3],
			[1,1,1,1],
			[-1,-1,1,1],
			[-1,1,1,1],
			[1,-1,1,1]
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [
			[0, -1, 1, 2],
			[1, 0, 1, 2],
			[0, 1, 1, 2],
			[-1, 0, 1, 2]
		],
		custom_attack_pattern: function(position){
			return [];
		},
		action_patterns: [
			[1,0,1,1],
			[-1,0,1,1],
			[0,1,1,1],
			[0,-1,1,1],
			[0,0,1,1]
		],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(target_position, dude_position){
			var x_direction = target_position[0] - dude_position[0];
			var y_direction = target_position[1] - dude_position[1];
			if((x_direction == 0) && (y_direction == 0)){
				for(var x=dude_position[0]-1; x<=dude_position[0]+1; x++){
					for(var y=dude_position[1]-1; y<=dude_position[1]+1; y++){
						if(!((x == dude_position[0]) && (y == dude_position[1]))){
							console.log(dude_position, x, y);
							attack_position([x,y]);
						}
					}
				}
			}
			else{
				switch(x_direction){
					case 0:
						var start_x = dude_position[0] - 1;
						var end_x = start_x+2;
						break;
					case 1:
						var start_x = dude_position[0] + 1;
						var end_x = start_x+1;
						break;
					case -1:
						var start_x = dude_position[0] - 2;
						var end_x = start_x+1;
					default:
						break;
				}
				switch(y_direction){
					case 0:
						var start_y = dude_position[1] - 1;
						var end_y = start_y+2;
						break;
					case 1:
						var start_y = dude_position[1] + 1;
						var end_y = start_y+1;
						break;
					case -1:
						var start_y = dude_position[1] - 2;
						var end_y = start_y+1;
					default:
						break;
				}
				for(var x=start_x; x<=end_x; x++){
					for(var y=start_y; y<=end_y; y++){
						attack_position([x,y]);
					}
				}
			}
		},
	},
	wall_dude: object = {
		description: "wall_dude:<br/>makes walls.",
		tag: 'WD',
		sprite: 'my_pixelized_dude',
		sprite_width: 50,
		sprite_height: 80,
		mobility: false,
		is_piece: true,
		lives: 0,
		cost: 5,
		movement_patterns: [],
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
		attack_patterns: [],
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
		action_patterns: [
			[1,0,1,1],
			[-1,0,1,1],
			[0,1,1,1],
			[0,-1,1,1],
			[0,0,0,0]
		],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(target_position, dude_position){
			var dude_color = get_occupant_position(dude_position).color;
			if(target_position == dude_position){
				for(var x=dude_position[0]-1; x<=dude_position[0]+1; x++){
					for(var y=dude_position[1]-1; y<=dude_position[1]+1; y++){
						place_dude_with('wall', 'dudes', [x,y], 'field', dude_color);
					}
				}
			}
			else{
				var x_direction = target_position[0] - dude_position[0];
				var y_direction = target_position[1] - dude_position[1];
				
				switch(x_direction){
					case 0:
						var start_x = dude_position[0] - 1;
						var end_x = start_x+2;
						break;
					case 1:
						var start_x = dude_position[0] + 1;
						var end_x = start_x+1;
						break;
					case -1:
						var start_x = dude_position[0] - 2;
						var end_x = start_x+1;
					default:
						break;
				}
				switch(y_direction){
					case 0:
						var start_y = dude_position[1] - 1;
						var end_y = start_y+2;
						break;
					case 1:
						var start_y = dude_position[1] + 1;
						var end_y = start_y+1;
						break;
					case -1:
						var start_y = dude_position[1] - 2;
						var end_y = start_y+1;
					default:
						break;
				}
				
				for(var x=start_x; x<=end_x; x++){
					for(var y=start_y; y<=end_y; y++){
						place_dude_with('wall', 'dudes', [x,y], 'field', dude_color);
					}
				}
			}
		},
	},
	zombie: object = {
		description: "zombie:<br/>comes back from dead.",
		tag: ' Z',
		sprite: 'spooky',
		sprite_height: 80,
		sprite_width: 58,
		mobility: false,
		is_piece: true,
		lives: 1,
		cost: 2,
		movement_patterns: [
			[1, -1, 1, 1],
			[1, 1, 1, 1],
			[-1, -1, 1, 1],
			[-1, 1, 1, 1]	
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [	
			[1,0,1,1],
			[-1,0,1,1],
			[0,1,1,1],
			[0,-1,1,1]
		],
		custom_attack_pattern: function(position){
			return [];
		},
		action_patterns: [
		],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(target_position, dude_position){
		},
	},
	necromancer: object = {
		description: "necromancer:<br/>makes pawns.",
		tag: 'NM',
		sprite: 'necromancer',
		sprite_width: 57,
		sprite_height: 80,
		lives: 0,
		cost: 15,
		mobility: false,
		is_piece: true,
		movement_patterns: [
			[1, -1, 1, 2],
			[1, 1, 1, 2],
			[-1, -1, 1, 2],
			[-1, 1, 1, 2]
		],
		custom_movement_pattern: function(position){
			return [];
		},
		attack_patterns: [
		],
		custom_attack_pattern: function(position){
			return [];
		},
		action_patterns: [
			[1,0,1,1],
			[-1,0,1,1],
			[0,1,1,1],
			[0,-1,1,1]
		],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(target_position, dude_position){
			var color = bekaari['dudes'][bekaari['game_start'].selected_id].color;
			place_dude_with('zombie', 'dudes', target_position, 'field', color);
		},
	},
	rook: object = {
		description: 'rook:<br/>moves/attacks on columns and rows.',
		tag: 'Rk',
		sprite: 'rook',
		sprite_width: 69,
		sprite_height: 80,
		lives: 0,
		cost: 5,
		mobility: false,
		is_piece: true,
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
		action_patterns: [],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(position){
			
		}
	},
	pawn: object = {
		description: 'pawn:<br/>moves on columns and rows. attacks on diagonals.',
		tag: 'p',
		sprite: 'pawn',
		sprite_width: 80,
		sprite_height: 80,
		mobility: false,
		is_piece: true,
		lives: 0,
		cost: 1,
		movement_patterns: [
			[0, -1, 1, 2],
			[1, 0, 1, 2],
			[0, 1, 1, 2],
			[-1, 0, 1, 2]
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
		action_patterns: [],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(position){
			
		}
	},
	bishop: object = {
		description: 'bishop:<br/>moves/attacks on diagonals.',
		tag: 'Bh',
		sprite: 'bishop',
		sprite_width: 77,
		sprite_height: 80,
		mobility: false,
		is_piece: true,		
		lives: 0,
		cost: 3,
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
		action_patterns: [],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(position){
			
		},
	},
	queen: object = {
		description: 'quen:<br/>moves/attacks in all directions.',
		tag: 'Qn',
		sprite: 'queen',
		sprite_width: 80,
		sprite_height: 75,		
		mobility: false,
		is_piece: true,
		lives: 0,
		cost: 9,
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
		action_patterns: [],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(position){
			
		},
	},
	king: object = {
		description: 'king:<br/>moves/attacks in all directions.',
		tag: 'Kg',
		sprite: 'king',
		mobility: false,
		is_piece: true,
		is_king: true,
		lives: 0,
		cost: 0,
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
		action_patterns: [],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(position){
			
		},
	},
	knight: object = {
		description: 'knight:<br/>moves/attacks in an L patter - can move over intervening dudes.',
		tag: 'Kt',
		sprite: 'knight',
		sprite_width: 55,
		sprite_height: 80,
		mobility: false,
		is_piece: true,
		lives: 0,
		cost: 3,
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
		action_patterns: [],
		custom_action_pattern: function(position){
			return [];
		},
		action: function(position){
			
		},
	},

};
var dude_list_keys = Object.keys(dude_list);

function get_positions(dude, position){
	//pattern = [x,y,min,max]
	return _.filter(dude_list[dude].custom_movement_pattern(position), function(pos){
		return !get_occupant_position(pos);
	}
		).concat(
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

function get_attack_positions(dude, position, display){
	//pattern = [x,y,min,max]
	return _.filter(dude_list[dude].custom_attack_pattern(position), function(pos){
			var occupant = get_occupant_position(pos);
			if(occupant){
				return occupant.type != 'obstacle';
			}
			else{
				return (display == true);
			}
		})
		.concat(
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
					if(display) positions.push(new_position)
				}
			}
			return positions;
		}))
	);
}

function get_action_positions(dude, position){
	//pattern = [x,y,min,max]
	return dude_list[dude].custom_action_pattern(position).concat(
		_.flatten(_.map(dude_list[dude].action_patterns, function(pattern, index, collection){
			var positions = [];
			for(var i = pattern[2]; i <= pattern[3]; i++){
				var new_position = [position[0]+(pattern[0] * i), position[1]+(pattern[1] * i)];
				var occupant = get_occupant_position(new_position);
				if(occupant){
					i = pattern[3] + 1;
					positions.push(new_position);
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

function get_all_positions(type, position, display){
	return _.uniqBy(
		get_positions(type, position).concat(
			get_attack_positions(type, position, display)
		),
		function(arr){
			return arr[0].toString() + arr[1].toString();
		}
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
	this.color = null;
}

function Dude(id, position, type, color){
	this.id = id;
	this.position = [];
	this.position[0] = position[0];
	this.position[1] = position[1];
	this.type = type;
	this.color = color;
	this.activated = false;
	this.count = 0;
	this.lifespan_count = 0;
	this.captured_count = 0;
	this.frozen = false;
	this.was_frozen = false;
}

function place_dude_capture(dude_type, dudes, position, field, color){
	if(position_valid(position)){
		if(bekaari[field][position[0]][position[1]]){
			var occupant = get_occupant_position(position);
			var id = shortid.generate();
			if(occupant){
				if(occupant.type != 'obstacle'){
					capture_dude(occupant.id);
					bekaari[dudes][id] = new Dude(id, position, dude_type, color);
					bekaari[field][position[0]][position[1]].occupant = id;
					return id;
				}
			}
			else{
				bekaari[dudes][id] = new Dude(id, position, dude_type, color);
				bekaari[field][position[0]][position[1]].occupant = id;
				return id;
			}
			
		}
		else{
			console.log('position doesnt exist!', position);
		}
	}
}

function place_dude_with(dude_type, dudes, position, field, color){
	if(position_valid(position)){
		if(!bekaari[field][position[0]][position[1]].occupant){
			if(dude_list[dude_type].is_king){
				var kings = _.filter(bekaari['dudes'], function(dude){
					return (dude.type == 'king') && (dude.color == color);
				})
				if(kings.length<1){
					var id = shortid.generate();
					bekaari[dudes][id] = new Dude(id, position, dude_type, color);
					bekaari[field][position[0]][position[1]].occupant = id;
				}
			}
			else{
				var id = shortid.generate();
				bekaari[dudes][id] = new Dude(id, position, dude_type, color);
				bekaari[field][position[0]][position[1]].occupant = id;
			}
		}
	}
	else{
		console.log('position doesnt exist!', position);
	}
}

function place_dude(){
	if(bekaari['field'][bekaari['selected'][0]][bekaari['selected'][1]]){
		if(bekaari['field'][bekaari['selected'][0]][bekaari['selected'][1]].occupant == null){
			var color = bekaari['deployment'].color;
			_.forEach(bekaari['deployment_zone'], function(zone){
				if((zone[0] == bekaari['selected'][0]) && (zone[1] == bekaari['selected'][1])){
					color = zone[2];
				}
			});
			place_dude_with(bekaari['deployment'].selected, 'dudes', bekaari['selected'], 'field', color);
		}
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

color_list = ['#00FF00', '#FF0000', '#00FFFF', '#FF00FF']
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

function activate_dude(dude_id){
	console.log('activate_dude');
	bekaari['dudes'][dude_id].activated = true;
	bekaari['dudes'][dude_id].count = 0;
	
	if(_.filter(bekaari['dudes'], function(dude){
		return !dude.activated && dude_list[dude.type].is_piece;// && (dude.color == bekaari['dudes'][dude_id].color);
	}).length < 1){
		console.log('all_dudes_activated');
		_.forEach(bekaari['scenario_zones'], function(zone){
			//get occupants of the zone
			//if there is only 1 color of pieces in the zone
			//that team gets a point
			var occupant_colors = {};
			_.forEach(zone, function(position){
				var x = position[0];
				var y = position[1];
				var occupant = get_occupant_position([x,y]);
				if(occupant){
					if(dude_list[occupant.type].is_piece){
						occupant_colors[occupant.color] = true;
					}
				}
			});
			var keys = Object.keys(occupant_colors);
			if(keys.length == 1){
				var team = _.filter(bekaari['teams'], function(t){
					return t.color == keys[0];
				})[0];
				team.game_points +=1;
			}
		});
		_.forEach(bekaari['teams'], function(team){
			draw_game_points(team);
			if(team.game_points >= bekaari['max_game_points']){
				console.log(team.color, ' WINS');
				_.forEach(bekaari['dudes'], function(dude){
					if(dude.color != team.color){
						remove_dude_ignore_lives(dude.id);
					}
				});
			}
		});
		_.forEach(bekaari['dudes'], function(dude){
			if(bekaari['dudes'][dude.id].frozen){
				bekaari['dudes'][dude.id].frozen = false;
				bekaari['dudes'][dude.id].was_frozen = true;
			}
			else{
				bekaari['dudes'][dude.id].activated = false;
				bekaari['dudes'][dude.id].was_frozen = false;
			}
			// if(dude_list[dude.type].on_turn){
				// dude_list[dude.type].on_turn(dude.id);
			// }
		});	
	}
}

function bekaari_cancel(){
	switch(bekaari['game_mode']){
		case 'game_start':
			bekaari['game_start'].mode = 'idle';
			activate_dude(bekaari['game_start'].selected_id);
			break;
		default:
	}
}

function bekaari_select(){
	switch(bekaari['game_mode']){
		case 'game_start':
			switch(bekaari['game_start'].mode){
				case 'idle':
					var occupant = get_occupant_selected();
					if(occupant){
						if(!occupant.activated && dude_list[occupant.type].is_piece){
							//get all dudes on same team that haven't activated yet
							var activated_team = _.filter(bekaari['dudes'], function(dude){
								return (dude.activated && !dude.was_frozen) && dude_list[dude.type].is_piece && (dude.color == occupant.color);
							});
							//if there is none trigger start of turn stuff
							if(activated_team.length < 1){
								console.log('turn start');
								var team = _.filter(bekaari['dudes'], function(dude){
									return (dude.color == occupant.color);
								});
								_.forEach(team, function(dude){
									if(bekaari['dudes'][dude.id]){
										bekaari['dudes'][dude.id].lifespan_count += 1;
										if(bekaari['dudes'][dude.id].lifespan_count >= dude_list[dude.type].lifespan){
											remove_dude(dude.id);
										}
										if(dude_list[dude.type].on_turn){
											dude_list[dude.type].on_turn(dude.id);
										}
									}
								});
							}
							
							bekaari['game_start'].selected_id = occupant.id;
							bekaari['game_start'].selected_position[0] = bekaari['selected'][0];
							bekaari['game_start'].selected_position[1] = bekaari['selected'][1];
							bekaari['game_start'].selected_type = occupant.type;
							bekaari['game_start'].selected_positions = get_all_positions(occupant.type, occupant.position, false);
							if(bekaari['game_start'].selected_positions.length > 0){
								bekaari['game_start'].mode = 'moving';
							}
							else if(get_action_positions(bekaari['game_start'].selected_type, occupant.position).length > 0){
								bekaari['game_start'].selected_positions = get_action_positions(bekaari['game_start'].selected_type, bekaari['selected']);
								bekaari['game_start'].mode = 'activating';
							}
							else{
								bekaari['game_start'].mode = 'idle';
								activate_dude(bekaari['game_start'].selected_id);
							}
						}
					}
					break;
				case 'moving':
					console.log('moving');
					bekaari['game_start'].selected_positions = get_all_positions(bekaari['game_start'].selected_type, bekaari['game_start'].selected_position, false);
					_.forEach(bekaari['game_start'].selected_positions, function(position){
						if((position[0] == bekaari['selected'][0]) && (position[1] == bekaari['selected'][1])){
							console.log('move_dude()');
							move_dude(bekaari['game_start'].selected_id, bekaari['game_start'].selected_position,  position);
							if(bekaari['dudes'][bekaari['game_start'].selected_id]){
								bekaari['game_start'].selected_position[0] = bekaari['selected'][0];
								bekaari['game_start'].selected_position[1] = bekaari['selected'][1];
								bekaari['game_start'].selected_positions = get_action_positions(bekaari['game_start'].selected_type, bekaari['selected']);
								if(bekaari['game_start'].selected_positions.length > 0){	
									bekaari['dudes'][bekaari['game_start'].selected_id].count += 1;
									if(bekaari['dudes'][bekaari['game_start'].selected_id].count < dude_list[bekaari['game_start'].selected_type].moves){
										//multiple moves?
										bekaari['game_start'].selected_positions = get_all_positions(bekaari['game_start'].selected_type, bekaari['selected'], false);
									}
									else{
										bekaari['dudes'][bekaari['game_start'].selected_id].count = 0;
										bekaari['game_start'].mode = 'activating';
									}
								}
								else{
									bekaari['dudes'][bekaari['game_start'].selected_id].count += 1;
									if(bekaari['dudes'][bekaari['game_start'].selected_id].count < dude_list[bekaari['game_start'].selected_type].moves){
										//multiple moves?
										bekaari['game_start'].selected_positions = get_all_positions(bekaari['game_start'].selected_type, bekaari['selected'], false);
									}
									else{
										bekaari['dudes'][bekaari['game_start'].selected_id].count = 0;
										bekaari['game_start'].mode = 'idle';
										activate_dude(bekaari['game_start'].selected_id);
									}
								}
							}
						
						}
					});
					break;
				case 'activating':
					var activating_dude = bekaari['dudes'][bekaari['game_start'].selected_id];
					_.forEach(bekaari['game_start'].selected_positions, function(position){
						if((position[0] == bekaari['selected'][0]) && (position[1] == bekaari['selected'][1])){
							dude_list[activating_dude.type].action(position, bekaari['game_start'].selected_position);
							bekaari['game_start'].mode = 'idle';
							activate_dude(bekaari['game_start'].selected_id);
						}
					});
					break;
				default:
			}
			break;
		case 'deployment':
			var dude_type = dude_list[bekaari['deployment'].selected];
			var dude_color = bekaari['deployment'].color; 
			_.forEach(bekaari['deployment_zone'], function(zone){
				if((zone[0] == bekaari['selected'][0]) && (zone[1] == bekaari['selected'][1])){
					dude_color = zone[2];
				}
			});
			if(dude_type.is_piece){
				var team = _.filter(bekaari['teams'], function(t){
						return t.color == dude_color;
				})[0];
				if(team){
					if((team.dude_points + dude_type.cost) <= bekaari['max_dude_points']){
						team.dude_points += dude_type.cost;
						place_dude();
						draw_dude_points(team);
					}
					else{
						bekaari['message'] = '<br/><br/> not enough points';
					}
				}
			}
			break;
		default:
	}
}

function four_corners_deployment(deployment_zone, dudes, field){
	bekaari[deployment_zone] = [];
	
	var S_color = '#FF00FF';
	var E_color = '#00FF00';
	var W_color = '#FF0000';
	var N_color = '#00FFFF';
	var obstacle_color = '#AAAAAA';
	
	var dh = 3;
	var dw = 5;
	
	for(var i=0; i<dw; i++){
		for(var j=0; j<dh; j++){
			bekaari[deployment_zone].push([i, j, N_color]);
		}
		for(var k=bekaari['height']-dh; k<bekaari['height']; k++){
			bekaari[deployment_zone].push([i, k, W_color]);
		}
		for(var l=5; l<7; l++){
			place_dude_with('obstacle', dudes, [i, l], field, obstacle_color);	
		}
	}
	
	for(var a=bekaari['width']-dw; a<bekaari['width']; a++){
		for(var b=0; b<dh; b++){
			bekaari[deployment_zone].push([a, b, E_color]);
		}
		for(var c=bekaari['height']-dh; c<bekaari['height']; c++){
			bekaari[deployment_zone].push([a, c, S_color]);
		}
		for(var d=5; d<7; d++){
			place_dude_with('obstacle', dudes, [a, d], field, obstacle_color);	
		}
	}
	
	for(var m=0; m<dh; m++){
		place_dude_with('obstacle', dudes, [12, m], field, obstacle_color);	
		place_dude_with('obstacle', dudes, [12, bekaari['height']-(m+1)], field, obstacle_color);	
	}
}

function initiate_fourth_map(){
	var field = 'fourth_field';
	var dudes = 'fourth_dudes';
	var deployment_zone = 'fourth_deployment_zone';
	var scenario_zone = 'fourth_scenario_zones';
	
	bekaari_new_matrix(field);
	bekaari[dudes] = {};
	bekaari[scenario_zone] = [];

	four_corners_deployment(deployment_zone, dudes, field);
	
	var S_color = '#FF00FF';
	var E_color = '#00FF00';
	var W_color = '#FF0000';
	var N_color = '#00FFFF';
	var obstacle_color = '#AAAAAA';
	
	var w = bekaari['width'];
	var h = bekaari['height'];
	
	var zw = 3;
	var zh = 2;
	var zones = [[7,2], [15,2], [7,8], [15,8], [11,5]];
	for(var o = 0; o<zones.length; o++){
		var z0 = zones[o][0];
		var z1 = zones[o][1];
		bekaari[scenario_zone].push([]);
		for(var n=z0; n < z0+zw; n++){
			for(var p=z1; p < z1+zh; p++){
				bekaari[scenario_zone][o].push([n,p]);
			}
		}
	}
	
	place_dude_with('king', dudes, [0, 0], field, N_color);
	place_dude_with('frost_giant', dudes, [3, 1], field, N_color);
	place_dude_with('frost_giant', dudes, [3, 2], field, N_color);
	place_dude_with('frost_giant', dudes, [2, 2], field, N_color);
	place_dude_with('archer', dudes, [2, 1], field, N_color);
	place_dude_with('archer', dudes, [1, 2], field, N_color);
	place_dude_with('archer', dudes, [3, 1], field, N_color);
	place_dude_with('bishop', dudes, [1, 1], field, N_color);
	place_dude_with('lance', dudes, [0, 2], field, N_color);
	place_dude_with('lance', dudes, [2, 0], field, N_color);
	
	
	place_dude_with('king', dudes, [w-1, 0], field, E_color);	
	place_dude_with('tree_of_life', dudes, [w-2, 0], field, E_color);	
	place_dude_with('tree_of_life', dudes, [w-3, 0], field, E_color);	
	place_dude_with('tree_of_life', dudes, [w-4, 0], field, E_color);	
	place_dude_with('ninja', dudes, [w-2, 1], field, E_color);	
	place_dude_with('ninja', dudes, [w-3, 1], field, E_color);	
	place_dude_with('ninja', dudes, [w-4, 1], field, E_color);	
	place_dude_with('frost_giant', dudes, [w-4, 2], field, E_color);	
	place_dude_with('wall_dude', dudes, [w-3, 2], field, E_color);	
	place_dude_with('wind_guy', dudes, [w-1, 2], field, E_color);	
	place_dude_with('knight', dudes, [w-1, 1], field, E_color);	
	
	place_dude_with('king', dudes, [0, h-1], field, W_color);	
	place_dude_with('dragon', dudes, [1, h-1], field, W_color);
	place_dude_with('wind_guy', dudes, [0, h-3], field, W_color);
	place_dude_with('wind_guy', dudes, [0, h-2], field, W_color);
	place_dude_with('axe_dude', dudes, [1, h-3], field, W_color);
	place_dude_with('axe_dude', dudes, [1, h-2], field, W_color);
	place_dude_with('axe_dude', dudes, [2, h-3], field, W_color);
	place_dude_with('axe_dude', dudes, [2, h-2], field, W_color);
	place_dude_with('wall_dude', dudes, [3, h-3], field, W_color);
	place_dude_with('wall_dude', dudes, [3, h-2], field, W_color);
	
	place_dude_with('king', dudes, [w-1, h-1], field, S_color);	
	place_dude_with('necromancer', dudes, [w-2, h-3], field, S_color);	
	place_dude_with('necromancer', dudes, [w-3, h-2], field, S_color);	
	place_dude_with('necromancer', dudes, [w-4, h-1], field, S_color);	
	place_dude_with('rook', dudes, [w-1, h-2], field, S_color);	
	place_dude_with('rook', dudes, [w-2, h-1], field, S_color);	
	place_dude_with('lance', dudes, [w-4, h-3], field, S_color);	
	place_dude_with('dervish', dudes, [w-3, h-1], field, S_color);	
	place_dude_with('wraith', dudes, [w-3, h-3], field, S_color);	
	place_dude_with('dervish', dudes, [w-2, h-2], field, S_color);	
	place_dude_with('wraith', dudes, [w-4, h-2], field, S_color);	
}

function initiate_third_map(){
	var field = 'third_field';
	var dudes = 'third_dudes';
	var deployment_zone = 'third_deployment_zone';
	var scenario_zone = 'third_scenario_zones';
	
	bekaari_new_matrix(field);
	bekaari[dudes] = {};
	bekaari[scenario_zone] = [];
	
	four_corners_deployment(deployment_zone, dudes, field);
	
	var S_color = '#FF00FF';
	var E_color = '#00FF00';
	var W_color = '#FF0000';
	var N_color = '#00FFFF';
	var obstacle_color = '#AAAAAA';
	
	var w = bekaari['width'];
	var h = bekaari['height'];
	
	var zw = 3;
	var zh = 2;
	var zones = [[7,2], [15,2], [7,8], [15,8], [11,5]];
	for(var o = 0; o<zones.length; o++){
		var z0 = zones[o][0];
		var z1 = zones[o][1];
		bekaari[scenario_zone].push([]);
		for(var n=z0; n < z0+zw; n++){
			for(var p=z1; p < z1+zh; p++){
				bekaari[scenario_zone][o].push([n,p]);
			}
		}
	}
	
	// place_dude_with('king', dudes, [0, 0], field, N_color);	
	place_dude_with('king', dudes, [bekaari['width']-1, 0], field, E_color);	
	place_dude_with('king', dudes, [0, bekaari['height']-1], field, W_color);	
	// place_dude_with('king', dudes, [bekaari['width']-1, bekaari['height']-1], field, S_color);	
	
}

function initiate_second_map(){
	var field = 'second_field';
	var dudes = 'second_dudes';
	var deployment_zone = 'second_deployment_zone';
	bekaari_new_matrix(field);
	bekaari[dudes] = {};
	bekaari[deployment_zone] = [];
	var W_color = '#FF0000';
	var E_color = '#FF00FF';
	var obstacle_color = '#AAAAAA';
	_.forEach([], function(point){
		for(var x=point[0]; x<(point[0]+point[2]);x++){
			for(var y=point[1]; y<(point[1]+point[3]); y++){
				place_dude_with('obstacle', dudes, [x, y], field, obstacle_color);	
			}
		}
	});
	for(var a=0; a<bekaari['height']; a++){
		place_dude_with('obstacle', dudes, [0, a], field, obstacle_color);	
		place_dude_with('obstacle', dudes, [1, a], field, obstacle_color);	
		place_dude_with('obstacle', dudes, [2, a], field, obstacle_color);	
		place_dude_with('obstacle', dudes, [bekaari['width']-1, a], field, obstacle_color);	
		place_dude_with('obstacle', dudes, [bekaari['width']-2, a], field, obstacle_color);	
		place_dude_with('obstacle', dudes, [bekaari['width']-3, a], field, obstacle_color);	
	}
	for(var b=3; b<bekaari['width']-3; b++){
		place_dude_with('obstacle', dudes, [b, 0], field, obstacle_color);	
		place_dude_with('obstacle', dudes, [b, 1], field, obstacle_color);
		place_dude_with('obstacle', dudes, [b, bekaari['height']-1], field, obstacle_color);	
		place_dude_with('obstacle', dudes, [b, bekaari['height']-2], field, obstacle_color);	
	}
	for(var i=2; i<10; i++){
		bekaari[deployment_zone].push([3, i, W_color]);
		bekaari[deployment_zone].push([4, i, W_color]);
		bekaari[deployment_zone].push([bekaari['width']-5, i, E_color]);
		bekaari[deployment_zone].push([bekaari['width']-4, i, E_color]);
	}	
}

function initiate_first_map(){
	var field = 'first_field';
	var dudes = 'first_dudes';
	var deployment_zone = 'first_deployment_zone';
	bekaari_new_matrix(field);
	bekaari[dudes] = {};
	bekaari[deployment_zone] = [];
	var W_color = '#FF0000';
	var E_color = '#FF00FF';
	var obstacle_color = '#AAAAAA'
	_.forEach([[5,1,3,3], [9,9,3,1], [14,4,5,2]], function(point){
		for(var x=point[0]; x<(point[0]+point[2]);x++){
			for(var y=point[1]; y<(point[1]+point[3]); y++){
				place_dude_with('obstacle', dudes, [x, y], field, obstacle_color);	
			}
		}
	});
	for(var i=2; i<10; i++){
		bekaari[deployment_zone].push([0, i, W_color]);
		bekaari[deployment_zone].push([1, i, W_color]);
		bekaari[deployment_zone].push([bekaari['width']-2, i, E_color]);
		bekaari[deployment_zone].push([bekaari['width']-1, i, E_color]);
	}
}

function initiate_chess_map(){
	var field = 'chess_field';
	var dudes = 'chess_dudes';
	var deployment_zone = 'chess_deployment_zone';
	
	bekaari_new_matrix(field);
	bekaari[dudes] = {};
	bekaari[deployment_zone] = [];
	
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
	
	var W_color = '#00FF00';
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
		place_dude_with('pawn', dudes, [9, c], field, W_color);
		place_dude_with('pawn', dudes, [14, c], field, E_color);
	}
}

function next_piece(){
	if(bekaari['game_mode'] == 'game_start'){
		if(bekaari['game_start'].mode == 'idle'){
			var next_list = _.filter(bekaari['dudes'], function(dude){
				return ((!dude.activated) && (bekaari['next_pieces'].indexOf(dude.id)<0) && dude_list[dude.type].is_piece);
			});
			if(next_list.length > 0){
				bekaari['selected'][0] = next_list[0].position[0];
				bekaari['selected'][1] = next_list[0].position[1];
				bekaari['next_pieces'].push(next_list[0].id);			
			}
			else{
				bekaari['next_pieces'] = [];
				next_piece();
			}
		}
		else if(bekaari['game_start'].mode == 'moving'){
			//TODO
		}
		else if(bekaari['game_start'].mode == 'activating'){
			//TODO
		}
	}
}

function next_map(){
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
		var new_deployment_zone = bekaari['maps'][new_index] + 'deployment_zone';
		var new_scenario_zone = bekaari['maps'][new_index] + 'scenario_zones';
		set_map('field', bekaari[new_field], 'dudes', bekaari[new_dudes]);
		set_zone('deployment_zone', new_deployment_zone);
		set_zone('scenario_zones', new_scenario_zone);
	}
	bekaari_to_deployment();
}

function set_zone(zone, new_zone){
	bekaari[zone] = bekaari[new_zone];
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
	bekaari['game_mode_infobox'].innerHTML = 'mode: Game Start';
	_.forEach(bekaari['teams'], function(team){
		team.game_points = 0;
		draw_game_points(team);
	});
}

function bekaari_new(){
	bekaari['dudes'] = {};
	bekaari_new_matrix('field');
	bekaari_to_deployment();
}

function bekaari_to_deployment(){
	bekaari['game_mode'] = 'deployment';
	bekaari['game_mode_infobox'].innerHTML = 'mode: Deployment';
	_.forEach(bekaari['teams'], function(team){
		team.dude_points = 0;
		draw_dude_points(team);
	});
}

function bekaari_start(){
	console.log('bekaari_start', bekaari['map']);
	set_map('save_field', bekaari['field'], 'save_dudes', bekaari['dudes']);
	bekaari['game_mode'] = 'game_start';
	bekaari['game_start'].mode = 'idle';
	bekaari['game_mode_infobox'].innerHTML = 'mode: Game Start';
	_.forEach(bekaari['teams'], function(team){
		team.game_points = 0;
		draw_game_points(team);
	});
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
	bekaari['ctx'].font = '40pt Calibri';
	
	//calculate the width and height of field based on canvas size and desired size of position
	bekaari['deployment_zone'] = [];
	bekaari['scenario_zones'] = [];
	bekaari['field'] = [];
	bekaari['save_field'] = [];
	bekaari['position_radius'] = 80;//note: this will be half? 
	bekaari['width'] = Math.floor(bekaari['canvas'].width / bekaari['position_radius']);
	bekaari['height'] = Math.floor(bekaari['canvas'].height / bekaari['position_radius']);
	bekaari['selected'] = [2, 2];
	bekaari['gamepads'] = {};
	bekaari['game_mode'] = 'deployment';
	bekaari['message'] = '';
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
	
	bekaari['max_dude_points'] = 100;
	bekaari['max_game_points'] = 10;
	bekaari['teams'] = [
		{
			color: '#FF00FF',
			box: document.getElementById("bekaari_purple"),
			game_points: 0,
			dude_points: 0 
		},		{
			color: '#FF0000',
			box: document.getElementById("bekaari_red"),
			game_points: 0,
			dude_points: 0 
		},		{
			color: '#00FFFF',
			box: document.getElementById("bekaari_blue"),
			game_points: 0,
			dude_points: 0 
		},		{
			color: '#00FF00',
			box: document.getElementById("bekaari_green"),
			game_points: 0,
			dude_points: 0 
		},
		
	];
	
	bekaari['next_pieces'] = [];
	bekaari['map'] = '';
	bekaari['maps'] = ['', 'chess_', 'first_', 'second_', 'third_', 'fourth_'];
	
	bekaari_new_matrix('field');
	bekaari_new_matrix('save_field');
	initiate_chess_map();
	initiate_first_map();
	initiate_second_map();
	initiate_third_map();
	initiate_fourth_map();
	next_map();
	bekaari_color_shift_forward();
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
	bekaari_start();
}

function remove_dude(id){
	if(bekaari['dudes'][id]){
		var position = bekaari['dudes'][id].position;
		bekaari['field'][position[0]][position[1]].occupant = '';
		capture_dude(id);
	}
}

function remove_dude_ignore_lives(id){
	console.log('remove_dude_ignore_lives');
	if(bekaari['dudes'][id]){
		var position = bekaari['dudes'][id].position;
		bekaari['field'][position[0]][position[1]].occupant = '';
		capture_dude_ignore_lives(id);
	}
}

function capture_dude(dude_id){
	var lives = dude_list[bekaari['dudes'][dude_id].type].lives;
	bekaari['dudes'][dude_id].captured_count += 1;
	if(bekaari['dudes'][dude_id].captured_count <= lives){
		var x = bekaari['dudes'][dude_id].position[0];
		var y = bekaari['dudes'][dude_id].position[1];
		var adjacent = _.shuffle([[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,1],[1,-1],[1,0]]);
		var found = false;
		for(var a=0; a<adjacent.length; a++){
			var i = adjacent[a][0];
			var j = adjacent[a][1];
			if(position_valid([x+i, y+j])){
				if((!get_occupant_position([x+i, y+j])) && !found){
					move_dude(dude_id, [x,y], [x+i, y+j]);
					a = 100;
					found = true;
				}
			}
		}
		if(!found){
			if(dude_list[bekaari['dudes'][dude_id].type].is_king){
				var color = bekaari['dudes'][dude_id].color;
				_.forEach(bekaari['dudes'], function(dude){
					if((dude.color == color) && (dude.type != 'king')){
						remove_dude_ignore_lives(dude.id);
					}
				});
			}
			delete bekaari['dudes'][dude_id];
		}
	}
	else{
		if(dude_list[bekaari['dudes'][dude_id].type].is_king){
				var color = bekaari['dudes'][dude_id].color;
				_.forEach(bekaari['dudes'], function(dude){
					if((dude.color == color) && (dude.type != 'king')){
						remove_dude_ignore_lives(dude.id);
					}
				});
		}
		delete bekaari['dudes'][dude_id];
	}
}
function capture_dude_ignore_lives(dude_id){
	if(dude_list[bekaari['dudes'][dude_id].type].is_king){
		var color = bekaari['dudes'][dude_id].color;
		_.forEach(bekaari['dudes'], function(dude){
			if((dude.color == color) && (dude.type != 'king')) remove_dude(dude.id);
		});
	}
	delete bekaari['dudes'][dude_id];
}

function move_dude(dude_id, old_position, position){
	if(position_valid(position)){
		var occupant = get_occupant_position(position);
		if(occupant){
			if(occupant.type != 'obstacle'){
				var type = occupant.type;
				capture_dude(occupant.id);
				if(dude_list[type].on_captured) dude_list[type].on_captured(dude_id, position);
				bekaari['dudes'][dude_id].position[0] = position[0];
				bekaari['dudes'][dude_id].position[1] = position[1];
				bekaari['field'][old_position[0]][old_position[1]].occupant = false;
				bekaari['field'][position[0]][position[1]].occupant = dude_id;
			}
		}
		else{
			bekaari['dudes'][dude_id].position[0] = position[0];
			bekaari['dudes'][dude_id].position[1] = position[1];
			bekaari['field'][old_position[0]][old_position[1]].occupant = false;
			bekaari['field'][position[0]][position[1]].occupant = dude_id;
		}
	}
}

function move_dude_test(dude_id, old_position, position){
	async.series([
		function(callback) {
			// do some stuff ...
			var occupant = get_occupant_position(position);
			if(occupant){
				console.log(occupant.type, position);
				if(occupant.type != 'obstacle'){
					var type = occupant.type;
					capture_dude(occupant.id);
					if(dude_list[type].on_captured) dude_list[type].on_captured(dude_id, position);
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
			bekaari['field'][old_position[0]][old_position[1]].occupant = false;
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
	if(position_valid(bekaari['selected'])){
		if(bekaari['field'][bekaari['selected'][0]][bekaari['selected'][1]]){
			return  bekaari['dudes'][bekaari['field'][bekaari['selected'][0]][bekaari['selected'][1]].occupant];
		}
		else{
			return false;
		}
	}
	else{
		return false;
	}
}

function draw_game_points(team){
	team.box.innerHTML = 'game points: ' + team.game_points + '/' + bekaari['max_game_points'];
}

function draw_dude_points(team){
	team.box.innerHTML = 'dude points: ' + team.dude_points + '/' + bekaari['max_dude_points'];
}

function draw_deployment_zones(){
	bekaari['ctx'].setLineDash([]);
	_.forEach(bekaari['deployment_zone'], function(zone){
		bekaari['ctx'].strokeStyle = zone[2];
		bekaari['ctx'].strokeRect(
			zone[0]*bekaari['position_radius'],
			zone[1]*bekaari['position_radius'],
			bekaari['position_radius'],
			bekaari['position_radius']
		);
		
	});
}

function draw_scenario_zones(){
	bekaari['ctx'].globalAlpha = 0.2;
	bekaari['ctx'].fillStyle = '#ffffff';
	_.forEach(bekaari['scenario_zones'], function(zone){
		_.forEach(zone, function(position){
			var x = position[0];
			var y = position[1];
			bekaari['ctx'].fillRect(
				x*bekaari['position_radius'],
				y*bekaari['position_radius'],
				bekaari['position_radius'],
				bekaari['position_radius']
			);
		});
	});
	bekaari['ctx'].globalAlpha = 1.0;
}

function shadeColor2(color, percent) {   
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}

function draw_dude(dude){
	if((bekaari['game_mode'] == 'game_start') && (dude.activated)){
		bekaari['ctx'].fillStyle = shadeColor2(dude.color, .80);
	}
	else{
		bekaari['ctx'].fillStyle = dude.color;	
	}

	if(dude_list[dude.type].sprite){
		var x = dude.position[0] * bekaari['position_radius'];
		var y = dude.position[1] * bekaari['position_radius'];
		bekaari['ctx'].globalAlpha = 0.2;
		bekaari['ctx'].fillRect(
			x,
			y,
			bekaari['position_radius'],
			bekaari['position_radius']
		);
		bekaari['ctx'].globalAlpha = 1.0;
		if(dude_list[dude.type].sprite_width){
			bekaari['ctx'].drawImage(
				document.getElementById(dude_list[dude.type].sprite),
				dude.position[0]*bekaari['position_radius'],
				((dude.position[1])*bekaari['position_radius']),
				dude_list[dude.type].sprite_width,
				dude_list[dude.type].sprite_height
			);
		}
		else{
			bekaari['ctx'].drawImage(
			document.getElementById(dude_list[dude.type].sprite),
				dude.position[0]*bekaari['position_radius'],
				((dude.position[1])*bekaari['position_radius'])
			);		
		}
	}
	else{
		bekaari['ctx'].fillText(
			dude_list[dude.type].tag,
			dude.position[0]*bekaari['position_radius'],
			((dude.position[1]+1)*bekaari['position_radius']) - 15
		);
	}
	if(dude.frozen){
		bekaari['ctx'].fillStyle = '#00FFFF';	
		bekaari['ctx'].fillText(
			'ice',
			dude.position[0]*bekaari['position_radius'],
			((dude.position[1]+1)*bekaari['position_radius']) - 15
		);
	}
	var lives = dude_list[dude.type].lives - dude.captured_count;
	if(lives > 0){
		bekaari['ctx'].fillStyle = dude.color;	
		bekaari['ctx'].font = '20pt Calibri';
		bekaari['ctx'].fillText(
			lives,
			dude.position[0]*bekaari['position_radius'],
			((dude.position[1]+1)*bekaari['position_radius']) - 15
		);
		bekaari['ctx'].font = '40pt Calibri';	
	}
}

function draw_patterns(dude, display, activating){;
	if(dude){
		if(!activating){
			_.forEach(get_positions(dude.type, dude.position), function(position){
				bekaari['ctx'].setLineDash([]);
				bekaari['ctx'].lineWidth=1;
				bekaari['ctx'].strokeStyle=dude.color;
				bekaari['ctx'].strokeRect(
					position[0]*bekaari['position_radius'],
					position[1]*bekaari['position_radius'],
					bekaari['position_radius'],
					bekaari['position_radius']
				);
			});
			_.forEach(get_attack_positions(dude.type, dude.position, display), function(position){
				bekaari['ctx'].setLineDash([20,bekaari['position_radius']-40, 20, 0]);
				bekaari['ctx'].lineWidth=7;
				bekaari['ctx'].strokeStyle= dude.color;
				bekaari['ctx'].strokeRect(
					position[0]*bekaari['position_radius'],
					position[1]*bekaari['position_radius'],
					bekaari['position_radius'],
					bekaari['position_radius']
				);
			});
		}
		else{
			bekaari['ctx'].globalAlpha = 0.2;
			bekaari['ctx'].fillStyle=dude.color;
			_.forEach(get_positions(dude.type, dude.position), function(position){
				bekaari['ctx'].fillRect(
					position[0]*bekaari['position_radius'],
					position[1]*bekaari['position_radius'],
					bekaari['position_radius'],
					bekaari['position_radius']
				);
			});
			_.forEach(get_attack_positions(dude.type, dude.position, display), function(position){
				bekaari['ctx'].fillRect(
					position[0]*bekaari['position_radius'],
					position[1]*bekaari['position_radius'],
					bekaari['position_radius'],
					bekaari['position_radius']
				);
			});			
			bekaari['ctx'].globalAlpha = 1.0;
			_.forEach(get_attack_positions(dude.type, dude.position, display), function(position){
				bekaari['ctx'].setLineDash([20,bekaari['position_radius']-40, 20, 0]);
				bekaari['ctx'].lineWidth=7;
				bekaari['ctx'].strokeStyle= dude.color;
				bekaari['ctx'].strokeRect(
					position[0]*bekaari['position_radius'],
					position[1]*bekaari['position_radius'],
					bekaari['position_radius'],
					bekaari['position_radius']
				);
				bekaari['ctx'].setLineDash([]);
			});
		}
	}
}

//qwerty
function draw_action_pattern(dude){
	if(dude){
		dude_type = dude_list[dude.type];
		if(dude_type.action_attack_patterns){
			bekaari['ctx'].strokeStyle= dude.color;
			bekaari['ctx'].setLineDash([20,bekaari['position_radius']-40, 20, 0]);
			bekaari['ctx'].lineWidth=3;
			_.forEach(dude_type.action_attack_patterns([dude.position[0], dude.position[1]]), function(position){
				var x = position[0] * bekaari['position_radius'];
				var y = position[1] * bekaari['position_radius'];
				bekaari['ctx'].strokeRect(
					x,
					y,
					bekaari['position_radius'],
					bekaari['position_radius']
				);
			});
			bekaari['ctx'].setLineDash([]);
		}
		_.forEach(get_action_positions(dude.type, dude.position), function(position){
			var x = position[0] * bekaari['position_radius'];
			var y = position[1] * bekaari['position_radius'];
			bekaari['ctx'].fillStyle = dude.color;
			bekaari['ctx'].globalAlpha = 0.2;
			bekaari['ctx'].fillRect(
				x,
				y,
				bekaari['position_radius'],
				bekaari['position_radius']
			);
			bekaari['ctx'].globalAlpha = 1.0;
			bekaari['ctx'].setLineDash([]);
			bekaari['ctx'].lineWidth=1;
			bekaari['ctx'].strokeStyle=dude.color;
			bekaari['ctx'].strokeRect(
				position[0]*bekaari['position_radius'],
				position[1]*bekaari['position_radius'],
				bekaari['position_radius'],
				bekaari['position_radius']
			)
		})
	}
}

function do_gamepad(index, buttIndex, butt){
	//on_hold
	// if(butt.pressed && bekaari['gamepads'][index].buttons[buttIndex].pressed){
		// bekaari['gamepads'][index].buttons[buttIndex].pressed_count += 1;
		// if(bekaari['gamepads'][index].buttons[buttIndex].pressed_count >= bekaari['gamepads'][index].buttons[buttIndex].hold_trigger){
			
		// }
		// bekaari['gamepads'][index].buttons[buttIndex].pressed_count
		
	// }
	
	//on_press
	if(butt.pressed && !bekaari['gamepads'][index].buttons[buttIndex].pressed){
		bekaari['gamepads'][index].buttons[buttIndex].pressed = true;
		switch(buttIndex){
			case 0://cross
				bekaari_select();
				break;
			case 1://circle
				bekaari_cancel();
				break;
			case 2://square
				bekaari['view_action'] = true;
				bekaari['gamepads'][index].skip = true;
				break;
			case 3://triangle
				next_piece();
				break;
			case 4://L1
				bekaari_shift_backward();
				break;
			case 5://R1
				bekaari_shift_forward();
				break;
			case 6://L2
				bekaari_color_shift_backward();
				break;
			case 7://R2
				bekaari_color_shift_forward();
				break;								
			case 8://share
				bekaari_restart();
				break;							
			case 9://options
				bekaari_start();
				break;							
			case 10://L3
				break;							
			case 11://R3
				break;							
			case 12://up
				if(bekaari['gamepads'][index].skip) bekaari['selected'][1] -= 3;
				else{
					bekaari['selected'][1] -= 1;
				}
				break;							
			case 13://down
				if(bekaari['gamepads'][index].skip) bekaari['selected'][1] += 3;
				else bekaari['selected'][1] += 1;
				break;
			case 14://left
				if(bekaari['gamepads'][index].skip) bekaari['selected'][0] -= 3;
				else bekaari['selected'][0] -= 1;
				break;
			case 15://right
				if(bekaari['gamepads'][index].skip) bekaari['selected'][0] += 3;
				else bekaari['selected'][0] += 1;
				break;
			case 16://playstation button
				bekaari_new();
				break;
			case 17://keypad
				next_map();
				break;								
			default:
		}		
	}	
	else if(!butt.pressed && bekaari['gamepads'][index].buttons[buttIndex].pressed){
		bekaari['gamepads'][index].buttons[buttIndex].pressed = false;
		switch(buttIndex){
			case 0://cross
				break;
			case 1://circle
				break;
			case 2://square
				bekaari['view_action'] = false;
				bekaari['gamepads'][index].skip = false;
				break;
			case 3://triangle
				break;
			case 4://L1
				break;
			case 5://R1
				break;
			case 6://L2
				break;
			case 7://R2
				break;								
			case 8://share
				break;							
			case 9://options
				break;							
			case 10://L3
				break;							
			case 11://R3
				break;							
			case 12://up
				break;							
			case 13://down
				break;
			case 14://left
				break;
			case 15://right
				break;
			case 16://playstation button
				break;
			case 17://keypad
				break;								
			default:
		}		
		
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
		draw_scenario_zones();
		switch(bekaari['game_mode']){
			case 'deployment':
				//draw deployment zones
				draw_deployment_zones();
				//draw the dude tag
				draw_dude({
					position: [bekaari['selected'][0], bekaari['selected'][1]],
					color: bekaari['deployment'].color,
					type: bekaari['deployment'].selected
				});
				
				//draw the description
				var info = '';
				info += 'game_mode: deployment<br/><br/>';
				info += "switch_dude: mouse-wheel, [ ], L1 R1<br /><br />switch_color: right-click, < >, L2 R2<br /><br />deploy_dude: left-click, space, X<br /><br />Selected:<br />"
				info += dude_list[bekaari['deployment'].selected].description;
				if(dude_list[bekaari['deployment'].selected].is_king) info += '<br/>Can only have one king.';
				
				//draw cost
				
				if(dude_list[bekaari['deployment'].selected].cost >= 0){
					info += '<br /><br />cost: ' + dude_list[bekaari['deployment'].selected].cost;
				}
				
				bekaari['infobox'].innerHTML = info;
				
				//draw patterns
				if(bekaari['view_action']){
					draw_action_pattern({
						position: [bekaari['selected'][0], bekaari['selected'][1]],
						color: bekaari['deployment'].color,
						type: bekaari['deployment'].selected
					});
				}
				else{
					draw_patterns({
						position: [bekaari['selected'][0], bekaari['selected'][1]],
						color: bekaari['deployment'].color,
						type: bekaari['deployment'].selected
					}, true, false);
				}
				break;
			case 'game_start':
				var occupant = get_occupant_selected();
				var info = '';
				switch(bekaari['game_start'].mode){
					case 'idle':
						if(occupant){
							if(!occupant.activated){
								if(bekaari['view_action']){
									draw_action_pattern(occupant);
								}
								else draw_patterns(occupant, true, false);
							}
							info += 'Selected:<br/>' + dude_list[occupant.type].description;
						}
						info += "<br/><br/>game_mode: idle<br/><br/>select:<br/>left-click, space, X<br/><br/>next_piece:<br/>n,triangle<br/><br/>cancel:<br/>k,O<br/><br/>Display action: shift, square<br/<br/>";
						break;
					case 'moving':
						if(occupant){
							if((occupant.position[0] != bekaari['game_start'].selected_position[0]) ||
								(occupant.position[1] != bekaari['game_start'].selected_position[1])){
								if(bekaari['view_action']){
									draw_action_pattern(occupant);
								}
								else draw_patterns(occupant, true, false);
								info += 'Selected:<br/>' + dude_list[occupant.type].description;
							}
						}
						draw_patterns(get_occupant_position(bekaari['game_start'].selected_position), false, true);
						info += "moving:<br/><br/>select:<br/>left-click, space, X<br/><br/>cancel:<br/>k,O<br/><br/>";
						break;
					case 'activating':
						if(occupant){
							if((occupant.position[0] != bekaari['game_start'].selected_position[0]) ||
								(occupant.position[1] != bekaari['game_start'].selected_position[1])){
								if(bekaari['view_action']){
									draw_action_pattern(occupant);
								}
								else draw_patterns(occupant, true, false);
								info += 'Selected:<br/>' + dude_list[occupant.type].description;
							}
						}
						draw_action_pattern(get_occupant_position(bekaari['game_start'].selected_position));
						info += "game_mode:activating:<br/><br/>select:<br/>left-click, space, X<br/><br/>cancel:<br/>k,O<br/><br/>";
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
			draw_dude(dude);
		});
	},17);
	intervals['bekaari_step_interval'] = setInterval(function(){
		_.forEach(bekaari['gamepads'], function(gamepad){
			var index = gamepad.gamepad_index;
			var gamepad = navigator.getGamepads()[index];
			if(gamepad){
				_.forEach(gamepad.buttons, function(butt){
					var buttIndex = gamepad.buttons.indexOf(butt);
					do_gamepad(index, buttIndex, butt)
					// if(butt.pressed) console.log(gamepad.buttons.indexOf(butt));
				});
			}
		});
	}, 50);
	intervals['bekaari_second_interval'] = setInterval(function(){
		document.getElementById('gamepad_p_bekaari').innerHTML = 'Gamepads Connected: ' + Object.keys(bekaari['gamepads']).length;
		_.forEach(navigator.getGamepads(), function(gamepad){
			if(gamepad){
				if(!gamepad.id.includes('Unknown')){
					var playa = _.filter(bekaari['gamepads'], {'gamepad_index': gamepad.index});
					if(!playa.length){
						console.log('gamepad detected');
						bekaari['gamepads'][gamepad.index] = {
							gamepad_index: gamepad.index,
							buttons: [],
							skip: false,
						};
						_.forEach([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17], function(i){
								bekaari['gamepads'][gamepad.index].buttons[i] = {
									pressed: false,
								}
						});
					}
				}
			}
		})
	}, 1000);
}

var SF_actions = {
	punch: object = {
		tag: 'punch',
		go: function(){
			console.log('punch');
		}
	},
	dash: object = {
		tag: 'dash',
		go: function(){
			console.log('dash');
		}		
	},
	kick: object = {
		tag: 'kick',
		go: function(){
			console.log('kick');
		}
	}
}

function do_SF_gamepad_setup(index, buttIndex, butt){
	//on_hold
	// if(butt.pressed && bekaari['gamepads'][index].buttons[buttIndex].pressed){
		// bekaari['gamepads'][index].buttons[buttIndex].pressed_count += 1;
		// if(bekaari['gamepads'][index].buttons[buttIndex].pressed_count >= bekaari['gamepads'][index].buttons[buttIndex].hold_trigger){
			
		// }
		// bekaari['gamepads'][index].buttons[buttIndex].pressed_count
		
	// }
	
	//on_press
	//if the button is pressed and it wasn't pressed before
	if(butt.pressed && !SF['gamepads'][index].buttons[buttIndex].pressed){
		SF['gamepads'][index].buttons[buttIndex].pressed = true;
		switch(buttIndex){
			case 0://cross
				if(!SF['gamepads'][index].ready){
					SF['gamepads'][index].ready = true;
					SF['gamepads'][index].player_index = SF['number_of_players']+0;
					SF['players'][SF['number_of_players']].ready = true;
					SF['players'][SF['number_of_players']].gamepad_index = index;
					SF['number_of_players']+=1;
				}
				break;
			case 1://circle
				break;
			case 2://square
				break;
			case 3://triangle
				break;
			case 4://L1
				break;
			case 5://R1
				break;
			case 6://L2
				break;
			case 7://R2
				break;								
			case 8://share
				break;							
			case 9://options
				break;							
			case 10://L3
				break;							
			case 11://R3
				break;							
			case 12://up
				break;							
			case 13://down
				break;
			case 14://left
				break;
			case 15://right
				break;
			case 16://playstation button
				break;
			case 17://keypad
				break;								
			default:
		}		
	}	
	else if(!butt.pressed && SF['gamepads'][index].buttons[buttIndex].pressed){
		SF['gamepads'][index].buttons[buttIndex].pressed = false;
		switch(buttIndex){
			case 0://cross
				break;
			case 1://circle
				break;
			case 2://square
				break;
			case 3://triangle
				break;
			case 4://L1
				break;
			case 5://R1
				break;
			case 6://L2
				break;
			case 7://R2
				break;								
			case 8://share
				break;							
			case 9://options
				break;							
			case 10://L3
				break;							
			case 11://R3
				break;							
			case 12://up
				break;							
			case 13://down
				break;
			case 14://left
				break;
			case 15://right
				break;
			case 16://playstation button
				break;
			case 17://keypad
				break;								
			default:
		}		
		
	}
}

function SF_Player(text_x, text_y){
	this.text_x = text_x;
	this.text_y = text_y;
	this.gamepad_index = false;
	this.ready = false;
	this.square = 'punch';
	this.triangle = 'kick';
	this.circle = 'dash';
}

function initiate_SF(){
	console.log('initiate_SF');
	
	//get the canvas element and ctx
	SF['backdrop_canvas'] = document.getElementById("SF_backdrop_canvas");
	SF['backdrop_ctx'] = SF['backdrop_canvas'].getContext("2d");
	SF['canvas'] = document.getElementById("SF_canvas");
	SF['ctx'] = SF['canvas'].getContext("2d");
	SF['ctx'].font = '40pt Calibri';
	SF['width'] = SF['canvas'].width;
	SF['height'] = SF['canvas'].height;
	SF['half_width'] = SF['canvas'].width/2;
	SF['half_height'] = SF['canvas'].height/2;
	SF['quarter_width'] = SF['canvas'].width/4;
	SF['quarter_height'] = SF['canvas'].height/4;
	SF['players'] = [];
	SF['players'].push(new SF_Player(SF['width']*.05, SF['height']*.05));
	SF['players'].push(new SF_Player(SF['width']*.55, SF['height']*.05));
	SF['players'].push(new SF_Player(SF['width']*.05, SF['height']*.55));
	SF['players'].push(new SF_Player(SF['width']*.55, SF['height']*.55));
	SF['number_of_players'] = 0;
	SF['gamepads'] = {};//timestamp as uid?
	SF['game_mode'] = 'setup';
	SF['colors'] = ['#FF0000', '#00FF00', '#00FFFF', '#FF00FF', '#000000'];
}

function stop_SF(){
	console.log('stop_SF');
	clearInterval(intervals['SF_draw_interval']);
	clearInterval(intervals['SF_step_interval']);
	clearInterval(intervals['SF_second_interval']);
}

function start_SF(){
	//should probs make a gamepad system that works for every tab rather than redo it everytime
	//but at least this way I get better at it?
	console.log('start_SF');
	intervals['SF_draw_interval'] = setInterval(function(){
		SF['ctx'].clearRect(0, 0, SF['width'], SF['height']);
		switch(SF['game_mode']){
			case 'setup':
				//draw 4 colored squares?
				SF['ctx'].globalAlpha = .2;
				SF['ctx'].fillStyle = SF['colors'][0];
				SF['ctx'].fillRect(0,0,SF['half_width'],SF['half_height']);
				SF['ctx'].fillStyle = SF['colors'][1];
				SF['ctx'].fillRect(SF['half_width'],0,SF['width'],SF['half_height']);
				SF['ctx'].fillStyle = SF['colors'][2];
				SF['ctx'].fillRect(0,SF['half_height'],SF['half_width'],SF['height']);				
				SF['ctx'].fillStyle = SF['colors'][3];
				SF['ctx'].fillRect(SF['half_width'],SF['half_height'],SF['width'], SF['height']);
				SF['ctx'].fillStyle = '#FFFFFF';
				_.forEach(SF['players'], function(player){
					if(player.ready){
						SF['ctx'].fillText('joined', player.text_x, player.text_y);
						SF['ctx'].fillText('X: jump', player.text_x, player.text_y+40);
						SF['ctx'].fillText('square: ' + SF_actions[player.square].tag, player.text_x, player.text_y+80);
						SF['ctx'].fillText('triangle: ' + SF_actions[player.triangle].tag, player.text_x, player.text_y+120);
						SF['ctx'].fillText('circle: '  + SF_actions[player.circle].tag, player.text_x, player.text_y+160);
						//gucci
					}
					else{
						SF['ctx'].fillText('Press X to join', player.text_x, player.text_y);
					}
				});
				
				break;
			case 'start':
				break;
			default:
		}
	}, 30);
	intervals['SF_step_interval'] = setInterval(function(){
		_.forEach(SF['gamepads'], function(gamepad){
			var index = gamepad.gamepad_index;
			var gamepad = navigator.getGamepads()[index];
			if(gamepad){
				_.forEach(gamepad.buttons, function(butt){
					var buttIndex = gamepad.buttons.indexOf(butt);
					do_SF_gamepad(index, buttIndex, butt);
				});
			}
		});
	}, 30);
	intervals['SF_second_interval'] = setInterval(function(){
		document.getElementById('SF_gamepad_p').innerHTML = 'Gamepads Connected: ' + Object.keys(bekaari['gamepads']).length;
		_.forEach(navigator.getGamepads(), function(gamepad){
			if(gamepad){
				if(!gamepad.id.includes('Unknown')){
					var playa = _.filter(SF['gamepads'], {'gamepad_index': gamepad.index});
					if(!playa.length){
						console.log('gamepad detected');
						SF['gamepads'][gamepad.index] = {
							gamepad_index: gamepad.index,
							buttons: [],
							skip: false,
							ready: false,
							player_index: false
						};
						_.forEach([0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17], function(i){
								SF['gamepads'][gamepad.index].buttons[i] = {
									pressed: false,
								}
						});
					}
				}
			}
		})
	}, 1000);
}

function initiate_REM(){
	console.log('initiate_REM');
	//25 - 100 reps
	//cycle through up down, left right, diagonals, figure eight, infinity
	//or choose a mode 
	REM['canvas'] = document.getElementById("REM_canvas");
	REM['ctx'] = REM['canvas'].getContext("2d");
	REM['ctx'].fillStyle = '#FF00FF';
	REM['height'] = REM['canvas'].height;
	REM['width'] = REM['canvas'].width;
	console.log(REM['height'], REM['width']);
	REM['modes'] = ['N', 'W', 'NW', 'NE', 'inf', 'rinf', '8', 'r8'];
	REM['mode_index'] = 0;
	REM['reps_list'] = [1, 5, 10, 25, 50, 75, 100];
	REM['reps'] = 1;
	REM['current_reps'] = 0;
	REM['tempo'] = 1;
	REM['v'] = new victor(REM['width']/2, REM['height']/2);
	REM['size'] = 10;
	REM['radius'] = REM['size']/2;
	REM['t'] = 0;
}

function REM_set_mode(mode){
	REM['v'].x = REM['width']/2;
	REM['v'].y = REM['height']/2;
	REM['mode_index'] = mode;
	console.log('set_mode ', mode);
}

function REM_next_mode(){
	if((REM['mode_index']+1) == REM['modes'].length){
		REM_set_mode(0);
	}
	else{
		REM_set_mode(REM['mode_index']+1);
	}
}

function stop_REM(){
	console.log('stop_REM');
	clearInterval(intervals['REM_step_interval']);
}

function start_REM(){
	console.log('start_REM');
	intervals['REM_step_interval'] = setInterval(function(){
		if((REM['t'] += .05) >= Math.PI*2){
			REM['t'] = 0; 
			if((REM['current_reps'] += 1) >= REM['reps']){
				REM_next_mode();
			}
		}
		
		// console.log(Math.sin(REM['t']));
		
		//increment position
		switch(REM['mode_index']){
			case 0:
				//up down
				REM['v'].y = (Math.sin(REM['t']) * ((REM['height']/2)-40)) + ((REM['height']/2)-40);
				break;
			case 1:
				//left right
				REM['v'].x = (Math.sin(REM['t']) * ((REM['height']/2)-40)) + (REM['width']/2);
				break;
			case 2:
				//NW
				REM['v'].y = (Math.sin(REM['t']) * ((REM['height']/2)-40)) + ((REM['height']/2)-40);
				REM['v'].x = (Math.sin(REM['t']) * ((REM['height']/2)-40)) + (REM['width']/2);
				break;
			case 3:
				//NE
				REM['v'].y = (Math.sin(REM['t']) * ((REM['height']/2)-40)) + ((REM['height']/2)-40);
				REM['v'].x = (Math.sin(REM['t']) * ((REM['height']/2)-40) * -1) + (REM['width']/2);
				break;
			case 4:
				//inf
				REM['v'].y = (Math.sin(2*REM['t']) * ((REM['height']/2)-40)) + ((REM['height']/2)-40);
				REM['v'].x = (Math.sin(REM['t']) * ((REM['width']/2)-40)) + (REM['width']/2);
				break;
			case 5:
				//reverse inf
				REM['v'].y = (Math.sin(2*REM['t']) * ((REM['height']/2)-40) * -1) + ((REM['height']/2)-40);
				REM['v'].x = (Math.sin(REM['t']) * ((REM['width']/2)-40)) + (REM['width']/2);
				break;
			case 6:
				//8
				REM['v'].y = (Math.sin(REM['t']) * ((REM['height']/2)-40)) + ((REM['height']/2)-40);
				REM['v'].x = (Math.sin(2*REM['t']) * ((REM['height']/2)-40)) + (REM['width']/2);			
				break;
			case 7:
				//r8
				REM['v'].y = (Math.sin(REM['t']) * ((REM['height']/2)-40)) + ((REM['height']/2)-40);
				REM['v'].x = (Math.sin(2*REM['t']) * ((REM['height']/2)-40) * -1) + (REM['width']/2);	
				break;
			default:
		}
		//draw
		REM['ctx'].clearRect(0, 0, REM['width'], REM['height']);
		// REM['ctx'].fillRect(REM['v'].x - REM['radius'], REM['v'].y - REM['radius'], REM['size'], REM['size']);
		REM['ctx'].beginPath();
		REM['ctx'].arc(REM['v'].x, REM['v'].y, REM['size'], Math.PI*2, false);
		REM['ctx'].fill();
	}, 30)
}

function stop_d3_stuff(){
	console.log('stop_d3_stuff');
}

function start_d3_stuff(){
	console.log('start_d3_stuff');
	var data = [30, 86, 168, 281, 303, 365];

	d3.select(".chart")
	  .selectAll("div")
	  .data(data)
		.enter()
		.append("div")
		.style("width", function(d) { return d + "px"; })
		.text(function(d) { return d; });
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