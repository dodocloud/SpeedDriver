// ===========================================================================
// Constants

var mdata = {
	road : {
		offsetX : 262,
		offsetY : 2,
		width: 169,
		height: 154
	},
	grass_left_1 : {
		offsetX : 2,
		offsetY : 134,
		width: 82,
		height: 154
	},
	grass_left_2 : {
		offsetX : 90,
		offsetY : 134,
		width: 81,
		height: 154
	},
	grass_left_3 : {
		offsetX : 2,
		offsetY : 294,
		width: 81,
		height: 154
	},
	grass_left_4 : {
		offsetX : 90,
		offsetY : 294,
		width: 81,
		height: 154
	},
	grass_right_1 : {
		offsetX : 178,
		offsetY : 162,
		width: 81,
		height: 154
	},
	grass_right_2 : {
		offsetX : 266,
		offsetY : 162,
		width: 81,
		height: 154
	},
	grass_right_3 : {
		offsetX : 178,
		offsetY : 322,
		width: 81,
		height: 154
	},
	grass_right_4 : {
		offsetX : 266,
		offsetY : 322,
		width: 81,
		height: 154
	},
	car : {
		offsetX : 352,
		offsetY : 160,
		width: 41,
		height: 67
	},
	obt_car_1 : {
		offsetX : 44,
		offsetY : 452,
		width: 35,
		height: 48
	},
	obt_car_2 : {
		offsetX : 440,
		offsetY : 176,
		width: 41,
		height: 61
	},
	obt_car_3 : {
		offsetX : 436,
		offsetY : 0,
		width: 45,
		height: 86
	},
	obt_car_4 : {
		offsetX : 436,
		offsetY : 88,
		width: 45,
		height: 86
	},
	obt_obt: {
		offsetX : 176,
		offsetY : 132,
		width: 53,
		height: 21
	}
};

class Sprite {
	constructor(offsetX, offsetY, width, height){
		this.offsetX = offsetX;
		this.offsetY = offsetY;
		this.width = width;
		this.height = height;
	}
}

const MSG_OBJECT_ADDED = 1;
const MSG_OBJECT_REMOVED = 2;

let scene = null;

class Scene {

  constructor() {
    if(scene) {
      return scene;
    }
    
	this.scene = this;
	// messages keys and all subscribers that listens to specific keys
	this.subscribers = new Map();
	// component ids and list of all message keys they listen to
	this.subscribedMessages = new Map();
	// collection of all game objects, mapped by their tag and then by their ids
	this.gameObjectTags = new Map();
	// collection of all game objects, mapped by their id
	this.gameObjects = new Map();
	
	this.objectsToRemove = new Array();
	this.componentsToRemove = new Array();
  }
  
  // sends message to all subscribers
  _sendmsg(msg) {
	if(this.subscribers.has(msg.messageKey)){
		// get all subscribed components
		let subscribedComponents = this.subscribers.get(msg.messageKey);
		for(let component of subscribedComponents){
			// send message
			component.onmessage(msg);
		}
	}
  }
  
  // subscribes given component for messaging system
  _subscribeComponent(msgKey, component){
	  var subs = this.subscribers.get(msgKey);
	  if(subs === undefined){
		  subs = new Map();
		  this.subscribers.set(msgKey, subs);
	  }
	  
	  subs.set(component.id, component);
	  
	  // save into the second collection as well
	  if(!this.subscribedMessages.has(component.id)){
		  this.subscribedMessages.set(component.id, new Array());
	  }
	  
	  this.subscribedMessages.get(component.id).push(msgKey);
  }
  
  // adds a new game object into scene
  addGameObject(obj) {
	  // initialize all components
	  for(let component of obj.components) {
		  component.owner = obj;
		  component.scene = this;
		  component.oninit();
	  }
	  
	  if(!this.gameObjectTags.hasTag(obj.tag)) {
		  this.gameObjectTags.set(obj.tag, new Map());
	  }
	  
	  // add game object into the collection
	  this.gameObjectTags.get(obj.tag).set(obj.id, obj);
	  this.gameObjects.set(obj.id, obj);
	  
	  this._sendmsg(new Msg(MSG_OBJECT_ADDED, null, obj));
  }
  
  removeGameObject(obj){
	  // will be removed at the end of the update loop
	  this.objectsToRemove.push(obj);
  }
  
