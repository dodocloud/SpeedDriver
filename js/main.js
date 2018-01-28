// ===========================================================================
// Constants

var mdata = {
	road: {
		offsetX: 262,
		offsetY: 2,
		width: 169,
		height: 154
	},
	grass_left_1: {
		offsetX: 2,
		offsetY: 134,
		width: 82,
		height: 154
	},
	grass_left_2: {
		offsetX: 90,
		offsetY: 134,
		width: 81,
		height: 154
	},
	grass_left_3: {
		offsetX: 2,
		offsetY: 294,
		width: 81,
		height: 154
	},
	grass_left_4: {
		offsetX: 90,
		offsetY: 294,
		width: 81,
		height: 154
	},
	grass_right_1: {
		offsetX: 178,
		offsetY: 162,
		width: 81,
		height: 154
	},
	grass_right_2: {
		offsetX: 266,
		offsetY: 162,
		width: 81,
		height: 154
	},
	grass_right_3: {
		offsetX: 178,
		offsetY: 322,
		width: 81,
		height: 154
	},
	grass_right_4: {
		offsetX: 266,
		offsetY: 322,
		width: 81,
		height: 154
	},
	car: {
		offsetX: 352,
		offsetY: 160,
		width: 41,
		height: 67
	},
	obt_car_1: {
		offsetX: 44,
		offsetY: 452,
		width: 35,
		height: 48
	},
	obt_car_2: {
		offsetX: 440,
		offsetY: 176,
		width: 41,
		height: 61
	},
	obt_car_3: {
		offsetX: 436,
		offsetY: 0,
		width: 45,
		height: 86
	},
	obt_car_4: {
		offsetX: 436,
		offsetY: 88,
		width: 45,
		height: 86
	},
	obt_obt: {
		offsetX: 176,
		offsetY: 132,
		width: 53,
		height: 21
	}
};

const CAR_STATE_NONE = 0;
const CAR_STATE_STEERING_LEFT = 1;
const CAR_STATE_STEERING_RIGHT = 2;
const ATTR_GAME_MODEL = 100;

class GameModel {
	constructor(atlas, sprites) {
		this.atlas = atlas;
		this.sprites = sprites;
	}

	getLeftGrass(offset) {
		if (offset % 200 == 0)
			return this.sprites.grass_left_4;
		if (offset % 100 == 0)
			return this.sprites.grass_left_3;

		if (offset % 3 == 0)
			return this.sprites.grass_left_2;
		return this.sprites.grass_left_1;
	}

	getRightGrass(offset) {
		if (offset % 200 == 0)
			return this.sprites.grass_right_4;
		if (offset % 100 == 0)
			return this.sprites.grass_right_3;

		if (offset % 3 == 0)
			return this.sprites.grass_right_2;
		return this.sprites.grass_right_1;
	}
}

let scene = null;

var imagesToLoad = ["speeddriver.png"];
var loadedImages = [];

function loadImages() {
	promises = [];
	for (var i = 0; i < imagesToLoad.length; i++) {
		let path = imagesToLoad[i];
		promises.push(loadImage("images/" + path).then((prom) => {
				loadedImages[path] = prom;
				return true;
			}));
	}
	return Promise.all(promises);
}

function getAtlas() {
	return loadedImages[imagesToLoad[0]];
}



// ===========================================================================
// Main

var canvas;
var cw, ch, cx, fps = 30, interval = 1000 / fps,
lastTime = (new Date()).getTime(), currentTime = 0, delta = 0;
var gameTime = 0;

window.onload = function () {

	canvas = document.getElementById('gameCanvas');
	let context = new Context(canvas);
	scene = new Scene(context);

	cw = canvas.width,
	ch = canvas.height,

	currentCarLocationX = mdata.grass_left_1.width + mdata.road.width / 3 * 1;

	cx = canvas.getContext('2d');

	currentTime = (new Date()).getTime();
	gameTime = (new Date()).getTime() - currentTime;

	loadImages().then(initGame).then(gameLoop);
}

