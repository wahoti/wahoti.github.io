//browserify main.js -o bundle.js
//node server.js
var victor = require('victor');
var _ = require('lodash');
var domready = require("domready");
var shortid = require('shortid');

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
			console.log('freeze collide')
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
			console.log('SWORD GO', coord);
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
								console.log(distance, this.phase_speed, this.phase_time);
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
								console.log(distance, this.phase_speed, this.phase_time);
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
	console.log('hit');
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

function Position(x, y){
	this.x = x;
	this.y = y;
	this.occupant = '';//this will the string of the id of the occupant
}

function Dude(){
	
}

function initiate_bekaari(){
	//get the canvas element and ctx
	bekaari['grid_canvas'] = document.getElementById("bekaari_grid_canvas");
	bekaari['grid_ctx'] = bekaari['grid_canvas'].getContext("2d");
	bekaari['canvas'] = document.getElementById("bekaari_canvas");
	bekaari['ctx'] = bekaari['canvas'].getContext("2d");

	//calculate the width and height of field based on canvas size and desired size of position
	bekaari['field'] = [];
	bekaari['position_radius'] = 100;
	bekaari['width'] = bekaari['canvas'].width / bekaari['position_radius'];
	bekaari['height'] = bekaari['canvas'].height / bekaari['position_radius'];
	
	//initialize the field matrix
	for(var x = 0; x<bekaari['width']; x++) {
		bekaari['field'][x] = [];
		for(var y = 0; y<bekaari['height']; y++){
			bekaari['field'][x][y] = new Position(x, y);
		}
	}

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
	
	bekaari['ctx'].fillStyle="#ffffff";
	bekaari['ctx'].fillRect(0,0,95,95);
	//controller stuff?
	//key press?
	//first do draw;
}

function stop_bekaari(){
	console.log('stop_bekaari');
	clearInterval(intervals['bekaari_draw_interval']);
	clearInterval(intervals['bekaari_step_interval']);
}

function start_bekaari(){
	console.log('start_bekaari');
	intervals['bekaari_draw_interval'] = setInterval(function(){
	},17);
	intervals['bekaari_step_interval'] = setInterval(function(){}, 17);
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
		// console.log(navigator.getGamepads());
		// console.log(players);
		document.getElementById('gamepad_p').innerHTML = 'Gamepads Connected: ' + Object.keys(players).length;
		_.forEach(navigator.getGamepads(), function(gamepad){
			if(gamepad){
				if(!gamepad.id.includes('Unknown')){
					//var assigned = _.every(players, {'gamepad_index': gamepad.index})
					var playa = _.filter(players, {'gamepad_index': gamepad.index});
					//console.log(playa, !playa.length);
					if(!playa.length){
						console.log('assigning gamepad to player');
						var id = create_player(shortid.generate());
						things[id].gamepad_index = gamepad.index;
					}
				
				
				
					// console.log(gamepad.index, gamepad.id);
					// _.forEach(gamepad.buttons, function(button){
						// if(button.pressed){
							// console.log('\t', button.pressed);
						// }
					// });
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