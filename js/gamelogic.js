/*
 * Overall game logic
 *
 */

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
const MSG_CAR_COLLIDED = 105;
const MSG_GAME_OVER = 106;
const MSG_IMMUNE_MODE_STARTED = 107;
const MSG_IMMUNE_MODE_ENDED = 108;
const MAXIMUM_SPEED = 50;
const MAXIMUM_FREQUENCY = 50;

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

	getLife() {
		return this.sprites.life;
	}

	getCarDestroyed() {
		return this.sprites.car_destroyed;
	}

	getBarCover() {
		return this.sprites.bar_cover;
	}

	getBarFill() {
		return this.sprites.bar_fill;
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

	getCenterOfRoad(laneIndex) {
		if (laneIndex == 0) {
			return this.getCenterOfRoad(1) - (this.sprites.road.width - (2 * 10)) / 3;
		}

		if (laneIndex == 1) {
			return this.sprites.road.width / 2;
		}

		if (laneIndex == 2) {
			return this.getCenterOfRoad(1) + (this.sprites.road.width - (2 * 10)) / 3;
		}
	}

}

class ObstacleMap {
	constructor() {
		this.count = 0;
		this.obstacles = new Map();
		this.laneCounter = new Map();
	}

	getObstacles() {
		return this.obstacles;
	}

	addObstacle(gameObject) {
		this.obstacles.set(gameObject.id, gameObject);
		let lane = gameObject.getAttribute(ATTR_LANE);
		if (this.laneCounter.has(lane)) {
			this.laneCounter[lane]++;
		} else {
			this.laneCounter[lane] = 1;
		}

		this.count++;
	}

	removeObstacle(gameObject) {
		let lane = gameObject.getAttribute(ATTR_LANE);
		this.laneCounter.set(lane, this.laneCounter.get(lane) - 1);
		this.obstacles.delete (gameObject.id);
		this.count--;
	}