  findAllObjectsByTag(tag){
		let result = new Array();
		if(this.gameObjectTags.has(tag)){
			for(let gameObject of this.gameObjectTags.get(tag)){
				result.push(gameObject);
			}
		}
		return result;
  }
  
  _removeGameObjectImmediately(obj){
	  for(let component of obj.components){
		  this._removeComponentImmediately(component);
	  }
	  
	  this.gameObjectTags.get(obj.tag).delete(obj.id);
	  this.gameObjects.delete(obj.id);
	  this._sendmsg(new Msg(MSG_OBJECT_REMOVED, null, obj));
  }
  
  // removes all game objects;
  _removePendingGameObjects() {
	for(let obj of objectsToRemove){
		this._removeGameObjectImmediately(obj);
	}
	
	this.objectsToRemove.clear();
  }
  
  _removeComponent(component){
	  this.componentsToRemove.push(obj);
  }
  
  _removeComponentImmediately(component){
	  let allMsgKeys = this.subscribedMessages.get(component.id);
	  this.subscribedMessages.delete(component.id);
	  
	  for(let msgKey of allMsgKeys){
		  this.subscribers.get(msgKey).delete(component.id);
	  }
  }
  
  _removePendingComponents(){
	  for(let component of componentsToRemove){
		this._removeComponentImmediately(component);
	  }
	  this.componentsToRemove.clear();
	  
  }
  
  update(delta, absolute){
	  for(gameObject of this.gameObjects){
		  gameObject.update(delta, absolute);
	  }
	  
	  this._removePendingComponents();
	  this._removePendingGameObjects();
  }
}

scene = new Scene();

class GameObject {
	
	constructor(tag) {
		this.id = GameObject.idCounter++;
		this.tag = tag;
		this.components = new Array();
		this.sprite = null;
	}
	
	update(delta, absolute){
		for(let component of components){
			component.update(delta, absolute);
		}
	}
	
	addComponent(component){
		this.components.push(component);
		scene._addGameObject(this);
	}
	
	removeComponent(component){
		for(var i=0; i<components.length; i++){
			if(components[i] == component){
				this.components.splice(i, 1);
				return true;
			}
		}
		return false;
	}
	
	update(delta, absolute){
		for(component of this.components){
			component.update(delta, absolute);
		}
	}
}
GameObject.idCounter = 0;

class Msg {
	constructor(messageKey, component, gameObject, data){
		this.messageKey = messageId;
		this.component = component;
		this.gameObject = gameObject;
		this.data = data;
	}
}

class Component {
	
	constructor() {
		this.id = Component.idCounter++;
		this.owner = null;
		this.scene = null;
	}
	
	_subscribe(messageKey){
		this.scene._subscribe(messageKey, this);
	}
	
	_sendmsg(messageKey, data){
		this.scene._sendmsg(new Msg(messageKey, this, this.owner, data));
	}
	
	oninit(){
		
	}
	
	onmessage(msg){
		// will be overridden
	}
	
	update(delta, absolute){
		// will be overridden
	}
}
Component.idCounter = 0;



var imagesToLoad = ["speeddriver.png"];
var loadedImages = [];

function loadImages(){
	promises = [];
	for(var i=0; i<imagesToLoad.length; i++){
		let path = imagesToLoad[i];
		promises.push(loadImage("images/"+path).then((prom) => {
			loadedImages[path] = prom;
			return true;
		}));
	}
	return Promise.all(promises);
}

function getAtlas(){
	return loadedImages[imagesToLoad[0]];
}

var forestMode = false;

function getLeftGrass(offset){
	if(offset % 200 == 0) return mdata.grass_left_4;
	if(offset % 100 == 0) return mdata.grass_left_3;
	
	if(offset % 3 == 0) return mdata.grass_left_2;
	return mdata.grass_left_1;
}

function getRightGrass(offset){
	if(offset % 200 == 0) return mdata.grass_right_4;
	if(offset % 100 == 0) return mdata.grass_right_3;
	
	if(offset % 3 == 0) return mdata.grass_right_2;
	return mdata.grass_right_1;
}

// ===========================================================================
// GraphicsCommon
function drawBitmapCenteredWithRotation(useBitmap, atX,atY, withAng) {
	canvasContext.save();
	canvasContext.translate(atX, atY);
	canvasContext.rotate(withAng);
	canvasContext.drawImage(useBitmap, -useBitmap.width/2, -useBitmap.height/2);
	canvasContext.restore();
}



