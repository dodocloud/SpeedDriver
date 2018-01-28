
const STEERING_NONE = 0;
const STEERING_LEFT = 1;
const STEERING_RIGHT = 2;
const ATTR_GAME_MODEL = 100;
const ATTR_SPRITE_MGR = 102;
const ATTR_LANE = 103;
const ATTR_SPEED = 104;
const ATTR_OBSTACLE_MAP = 105;

const MSG_TOUCH = 103;
const MSG_ANIM_ENDED = 104;

let scene = null;

class SpriteManager {
	constructor(sprites, atlas) {
		this.sprites = sprites;
		this.atlas = atlas;
	}

	getBgrWidth() {
		return this.sprites.bgr_left[0].width;
	}

	getLeftBgr(index) {
		return this.sprites.bgr_left[index];
	}

	getRightBgr(index) {
		return this.sprites.bgr_right[index];
	}

	getRoad() {
		return this.sprites.road;
	}

	getCar() {
		return this.sprites.car;
	}

	getCarDestroyed() {
		return this.sprites.car_destroyed;
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

	getCenterOfRoad(laneIndex) {
		if (laneIndex == 0) {
			return this.getCenterOfRoad(1) - this.getRoadLaneWidth();
		}

		if (laneIndex == 1) {
			return this.sprites.road.width / 2;
		}

		if (laneIndex == 2) {
			return this.getCenterOfRoad(1) + this.getRoadLaneWidth();
		}
	}

}

class ObstacleMap {
	constructor() {
		this.count = 0;
		this.obstacles = new Map();
	}

	addObstacle(gameObject) {
		this.obstacles.set(gameObject.id, gameObject);
		this.count++;
	}

	removeObstacle(gameObject) {
		this.obstacles.delete (gameObject.id);
		this.count--;
	}

	isPlaceFreeForObstacle(topPos, bottomPos, lane) {

		for (let[key, val]of this.obstacles) {
			if (val.getAttribute(ATTR_LANE) != lane) {
				continue;
			}

			let obstacleTopPos = val.posY;
			let obstacleBottomPos = val.posY - val.sprite.height;
			let intersection = -Math.max(obstacleBottomPos - 20, bottomPos) + Math.min(obstacleTopPos + 20, topPos);

			if (intersection >= 0) {
				return false;
			}
		}

		return true;
	}

	findCollidedObstacle(gameObject) {
		for (let[key, val]of this.obstacles) {
			if (gameObject.intersects(val)) {
				return val;
			}
		}
		return null;
	}

