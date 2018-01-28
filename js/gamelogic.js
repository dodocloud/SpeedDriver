
const STEERING_NONE = 0;
const STEERING_LEFT = 1;
const STEERING_RIGHT = 2;
const ATTR_GAME_MODEL = 100;
const ATTR_SPRITE_MGR = 102;
const ATTR_LANE = 103;
const ATTR_SPEED = 104;

const MSG_TOUCH = 103;

let scene = null;

class SpriteManager {
	constructor(sprites, atlas) {
		this.sprites = sprites;
		this.atlas = atlas;
	}

	getBgrWidth() {
		return this.sprites.bgr_left[0].width;
	}

	getLeftGrass(offset) {
		if (offset % 200 == 0)
			return this.sprites.bgr_left[3];
		if (offset % 100 == 0)
			return this.sprites.bgr_left[2];

		if (offset % 3 == 0)
			return this.sprites.bgr_left[1];
		return this.sprites.bgr_left[0];
	}

	getRightGrass(offset) {
		if (offset % 200 == 0)
			return this.sprites.bgr_right[3];
		if (offset % 100 == 0)
			return this.sprites.bgr_right[2];

		if (offset % 3 == 0)
			return this.sprites.bgr_right[1];
		return this.sprites.bgr_right[0];
	}

	getRoad() {
		return this.sprites.road;
	}

	getCar() {
		return this.sprites.car;
	}

	getObstacle(type, index = 0) {
		let counter = 0;

		for (let obstacle of this.sprites.obstacles) {
			if (obstacle.type == type && counter++ == index) {
				return obstacle;
			}
		}

		return null;
	}

	getRoadLaneWidth() {
		return (this.sprites.road.width - (2 * 10)) / 3;
	}

	getCenterOfRoad(lineIndex) {
		if (lineIndex == 0) {
			return this.getCenterOfRoad(1) - this.getRoadLaneWidth();
		}

		if (lineIndex == 1) {
			return this.sprites.road.width / 2;
		}

		if (lineIndex == 2) {
			return this.getCenterOfRoad(1) + this.getRoadLaneWidth();
		}
	}

}