// ===========================================================================
// Main

var canvas;
var cw, ch, cx, fps = 30, interval = 1000/fps,
lastTime = (new Date()).getTime(), currentTime = 0, delta = 0;
var gameTime = 0;

window.onload = function() {
	
	canvas = document.getElementById('gameCanvas');
	cw = canvas.width,
    ch = canvas.height,
	
	canvas.addEventListener("touchstart", handleStart, false);
	canvas.addEventListener("touchend", handleEnd, false);
	canvas.addEventListener("mousedown", handleStart, false);
	canvas.addEventListener("mouseup", handleEnd, false);
	
	currentCarLocationX =  mdata.grass_left_1.width + mdata.road.width / 3 * 1;
	
	cx = canvas.getContext('2d');
	
	currentTime = (new Date()).getTime();
	gameTime = (new Date()).getTime() - currentTime;

	loadImages().then(gameLoop);
}

var lastTouch = null;

function handleStart(evt) {
	evt.preventDefault();
    if(typeof(evt.changedTouches) !== "undefined" && evt.changedTouches.length == 1){
		// only single-touch
		lastTouch = evt.changedTouches[0];
	} else{
		lastTouch = evt;
	}
}

function handleEnd(evt) {
	evt.preventDefault();
	var posX, posY;
	
	if(typeof(evt.changedTouches) !== "undefined" && evt.changedTouches.length == 1){
		posX = evt.changedTouches[0].pageX;
		posY = evt.changedTouches[1].pageY;
	  
	} else {
	  // mouse
		posX = evt.pageX;
		posY = evt.pageY;
	}
  
  	if(Math.abs(lastTouch.pageX - posX) < 10 && 
	 Math.abs(lastTouch.pageY - posY) <10){
		handleTouch(posX, posY);
	}
}

function handleTouch(posX, posY){
	if(posX < currentCarLocationX && currentCarLane > 0){
		currentCarState = CAR_STATE_STEERING_LEFT;
	}
	
	if(posX > (currentCarLocationX + mdata.car.width) && currentCarLane < 2){
		currentCarState = CAR_STATE_STEERING_RIGHT;
	}
}

function drawSprite(sprite, posX, posY, width, height){
	cx.drawImage(getAtlas(), sprite.offsetX, sprite.offsetY, 
	sprite.width, sprite.height, posX, posY, sprite.width, sprite.height);
	
}

var currentPosition = 0;
var currentSpeed = 10;

function drawRoad() {
	var posX = mdata.grass_left_1.width;
	var spriteHeight = mdata.road.height;
	var canvasHeight = ch;
	var mults = Math.round(canvasHeight / spriteHeight) + 1;
	var currentBlock = Math.floor(currentPosition / spriteHeight) + mults;
	
	var position = Math.min(spriteHeight,spriteHeight - currentPosition % spriteHeight);
	var posY = 0;
	for(var i=0; i<mults; i++){
		var sprite = mdata.road;
		if(sprite.height-position <= 0){
			position = 0;
			continue;
		}
		// draw road
		cx.drawImage(getAtlas(), sprite.offsetX, sprite.offsetY+position,
		sprite.width, sprite.height-position, posX, posY, sprite.width, sprite.height-position);
		
		// draw left grass
		var leftGrass = getLeftGrass(currentBlock-i);
		cx.drawImage(getAtlas(), leftGrass.offsetX, leftGrass.offsetY+position,
		leftGrass.width, leftGrass.height-position, 0, posY, leftGrass.width, leftGrass.height-position);
		
		// draw right grass
		var rightGrass = getRightGrass(currentBlock-i);
		cx.drawImage(getAtlas(), rightGrass.offsetX, rightGrass.offsetY+position,
		rightGrass.width, rightGrass.height-position, posX+mdata.road.width, posY, rightGrass.width, rightGrass.height-position);
		
		posY+=(sprite.height - position);
		position = 0;
	}
}

function drawCar() {
	var posX = currentCarLocationX;
	var posY = ch - 1.5 * mdata.car.height;
	cx.drawImage(getAtlas(), mdata.car.offsetX, mdata.car.offsetY,
		mdata.car.width, mdata.car.height, posX, posY, mdata.car.width, mdata.car.height);
}