	isPlaceFreeForObstacle(topPos, bottomPos, lane, tolerance = 20) {

		for (let[key, val]of this.obstacles) {
			if (val.getAttribute(ATTR_LANE) != lane) {
				continue;
			}

			let obstacleTopPos = val.posY;
			let obstacleBottomPos = val.posY - val.sprite.height;
			let intersection = -Math.max(obstacleBottomPos - 20, bottomPos) + Math.min(obstacleTopPos + 20, topPos);

			if (intersection >= tolerance) {
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

	isLaneSafeForNewObstacle(lane) {
		let fullLanesNum = 0;
		for (let[key, val]of this.laneCounter) {
			if (key != lane && val > 0) {
				fullLanesNum++;
			}
		}

		return fullLanesNum < 2;
	}
}

class GameModel {
	constructor() {
		this.cameraPosition = 0;
		this.cameraSpeed = 0;
		this.lives = 3;
		this.score = 0;
		this.immuneMode = false;
		this.currentMaxSpeed = MAXIMUM_SPEED / 10;
		this.trafficFrequency = 10;
	}
}

class LivesComponent extends Component {
	oninit() {
		this.spriteMgr = this.scene.getGlobalAttribute(ATTR_SPRITE_MGR);
		this.model = this.scene.getGlobalAttribute(ATTR_GAME_MODEL);
	}

	draw(ctx) {
		let lives = this.model.lives;
		let sprite = this.owner.sprite;

		for (let i = 0; i < lives; i++) {
			ctx.drawImage(this.spriteMgr.atlas, sprite.offsetX, sprite.offsetY,
				sprite.width, sprite.height, 10 + (sprite.width) * i, 20,
				sprite.width, sprite.height);
		}
	}
}

class ScoreDisplayComponent extends Component {
	oninit() {
		this.model = this.scene.getGlobalAttribute(ATTR_GAME_MODEL);
	}

	draw(ctx) {
		let score = Math.floor(this.model.score);
		score = (1e15 + score + "").slice(-4); // hack for leading zeros
		let posX = 20;
		let posY = 100;

		ctx.fillStyle = "rgba(255, 255, 255)";
		ctx.textAlign = 'left';
		ctx.fillText(score + " m", posX, posY);
	}
}

class AnimTextDisplayComponent extends Component {
	constructor(text, duration) {
		super();
		this.text = text;
		this.duration = duration;
		this.opacity = 0;
	}

	oninit() {
		this.startTime = 0;
	}

	draw(ctx) {
		ctx.fillStyle = "rgba(255, 255, 255, " + this.opacity + ")";
		ctx.textAlign = 'center';
		ctx.fillText(this.text, this.owner.posX, this.owner.posY);
	}

	update(delta, absolute) {
		if (this.startTime == 0) {
			this.startTime = absolute;
		}

		let progress = (absolute - this.startTime) / this.duration;

		// opacity goes from 0 to 1 and back to 0
		if (progress > 0.5) {
			this.opacity = (1 - progress) * 2;
		} else {
			this.opacity = (progress) * 2;
		}

		if ((absolute - this.startTime) > this.duration) {
			this.owner.removeComponent(this);
			this.sendmsg(MSG_ANIM_ENDED);
		}
	}

}

class SpeedbarComponent extends Component {
	oninit() {
		this.spriteMgr = this.scene.getGlobalAttribute(ATTR_SPRITE_MGR);
		this.car = this.scene.findAllObjectsByTag("car")[0];
	}

	draw(ctx) {
		let barCover = this.spriteMgr.getBarCover();
		let barFill = this.spriteMgr.getBarFill();

		let carSpeed = this.car.getAttribute(ATTR_SPEED);
		let speedRatio = carSpeed / MAXIMUM_SPEED;
		let shift = barFill.height * (1 - speedRatio);

		// draw the filled bar first
		ctx.drawImage(this.spriteMgr.atlas, barFill.offsetX, barFill.offsetY + shift,
			barFill.width, barFill.height - shift, this.owner.posX + 2, this.owner.posY + 2 + shift,
			barFill.width, barFill.height - shift);

		ctx.drawImage(this.spriteMgr.atlas, barCover.offsetX, barCover.offsetY,
			barCover.width, barCover.height, this.owner.posX, this.owner.posY,
			barCover.width, barCover.height);
	}
}

class RoadComponent extends Component {

	oninit() {
		this.gameModel = this.scene.getGlobalAttribute(ATTR_GAME_MODEL);
		this.spriteMgr = this.scene.getGlobalAttribute(ATTR_SPRITE_MGR);
	}

	getLeftGrass(offset) {
		if (noise.simplex2(1, offset) >= 0)
			return this.spriteMgr.getLeftBgr(3);
		if (offset % 20 == 0)
			return this.spriteMgr.getLeftBgr(2);

		if (offset % 3 == 0)
			return this.spriteMgr.getLeftBgr(1);
		return this.spriteMgr.getLeftBgr(0);
	}

	getRightGrass(offset) {
		if (noise.simplex2(200, offset) >= 0)
			return this.spriteMgr.getRightBgr(3);
		if (offset % 20 == 0)
			return this.spriteMgr.getRightBgr(2);

		if (offset % 3 == 0)
			return this.spriteMgr.getRightBgr(1);
		return this.spriteMgr.getRightBgr(0);
	}

	draw(ctx) {
		let cameraPosition = this.gameModel.cameraPosition;

		var posX = this.spriteMgr.getBgrWidth();
		var spriteHeight = this.spriteMgr.getRoad().height;
		var canvasHeight = this.scene.context.canvasHeight;
		var mults = Math.round(canvasHeight / spriteHeight) + 1;
		var currentBlock = Math.floor(cameraPosition / spriteHeight) + mults;

		var position = Math.min(spriteHeight, spriteHeight - cameraPosition % spriteHeight);
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

class MovingObstacleComponent extends Component {

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

				let criticalDistance = 200; // if closer than 200 units, decelerate!
				let desiredDistance = 20; // stop 20 units in front of the obstacle

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

			// fix velocity based on the current acceleration value
			this.owner.addAttribute(ATTR_SPEED, Math.max(0, currentSpeed - this.currentDeceleration * delta * 0.01));
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

		let cameraPosition = this.gameModel.cameraPosition;
		let obstacles = this.obstacleMap.getObstacles();

		for (let[key, val]of obstacles) {
			if ((cameraPosition - val.posY) > 1000) {
				// delete obstacle -> objects are removed when the update
				// is finished, so there is no need to worry about removal during this iteration loop
				this.scene.removeGameObject(val);
			}
		}

		let currentFrequency = this.gameModel.trafficFrequency / MAXIMUM_FREQUENCY;

		if (!this.gameModel.immuneMode && (noise.simplex2(1, this.gameModel.cameraPosition)+0.5) > (1 - currentFrequency)) {
			var obstacleIndex = Math.floor(Math.random() * 7);
			var sprite = null;
			var lane = Math.floor(Math.random() * 3);

			if (this.obstacleMap.isLaneSafeForNewObstacle(lane)) {
				var speed = 0;
				let isMoving = true;
				let currentMaxSpeed = this.gameModel.currentMaxSpeed;

				if (obstacleIndex == 0) {
					sprite = this.spriteMgr.getObstacle("car", 0);
					speed = currentMaxSpeed / 4 + Math.random() * currentMaxSpeed * 3.5;
				}
				if (obstacleIndex == 1) {
					sprite = this.spriteMgr.getObstacle("car", 1);
					speed = currentMaxSpeed / 4 + Math.random() * currentMaxSpeed * 3.5;
				}
				if (obstacleIndex == 2) {
					sprite = this.spriteMgr.getObstacle("car", 2);
					speed = currentMaxSpeed / 4 + Math.random() * currentMaxSpeed * 3.5;
				}
				if (obstacleIndex == 3) {
					sprite = this.spriteMgr.getObstacle("truck", 0);
					speed = currentMaxSpeed / 4 + Math.random() * currentMaxSpeed * 3;
				}
				if (obstacleIndex == 4) {
					sprite = this.spriteMgr.getObstacle("truck", 1);
					speed = currentMaxSpeed / 4 + Math.random() * currentMaxSpeed * 3;
				}
				if (obstacleIndex == 5) {
					isMoving = false;
					sprite = this.spriteMgr.getObstacle("static");
				}
				if (obstacleIndex == 6) {
					isMoving = false;
					sprite = this.spriteMgr.getObstacle("static", 1);
				}

				let posX = this.spriteMgr.getBgrWidth() + this.spriteMgr.getCenterOfRoad(lane) - sprite.width / 2;
				let posY = this.gameModel.cameraPosition + 200;

				if (this.obstacleMap.isPlaceFreeForObstacle(posY, posY - sprite.height, lane)) {
					let newObj = new GameObject("obstacle");
					newObj.sprite = sprite;
					newObj.posX = posX;
					newObj.posY = posY;
					newObj.zIndex = 1;
					newObj.addAttribute(ATTR_LANE, lane);
					newObj.addAttribute(ATTR_SPEED, speed);
					if (isMoving) {
						newObj.addComponent(new MovingObstacleComponent());
					}
					newObj.addComponent(new RoadObjectRenderer());
					this.scene.addGameObject(newObj);
					this.obstacleMap.addObstacle(newObj);
				}
			}
		}
	}
}

// renderer for all dynamic objects
class RoadObjectRenderer extends Component {
	oninit() {
		this.spriteMgr = this.scene.getGlobalAttribute(ATTR_SPRITE_MGR);
		this.gameModel = this.scene.getGlobalAttribute(ATTR_GAME_MODEL);
	}

	draw(ctx) {
		if (this.owner.sprite != null) {
			let cameraPosition = this.gameModel.cameraPosition;

			ctx.drawImage(this.spriteMgr.atlas, this.owner.sprite.offsetX, this.owner.sprite.offsetY,
				this.owner.sprite.width, this.owner.sprite.height, this.owner.posX,
				cameraPosition - this.owner.posY, this.owner.sprite.width, this.owner.sprite.height);
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
			// flicker
			this.lastFlicker = absolute;
			this.owner.visible = !this.owner.visible;
		}

		if ((absolute - this.startTime) > this.duration) {
			// finish
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
		this.steeringDuration = 500;
		this.steeringState = STEERING_NONE;
		this.spriteMgr = this.scene.getGlobalAttribute(ATTR_SPRITE_MGR);
		this.gameModel = this.scene.getGlobalAttribute(ATTR_GAME_MODEL);
		this.subscribe(MSG_IMMUNE_MODE_STARTED);
		this.subscribe(MSG_IMMUNE_MODE_ENDED);
		this.owner.addAttribute(ATTR_SPEED, this.gameModel.currentMaxSpeed);
		this.desiredVelocity = this.gameModel.currentMaxSpeed;
	}

	onmessage(msg) {
		if (msg.action == MSG_IMMUNE_MODE_STARTED) {
			this.owner.addComponent(new FlickerAnimation(4000));
			this.decelerate(this.gameModel.currentMaxSpeed / 2);
		}

		if (msg.action == MSG_IMMUNE_MODE_ENDED) {
			this.accelerate(this.gameModel.currentMaxSpeed);
		}
	}

	accelerate(desiredVelocity) {
		this.desiredVelocity = desiredVelocity;
	}

	decelerate(desiredVelocity) {
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

		this.gameModel.currentMaxSpeed += delta * 0.0001;

		// if the maximum speed has increased enough, accelerate to the next velocity level
		if (this.gameModel.currentMaxSpeed > speed * 1.1 && this.desiredVelocity == speed) {
			this.accelerate(this.gameModel.currentMaxSpeed);
		}

		if (this.desiredVelocity != speed) {
			// if the desired velocity differs, we need to either accelerate or decelerate
			// in order to change the current velocity
			if (this.desiredVelocity > speed) {
				speed = Math.min(this.desiredVelocity, speed + 1 * delta * 0.003);
			} else {
				speed = Math.max(this.desiredVelocity, speed + -1 * delta * 0.003);
			}

			this.owner.addAttribute(ATTR_SPEED, speed);
		}

		// increment position
		this.owner.posY += Math.floor(speed * delta * 0.01);

		let currentCarLane = this.owner.getAttribute(ATTR_LANE);

		if (this.steeringState != STEERING_NONE && this.steeringTime == 0) {
			this.steeringTime = absolute;
		}

		let road = this.spriteMgr.getRoad();
		let bgrWidth = this.spriteMgr.getBgrWidth();

		if (this.steeringState == STEERING_LEFT || this.steeringState == STEERING_RIGHT) {

			// handle the steering behavior
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
		this.gameModel = this.scene.getGlobalAttribute(ATTR_GAME_MODEL);
		this.owner.addComponent(new AnimTextDisplayComponent("Prepare", 5000));
		this.car = this.scene.findAllObjectsByTag("car")[0];
		this.subscribe(MSG_CAR_COLLIDED);
	}

	onmessage(msg) {
		if (msg.action == MSG_CAR_COLLIDED) {
			return;
			this.gameModel.lives--;
			if (this.gameModel.lives == 0) {

				let gameOverComp = new AnimTextDisplayComponent("Game Over", 5000);
				this.owner.addComponent(gameOverComp);
				this.sendmsg(MSG_GAME_OVER);
				this.postponedAnimationId = gameOverComp.id;
				this.scene.addPendingInvocation(4000, () => {
					this.scene.clearScene();
					initGame();
				});
			} else {
				this.gameModel.immuneMode = true;
				this.sendmsg(MSG_IMMUNE_MODE_STARTED);
				this.scene.addPendingInvocation(4000, () => {
					this.gameModel.immuneMode = false;
					this.sendmsg(MSG_IMMUNE_MODE_ENDED);
				});
			}
		}

	}

	update(delta, absolute) {
		this.gameModel.trafficFrequency = Math.min(MAXIMUM_FREQUENCY, this.gameModel.trafficFrequency * delta * 0.001);
		this.gameModel.score += this.car.getAttribute(ATTR_SPEED) * delta * 0.001;
		// by default, speed of the camera will be the same as the speed of the car
		// however, we can animate the camera independently. That's why there are two attributes
		this.gameModel.cameraSpeed = this.car.getAttribute(ATTR_SPEED);
		this.gameModel.cameraPosition += Math.floor(this.gameModel.cameraSpeed * delta * 0.01);
	}
}

class CarCollisionChecker extends Component {

	oninit() {
		this.gameModel = this.scene.getGlobalAttribute(ATTR_GAME_MODEL);
		this.obstacleMap = this.scene.getGlobalAttribute(ATTR_OBSTACLE_MAP);

	}

	update(delta, absolute) {
		if (!this.gameModel.immuneMode) {
			// check for collisions
			let collided = this.obstacleMap.findCollidedObstacle(this.owner);
			if (collided != null) {
				// handle collision
				this.sendmsg(MSG_CAR_COLLIDED);
			}
		}
	}
}