class GameModel {
	constructor() {
		this.currentPosition = 0;
		this.currentSpeed = 10;
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



class RoadComponent extends Component {

	oninit() {
		this.gameModel = this.scene.getGlobalAttribute(ATTR_GAME_MODEL);
		this.spriteMgr = this.scene.getGlobalAttribute(ATTR_SPRITE_MGR);
	}

	draw(ctx) {
		let currentPosition = this.gameModel.currentPosition;

		var posX = this.spriteMgr.getBgrWidth();
		var spriteHeight = this.spriteMgr.getRoad().height;
		var canvasHeight = this.scene.context.canvasHeight;
		var mults = Math.round(canvasHeight / spriteHeight) + 1;
		var currentBlock = Math.floor(currentPosition / spriteHeight) + mults;

		var position = Math.min(spriteHeight, spriteHeight - currentPosition % spriteHeight);
		var posY = 0;
		for (var i = 0; i < mults; i++) {
			var sprite = this.spriteMgr.getRoad();
			if (sprite.height - position <= 0) {
				position = 0;
				continue;
			}
			// draw road
			ctx.drawImage(this.spriteMgr.atlas, sprite.offsetX, sprite.offsetY + position,
				sprite.width, sprite.height - position, posX, posY, sprite.width, sprite.height - position);

			// draw left grass
			var leftGrass = this.spriteMgr.getLeftGrass(currentBlock - i);
			ctx.drawImage(this.spriteMgr.atlas, leftGrass.offsetX, leftGrass.offsetY + position,
				leftGrass.width, leftGrass.height - position, 0, posY, leftGrass.width, leftGrass.height - position);

			// draw right grass
			var rightGrass = this.spriteMgr.getRightGrass(currentBlock - i);
			ctx.drawImage(this.spriteMgr.atlas, rightGrass.offsetX, rightGrass.offsetY + position,
				rightGrass.width, rightGrass.height - position, posX + this.spriteMgr.getRoad().width, posY, rightGrass.width, rightGrass.height - position);

			posY += (sprite.height - position);
			position = 0;
		}
	}
}


class ObstacleComponent extends Component {
	
	oninit() {
		this.spriteMgr = this.scene.getGlobalAttribute(ATTR_SPRITE_MGR);
		this.gameModel = this.scene.getGlobalAttribute(ATTR_GAME_MODEL);
	}

	update(delta, absolute) {
		this.owner.posY += this.owner.getAttribute(ATTR_SPEED);
		let currentPosition = this.gameModel.currentPosition;

		if ((currentPosition - this.owner.posY) > 1000) {
			// delete obstacle
			this.scene.removeGameObject(this.owner);
		}
	}
}

class ObstacleManager extends Component {

	oninit() {
		this.gameModel = this.scene.getGlobalAttribute(ATTR_GAME_MODEL);
		this.spriteMgr = this.scene.getGlobalAttribute(ATTR_SPRITE_MGR);
		this.subscribe(MSG_OBJECT_REMOVED);
		this.obstacles = new Map();
	}

	onmessage(msg) {
		if (msg.action == MSG_OBJECT_REMOVED) {
			this.obstacles.delete (msg.gameObject.id);
		}
	}

	update(delta, absolute) {
		var globalSpeed = this.gameModel.currentSpeed;

		if (Math.random() <= 0.1) {
			var rnd = Math.floor(Math.random() * 6);
			var sprite = null;
			var lane = Math.floor(Math.random() * 3);
			var speed = 0;

			if (rnd == 0) {
				sprite = this.spriteMgr.getObstacle("car", 0);
				speed = globalSpeed / 4 + Math.random() * globalSpeed * 0.5;
			}
			if (rnd == 1) {
				sprite = this.spriteMgr.getObstacle("car", 1);
				speed = globalSpeed / 4 + Math.random() * globalSpeed * 0.5;
			}
			if (rnd == 2) {
				sprite = this.spriteMgr.getObstacle("truck", 0);
				speed = globalSpeed / 8 + Math.random() * globalSpeed * 0.5;
			}
			if (rnd == 3) {
				sprite = this.spriteMgr.getObstacle("truck", 1);
				speed = globalSpeed / 8 + Math.random() * globalSpeed * 0.5;
			}
			if (rnd == 4) {
				sprite = this.spriteMgr.getObstacle("static");
			}
			if (rnd == 5) {
				sprite = this.spriteMgr.getObstacle("static", 1);
			}
			let posX = this.spriteMgr.getBgrWidth() + this.spriteMgr.getCenterOfRoad(lane) - sprite.width / 2;
			let posY = this.gameModel.currentPosition + 200;

			let newObj = new GameObject("obstacle");
			newObj.sprite = sprite;
			newObj.posX = posX;
			newObj.posY = posY;
			newObj.zIndex = 1;
			newObj.addAttribute(ATTR_LANE, lane);
			newObj.addAttribute(ATTR_SPEED, speed);
			newObj.addComponent(new ObstacleComponent());
			newObj.addComponent(new RoadObjectRenderer());
			this.scene.addGameObject(newObj);
			this.obstacles.set(newObj.id, newObj);
		}
	}
}

class RoadObjectRenderer extends Component {
	oninit() {
		this.spriteMgr = this.scene.getGlobalAttribute(ATTR_SPRITE_MGR);
		this.gameModel = this.scene.getGlobalAttribute(ATTR_GAME_MODEL);
	}

	draw(ctx) {
		if (this.owner.sprite != null) {
			let currentPosition = this.gameModel.currentPosition;

			ctx.drawImage(this.spriteMgr.atlas, this.owner.sprite.offsetX, this.owner.sprite.offsetY,
				this.owner.sprite.width, this.owner.sprite.height, this.owner.posX, currentPosition - this.owner.posY, this.owner.sprite.width, this.owner.sprite.height);
		}
	}
}

class CarController extends Component {
	oninit() {
		this.steeringTime = 0;
		this.steeringSourcePosX = 0;
		this.steeringDuration = 1000;
		this.steeringState = STEERING_NONE;
		this.spriteMgr = this.scene.getGlobalAttribute(ATTR_SPRITE_MGR);
		this.gameModel = this.scene.getGlobalAttribute(ATTR_GAME_MODEL);
	}

	steerLeft() {
		this.steeringState = STEERING_LEFT;
		this.steeringTime = 0;
		this.steeringSourcePosX = this.owner.posX;
		let currentCarLane = this.owner.getAttribute(ATTR_LANE);
		this.owner.addAttribute(ATTR_LANE, currentCarLane - 1);
	}

	steerRight() {
		this.steeringState = STEERING_RIGHT;
		this.steeringTime = 0;
		this.steeringSourcePosX = this.owner.posX;
		let currentCarLane = this.owner.getAttribute(ATTR_LANE);
		this.owner.addAttribute(ATTR_LANE, currentCarLane + 1);
	}

	update(delta, absolute) {

		this.owner.posY += this.owner.getAttribute(ATTR_SPEED);

		let currentCarLane = this.owner.getAttribute(ATTR_LANE);

		if (this.steeringState != STEERING_NONE && this.steeringTime == 0) {
			this.steeringTime = absolute;
		}

		let road = this.spriteMgr.getRoad();
		let bgrWidth = this.spriteMgr.getBgrWidth();

		if (this.steeringState == STEERING_LEFT || this.steeringState == STEERING_RIGHT) {

			let increment = this.steeringState == STEERING_LEFT ? -1 : 1;
			var desiredLocationX = bgrWidth + this.spriteMgr.getCenterOfRoad(currentCarLane) - this.spriteMgr.getCar().width / 2;

			var progress = Math.min(1, (absolute - this.steeringTime) / (this.steeringDuration));
			// change car location
			this.owner.posX = this.steeringSourcePosX + (desiredLocationX - this.steeringSourcePosX) * progress;

			if (progress >= 1) {
				this.steeringState = STEERING_NONE;
				this.steeringTime = 0;
			}
		}
	}
}

class CarTouchController extends CarController {
	oninit() {
		super.oninit();
		this.subscribe(MSG_TOUCH);
	}

	onmessage(msg) {
		if (msg.action == MSG_TOUCH) {
			let posX = msg.data[0];
			let posY = msg.data[1];

			let currentCarLane = this.owner.getAttribute(ATTR_LANE);
			if (posX < this.owner.posX && currentCarLane > 0) {
				this.steerLeft();
			}

			if (posX > (this.owner.posX + this.spriteMgr.getCar().width) && currentCarLane < 2) {
				this.steerRight();
			}
		}
	}
}

class GameManager extends Component {

	oninit() {
		this.model = this.scene.getGlobalAttribute(ATTR_GAME_MODEL);
	}

	update(delta, absolute) {
		this.model.currentPosition += this.model.currentSpeed;
	}
}