class InputManager extends Component {

	oninit() {
		this.lastTouch = null;

		let context = this.scene.context;
		let canvas = context.canvas;
		canvas.addEventListener("touchstart", this.handleStart, false);
		canvas.addEventListener("touchend", this.handleEnd, false);
		canvas.addEventListener("mousedown", this.handleStart, false);
		canvas.addEventListener("mouseup", this.handleEnd, false);
	}

	handleStart(evt) {
		evt.preventDefault();
		if (typeof(evt.changedTouches) !== "undefined" && evt.changedTouches.length == 1) {
			// only single-touch
			this.lastTouch = evt.changedTouches[0];
		} else {
			this.lastTouch = evt;
		}
	}

	handleEnd(evt) {
		evt.preventDefault();
		var posX,
		posY;

		if (typeof(evt.changedTouches) !== "undefined" && evt.changedTouches.length == 1) {
			posX = evt.changedTouches[0].pageX;
			posY = evt.changedTouches[1].pageY;

		} else {
			// mouse
			posX = evt.pageX;
			posY = evt.pageY;
		}

		if (Math.abs(this.lastTouch.pageX - posX) < 10 &&
			Math.abs(this.lastTouch.pageY - posY) < 10) {
			handleTouch(posX, posY);
		}
	}

}

function handleTouch(posX, posY) {
	if (posX < currentCarLocationX && currentCarLane > 0) {
		currentCarState = CAR_STATE_STEERING_LEFT;
	}

	if (posX > (currentCarLocationX + mdata.car.width) && currentCarLane < 2) {
		currentCarState = CAR_STATE_STEERING_RIGHT;
	}
}

var currentPosition = 0;
var currentSpeed = 10;

class RoadComponent extends Component {

	oninit(canvas) {
		let root = this.scene.findAllObjectsByTag("root")[0];
		this.gameModel = root.getAttribute(ATTR_GAME_MODEL);
	}