	getNearestObstacle(gameObject, sameLane = true) {
		let lane = gameObject.getAttribute(ATTR_LANE);
		let nearest = null;
		let nearestDistance = 0;

		for (let[key, val]of this.obstacles) {
			if (sameLane && val.getAttribute(ATTR_LANE) != lane) {
				continue;
			}

			let distance = (val.posY - val.sprite.height) - gameObject.posY;
			if (distance > 0) {
				if (nearest == null || distance < nearestDistance) {
					nearest = val;
					nearestDistance = distance;
				}
			}
		}
		return nearest;
	}
}

class GameModel {
	constructor() {
		this.currentPosition = 0;
		this.currentSpeed = 30;
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

	getLeftGrass(offset) {
		if (offset % 200 == 0)
			return this.spriteMgr.getLeftBgr(3);
		if (offset % 100 == 0)
			return this.spriteMgr.getLeftBgr(2);

		if (offset % 3 == 0)
			return this.spriteMgr.getLeftBgr(1);
		return this.spriteMgr.getLeftBgr(0);
	}

	getRightGrass(offset) {
		if (offset % 200 == 0)
			return this.spriteMgr.getRightBgr(3);
		if (offset % 100 == 0)
			return this.spriteMgr.getRightBgr(2);

		if (offset % 3 == 0)
			return this.spriteMgr.getRightBgr(1);
		return this.spriteMgr.getRightBgr(0);
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
			var leftGrass = this.getLeftGrass(currentBlock - i);
			ctx.drawImage(this.spriteMgr.atlas, leftGrass.offsetX, leftGrass.offsetY + position,
				leftGrass.width, leftGrass.height - position, 0, posY, leftGrass.width, leftGrass.height - position);

			// draw right grass
			var rightGrass = this.getRightGrass(currentBlock - i);
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
		this.obstacleMap = this.scene.getGlobalAttribute(ATTR_OBSTACLE_MAP);
		this.currentDeceleration = 0;
	}

	update(delta, absolute) {
		let currentSpeed = this.owner.getAttribute(ATTR_SPEED);
		this.owner.posY += currentSpeed * delta * 0.01;

		if (currentSpeed != 0) {
			let nearest = this.obstacleMap.getNearestObstacle(this.owner, true);

			if (nearest != null) {
				let distance = (nearest.posY - nearest.sprite.height) - this.owner.posY;

				let criticalDistance = 200;
				let desiredDistance = 20;

				if (distance < criticalDistance) {

					// we have to get to the same velocity
					let desiredSpeed = nearest.getAttribute(ATTR_SPEED);

					if (desiredSpeed < currentSpeed) {
						// calculate deceleration in order to be on the same speed cca 20 pixels behind the obstacle
						// a = v^2 / 2s
						this.currentDeceleration = Math.max(0, (currentSpeed - desiredSpeed)
								 * (currentSpeed - desiredSpeed) / (2 * Math.max(1, distance - desiredDistance)));
					}
				}
			}

			this.owner.addAttribute(ATTR_SPEED, Math.max(0, currentSpeed - this.currentDeceleration * delta * 0.01));
		}
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
		this.obstacleMap = this.scene.getGlobalAttribute(ATTR_OBSTACLE_MAP);
		this.subscribe(MSG_OBJECT_REMOVED);
	}

	onmessage(msg) {
		if (msg.action == MSG_OBJECT_REMOVED) {
			this.obstacleMap.removeObstacle(msg.gameObject);
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

			if (this.obstacleMap.isPlaceFreeForObstacle(posY, posY - sprite.height, lane)) {
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
				this.obstacleMap.addObstacle(newObj);
			}

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

class FlickerAnimation extends Component {

	constructor(duration) {
		super();
		this.duration = duration;
	}

	oninit() {
		this.frequency = 10;
		this.lastFlicker = 0;
		this.startTime = 0;
	}

	update(delta, absolute) {
		if (this.lastFlicker == 0) {
			this.lastFlicker = absolute;
		}

		if (this.startTime == 0) {
			this.startTime = absolute;
		}

		if ((absolute - this.lastFlicker) > (1000 / this.frequency)) {
			this.lastFlicker = absolute;
			this.owner.visible = !this.owner.visible;
		}

		if ((absolute - this.startTime) > this.duration) {
			this.owner.visible = true;
			this.sendmsg(MSG_ANIM_ENDED);
			this.owner.removeComponent(this);
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
		this.obstacleMap = this.scene.getGlobalAttribute(ATTR_OBSTACLE_MAP);
		this.immuneMode = false;
		this.desiredVelocity = 0;
		this.subscribe(MSG_ANIM_ENDED);
	}

	onmessage(msg) {
		if (msg.action == MSG_ANIM_ENDED && msg.gameObject.id == this.owner.id) {
			this.immuneMode = false;
			this.accelerate(15);
		}
	}
	
	accelerate(desiredVelocity){
		this.desiredVelocity = desiredVelocity;
	}
	
	decelerate(desiredVelocity){
		this.desiredVelocity = desiredVelocity;
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
		let speed = this.owner.getAttribute(ATTR_SPEED);
		
		if(this.desiredVelocity == 0){
			this.desiredVelocity = speed;
		}else if(this.desiredVelocity != speed) {
			if(this.desiredVelocity > speed){
				speed = Math.min(this.desiredVelocity, speed + 1 * delta * 0.01);
			}else{
				speed = Math.max(this.desiredVelocity, speed + -1 * delta * 0.01);
			}
			
			this.owner.addAttribute(ATTR_SPEED, speed);
		}
		
		this.owner.posY += Math.floor(speed * delta * 0.01);

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

		if (!this.immuneMode) {
			let collided = this.obstacleMap.findCollidedObstacle(this.owner);

			if (collided != null) {
				// handle collision
				this.owner.addComponent(new FlickerAnimation(4000));
				this.immuneMode = true;
				this.decelerate(5);
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
		super.onmessage(msg);
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
		if(this.car === undefined){
			this.car = this.scene.findAllObjectsByTag("car")[0];
		}
		
		this.model.currentSpeed = this.car.getAttribute(ATTR_SPEED);
		this.model.currentPosition += Math.floor(this.model.currentSpeed * delta * 0.01);
	}
}
