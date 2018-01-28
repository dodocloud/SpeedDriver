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
const ATTR_CAR_STATE = 101;
const ATTR_LANE = 102;
const MSG_TOUCH = 103;

class GameModel {
	constructor(atlas, sprites) {
		this.atlas = atlas;
		this.sprites = sprites;
		this.currentPosition = 0;
		this.currentSpeed = 10;
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



class RoadComponent extends Component {

	oninit() {
		let root = this.scene.findAllObjectsByTag("root")[0];
		this.gameModel = root.getAttribute(ATTR_GAME_MODEL);
	}

	draw(ctx) {
		let currentPosition = this.gameModel.currentPosition;
		
		var posX = this.gameModel.sprites.grass_left_1.width;
		var spriteHeight = this.gameModel.sprites.road.height;
		var canvasHeight = this.owner.scene.context.canvasHeight;
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

class Obstacle {
	constructor(sprite, lane, speed, position) {
		this.sprite = sprite;
		this.lane = lane;
		this.speed = speed;
		this.position = position;
	}
}

class ObstacleManager extends Component {

	oninit() {
		this.obstacles = [];
		let root = this.scene.findAllObjectsByTag("root")[0];
		this.gameModel = root.getAttribute(ATTR_GAME_MODEL);
	}

	draw(ctx) {
		var lane = mdata.grass_left_1.width;
		let currentPosition = this.gameModel.currentPosition;
		
		for (var i = 0; i < this.obstacles.length; i++) {
			var obst = this.obstacles[i];
			var lanePos = lane + obst.lane * mdata.road.width / 3;
			var sprite = obst.sprite;

			ctx.drawImage(getAtlas(), sprite.offsetX, sprite.offsetY,
				sprite.width, sprite.height, lanePos, currentPosition - obst.position, sprite.width, sprite.height);

			obst.position += obst.speed;

			if ((currentPosition - obst.position) > 1000) {
				// delete obstacle
				this.obstacles.splice(i, 1);
			}
		}
	}

	update(delta, absolute) {
		var globalSpeed = this.gameModel.currentSpeed;

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
			let position = this.gameModel.currentPosition + 200;
			this.obstacles.push(new Obstacle(sprite, lane, speed, position));
		}
	}

}

class CarController extends Component {
	oninit() {
		this.steeringTime = 0;
		this.subscribe(MSG_TOUCH);
	}

	onmessage(msg) {
		if (msg.action == MSG_TOUCH) {
			let posX = msg.data[0];
			let posY = msg.data[1];

			let currentCarLane = this.owner.getAttribute(ATTR_LANE);
			if (posX < this.owner.posX && currentCarLane > 0) {
				this.owner.addAttribute(ATTR_CAR_STATE, CAR_STATE_STEERING_LEFT);
			}

			if (posX > (this.owner.posX + mdata.car.width) && currentCarLane < 2) {
				this.owner.addAttribute(ATTR_CAR_STATE, CAR_STATE_STEERING_RIGHT);
			}
		}
	}

	update(delta, absolute) {
		let currentCarState = this.owner.getAttribute(ATTR_CAR_STATE);
		let currentCarLane = this.owner.getAttribute(ATTR_LANE);
		if (currentCarState != CAR_STATE_NONE && this.steeringTime == 0) {
			this.steeringTime = absolute;
		}

		if (currentCarState == CAR_STATE_STEERING_LEFT || currentCarState == CAR_STATE_STEERING_RIGHT) {
			let increment = currentCarState == CAR_STATE_STEERING_LEFT ? -1 : 1;
			var carLocationX = mdata.grass_left_1.width + mdata.road.width / 3 * currentCarLane;
			var desiredLocationX = mdata.grass_left_1.width + mdata.road.width / 3 * (currentCarLane + increment);

			var progress = Math.min(1, (absolute - this.steeringTime) / (500));
			// change car location
			this.owner.posX = carLocationX + (desiredLocationX - carLocationX) * progress;

			if (progress >= 1) {
				this.owner.addAttribute(ATTR_CAR_STATE, CAR_STATE_NONE);
				this.owner.addAttribute(ATTR_LANE, currentCarLane + increment);
				this.steeringTime = 0;
			}
		}
	}

}

class GameManager extends Component {
	update(delta, absolute){
		let model = this.owner.getAttribute(ATTR_GAME_MODEL);
		model.currentPosition += model.currentSpeed;
	}
}