	draw(ctx) {
		var posX = this.gameModel.sprites.grass_left_1.width;
		var spriteHeight = this.gameModel.sprites.road.height;
		var canvasHeight = ch;
		var mults = Math.round(canvasHeight / spriteHeight) + 1;
		var currentBlock = Math.floor(currentPosition / spriteHeight) + mults;

		var position = Math.min(spriteHeight, spriteHeight - currentPosition % spriteHeight);
		var posY = 0;
		for (var i = 0; i < mults; i++) {
			var sprite = this.gameModel.sprites.road;
			if (sprite.height - position <= 0) {
				position = 0;
				continue;
			}
			// draw road
			ctx.drawImage(getAtlas(), sprite.offsetX, sprite.offsetY + position,
				sprite.width, sprite.height - position, posX, posY, sprite.width, sprite.height - position);

			// draw left grass
			var leftGrass = this.gameModel.getLeftGrass(currentBlock - i);
			ctx.drawImage(getAtlas(), leftGrass.offsetX, leftGrass.offsetY + position,
				leftGrass.width, leftGrass.height - position, 0, posY, leftGrass.width, leftGrass.height - position);

			// draw right grass
			var rightGrass = this.gameModel.getRightGrass(currentBlock - i);
			ctx.drawImage(getAtlas(), rightGrass.offsetX, rightGrass.offsetY + position,
				rightGrass.width, rightGrass.height - position, posX + mdata.road.width, posY, rightGrass.width, rightGrass.height - position);

			posY += (sprite.height - position);
			position = 0;
		}
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

function drawObstacles() {
	var lane = mdata.grass_left_1.width;

	for (var i = 0; i < obstacles.length; i++) {
		var obst = obstacles[i];
		var lanePos = lane + obst.lane * mdata.road.width / 3;
		var sprite = obst.sprite;

		cx.drawImage(getAtlas(), sprite.offsetX, sprite.offsetY,
			sprite.width, sprite.height, lanePos, currentPosition - obst.position, sprite.width, sprite.height);

		obst.position += obst.speed;

		if ((currentPosition - obst.position) > 1000) {
			// delete obstacle
			obstacles.splice(i, 1);
		}
	}
}

function createObstacle() {
	var globalSpeed = currentSpeed;

	if (Math.random() <= 0.1) {
		var rnd = Math.floor(Math.random() * 5);
		var sprite = null;
		var lane = Math.floor(Math.random() * 3);
		var speed = 0;

		if (rnd == 0) {
			sprite = mdata.obt_car_1;
			speed = globalSpeed / 4 + Math.random() * globalSpeed * 0.5;
		}
		if (rnd == 1) {
			sprite = mdata.obt_car_2;
			speed = globalSpeed / 4 + Math.random() * globalSpeed * 0.5;
		}
		if (rnd == 2) {
			sprite = mdata.obt_car_3;
			speed = globalSpeed / 8 + Math.random() * globalSpeed * 0.5;
		}
		if (rnd == 3) {
			sprite = mdata.obt_car_4;
			speed = globalSpeed / 8 + Math.random() * globalSpeed * 0.5;
		}
		if (rnd == 4) {
			sprite = mdata.obt_obt;
		}
		position = currentPosition + 200;
		obstacles.push(new Obstacle(sprite, lane, speed, position));
	}
}

var currentCarState = CAR_STATE_NONE;
var currentCarLane = 1;
var currentCarLocationX = 0;

// t = current time
// b = start value
// c = change in value
// d = duration
var easeInOutSine = function (t, b, c, d) {
	return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
};

var steeringTime = 0;
function steerCar(absolute) {
	if (currentCarState != CAR_STATE_NONE && steeringTime == 0) {
		console.log(absolute);
		steeringTime = absolute;
	}

	if (currentCarState == CAR_STATE_STEERING_LEFT) {
		var carLocationX = mdata.grass_left_1.width + mdata.road.width / 3 * currentCarLane;
		var desiredLocationX = mdata.grass_left_1.width + mdata.road.width / 3 * (currentCarLane - 1);

		var progress = Math.min(1, (absolute - steeringTime) / (500));
		currentCarLocationX = carLocationX + (desiredLocationX - carLocationX) * progress;

		if (progress >= 1) {
			currentCarState = CAR_STATE_NONE;
			currentCarLane--;
			steeringTime = 0;
		}
	}

	if (currentCarState == CAR_STATE_STEERING_RIGHT) {
		var carLocationX = mdata.grass_left_1.width + mdata.road.width / 3 * currentCarLane;
		var desiredLocationX = mdata.grass_left_1.width + mdata.road.width / 3 * (currentCarLane + 1);

		var progress = Math.min(1, (absolute - steeringTime) / (500));

		currentCarLocationX = carLocationX + (desiredLocationX - carLocationX) * progress;

		if (progress >= 1) {
			currentCarState = CAR_STATE_NONE;
			currentCarLane++;
			steeringTime = 0;
		}
	}
}

function initGame() {
	let model = new GameModel(getAtlas(), this.mdata);
	let root = new GameObject("root");
	root.addAttribute(ATTR_GAME_MODEL, model);
	root.addComponent(new InputManager());
	scene.addGameObject(root);

	let road = new GameObject("road");
	road.addComponent(new RoadComponent());
	scene.addGameObject(road);

	return true;
}
function gameLoop() {
	window.requestAnimationFrame(gameLoop);

	currentTime = (new Date()).getTime();
	delta = (currentTime - lastTime);
	gameTime += delta;

	if (delta > interval) {
		cx.clearRect(0, 0, cw, ch);
		scene._update(delta, gameTime);
		update(delta, gameTime);
		lastTime = currentTime - (delta % interval);
	}

}

function update(delta, absolute) {
	currentPosition += currentSpeed;
	scene._draw(cx);
	drawCar();
	drawObstacles();
	createObstacle();
	steerCar(absolute);
}