class Obstacle {
    constructor(sprite, lane, speed, position) {
        this.sprite = sprite;
        this.lane = lane;
		this.speed = speed;
		this.position = position;
    }
}

var obstacles = [];


function drawObstacles(){
	var lane = mdata.grass_left_1.width;
	
	for(var i=0; i<obstacles.length; i++){
		var obst = obstacles[i];
		var lanePos = lane + obst.lane * mdata.road.width / 3;
		var sprite = obst.sprite;
		
		cx.drawImage(getAtlas(), sprite.offsetX, sprite.offsetY,
		sprite.width, sprite.height, lanePos, currentPosition - obst.position, sprite.width, sprite.height);
		
		obst.position += obst.speed;
		
		if((currentPosition - obst.position) > 1000){
			// delete obstacle
			obstacles.splice(i, 1);
		}
	}
}

function createObstacle(){
	var globalSpeed = currentSpeed;
	
	if(Math.random() <= 0.1){
		var rnd = Math.floor(Math.random() * 5);
		var sprite = null;
		var lane = Math.floor(Math.random() * 3);
		var speed = 0;
		
		if(rnd == 0){
			sprite = mdata.obt_car_1;
			speed = globalSpeed / 4 + Math.random() * globalSpeed * 0.5;
		}
		if(rnd == 1){
			sprite = mdata.obt_car_2;
			speed = globalSpeed / 4 + Math.random() * globalSpeed * 0.5;
		}
		if(rnd == 2){
			sprite = mdata.obt_car_3;
			speed = globalSpeed / 8 + Math.random() * globalSpeed * 0.5;
		}
		if(rnd == 3){
			sprite = mdata.obt_car_4;
			speed = globalSpeed / 8 + Math.random() * globalSpeed * 0.5;
		}
		if(rnd == 4){
			sprite = mdata.obt_obt;
		}
		position = currentPosition + 200;
		obstacles.push(new Obstacle(sprite, lane, speed, position));
	}
}

var CAR_STATE_NONE = 0;
var CAR_STATE_STEERING_LEFT = 1;
var CAR_STATE_STEERING_RIGHT = 2;
var currentCarState = CAR_STATE_NONE;
var currentCarLane = 1;
var currentCarLocationX = 0;

// t = current time
// b = start value
// c = change in value
// d = duration
var easeInOutSine = function (t, b, c, d) {
	return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
};

var steeringTime = 0;
function steerCar(absolute){
	if(currentCarState != CAR_STATE_NONE && steeringTime == 0){
		console.log(absolute);
		steeringTime = absolute;
	}
	
	if(currentCarState == CAR_STATE_STEERING_LEFT){
		var carLocationX =  mdata.grass_left_1.width + mdata.road.width / 3 * currentCarLane;
		var desiredLocationX = mdata.grass_left_1.width + mdata.road.width / 3 * (currentCarLane - 1);
		
		var progress = Math.min(1, (absolute - steeringTime) / (500));
		currentCarLocationX = carLocationX + (desiredLocationX - carLocationX) * progress;

		if(progress >= 1){
			currentCarState = CAR_STATE_NONE;
			currentCarLane--;
			steeringTime = 0;
		}
	}
	
	if(currentCarState == CAR_STATE_STEERING_RIGHT){
		var carLocationX =  mdata.grass_left_1.width + mdata.road.width / 3 * currentCarLane;
		var desiredLocationX = mdata.grass_left_1.width + mdata.road.width / 3 * (currentCarLane + 1);
		
		var progress = Math.min(1, (absolute - steeringTime) / (500));
		
		currentCarLocationX = carLocationX + (desiredLocationX - carLocationX) * progress;
		
		if(progress >= 1){
			currentCarState = CAR_STATE_NONE;
			currentCarLane++;
			steeringTime = 0;
		}
	}
}

function gameLoop() {
    window.requestAnimationFrame(gameLoop);

    currentTime = (new Date()).getTime();
    delta = (currentTime-lastTime);
	gameTime += delta;
	
    if(delta > interval) {
        cx.clearRect(0,0,cw,ch);
		update(delta, gameTime);
        lastTime = currentTime - (delta % interval);
    }
}

function update(delta, absolute){
	//drawSprite(mdata.road, 0, 0);
	currentPosition+=currentSpeed;
	drawRoad();
	drawCar();
	drawObstacles();
	createObstacle();
	steerCar(absolute);
}