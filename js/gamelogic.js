
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
}

class GameModel {
	constructor() {
		this.cameraPosition = 0;
		this.cameraSpeed = 0;
		this.lives = 3;
		this.score = 0;
		this.immuneMode = false;
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

const MAXIMUM_SPEED = 50;

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
				sprite.width, sprite.height, 10+(sprite.width) * i, 20,
				sprite.width, sprite.height);
		}
	}
}

class ScoreDisplayComponent extends Component {
	oninit(){
		this.model = this.scene.getGlobalAttribute(ATTR_GAME_MODEL);
	}
	
	draw(ctx) {
		let score = Math.floor(this.model.score);
		score = (1e15+score+"").slice(-4); // hack for leading zeros
		let posX = 20;
		let posY = 100;
		
		ctx.fillStyle = "rgba(255, 255, 255)";
		ctx.textAlign = 'left';
		ctx.fillText(score + " m", posX, posY);
	}
}

class AnimTextDisplayComponent extends Component {
	constructor(text, duration){
		super();
		this.text = text;
		this.duration = duration;
		this.opacity = 0;
	}
	
	oninit(){
		this.startTime = 0;
	}
	
	draw(ctx){
		ctx.fillStyle = "rgba(255, 255, 255, "+this.opacity+")";
		ctx.textAlign = 'center';
		ctx.fillText  (this.text, this.owner.posX, this.owner.posY);
	}

	update(delta, absolute) {
		if (this.startTime == 0) {
			this.startTime = absolute;
		}
		
		let progress = (absolute - this.startTime)/this.duration;
		
		// opacity goes from 0 to 1 and back to 0
		if(progress > 0.5){
			this.opacity = (1-progress)*2;
		}else{
			this.opacity = (progress)*2;
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
		if (noise.simplex2(1,offset) >= 0)
			return this.spriteMgr.getLeftBgr(3);
		if (offset % 20 == 0)
			return this.spriteMgr.getLeftBgr(2);

		if (offset % 3 == 0)
			return this.spriteMgr.getLeftBgr(1);
		return this.spriteMgr.getLeftBgr(0);
	}

	getRightGrass(offset) {
		if (noise.simplex2(200,offset) >= 0)
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

				let criticalDistance = 200;	// if closer than 200 units, decelerate!
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
		let cameraPosition = this.gameModel.cameraPosition;

		if ((cameraPosition - this.owner.posY) > 1000) {
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
		if (!this.gameModel.immuneMode && noise.simplex2(1,this.gameModel.cameraPosition) > 0.5) {
			var rnd = Math.floor(Math.random() * 6);
			var sprite = null;
			var lane = Math.floor(Math.random() * 3);

			var speed = 0;

			if (rnd == 0) {
				sprite = this.spriteMgr.getObstacle("car", 0);
				speed = MAXIMUM_SPEED / 4 + Math.random() * MAXIMUM_SPEED * 0.5;
			}
			if (rnd == 1) {
				sprite = this.spriteMgr.getObstacle("car", 1);
				speed = MAXIMUM_SPEED / 4 + Math.random() * MAXIMUM_SPEED * 0.5;
			}
			if (rnd == 2) {
				sprite = this.spriteMgr.getObstacle("truck", 0);
				speed = MAXIMUM_SPEED / 8 + Math.random() * MAXIMUM_SPEED * 0.5;
			}
			if (rnd == 3) {
				sprite = this.spriteMgr.getObstacle("truck", 1);
				speed = MAXIMUM_SPEED / 8 + Math.random() * MAXIMUM_SPEED * 0.5;
			}
			if (rnd == 4) {
				sprite = this.spriteMgr.getObstacle("static");
			}
			if (rnd == 5) {
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
				newObj.addComponent(new ObstacleComponent());
				newObj.addComponent(new RoadObjectRenderer());
				this.scene.addGameObject(newObj);
				this.obstacleMap.addObstacle(newObj);
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
		this.obstacleMap = this.scene.getGlobalAttribute(ATTR_OBSTACLE_MAP);
		this.desiredVelocity = 0;
		this.subscribe(MSG_ANIM_ENDED);
		this.currentMaxSpeed = 10;
		this.owner.addAttribute(ATTR_SPEED, this.currentMaxSpeed);
	}

	onmessage(msg) {
		if (msg.action == MSG_ANIM_ENDED && msg.gameObject.id == this.owner.id) {
			this.gameModel.immuneMode = false;
			this.accelerate(this.currentMaxSpeed);
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

		this.currentMaxSpeed += delta * 0.0001;
		
		// if the maximum speed has increased enough, accelerate to the next velocity level
		if(this.currentMaxSpeed > speed*1.1 && this.desiredVelocity == speed){
			this.accelerate(this.currentMaxSpeed);
		}
		
		if (this.desiredVelocity == 0) {
			this.desiredVelocity = speed;
		} else if (this.desiredVelocity != speed) {
			// if the desired velocity differs, we need to either accelerate or decelerate 
			// in order to change the current velocity
			if (this.desiredVelocity > speed) {
				speed = Math.min(this.desiredVelocity, speed + 1 * delta * 0.01);
			} else {
				speed = Math.max(this.desiredVelocity, speed + -1 * delta * 0.01);
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

		if (!this.gameModel.immuneMode) {
			// check for collisions
			let collided = this.obstacleMap.findCollidedObstacle(this.owner);

			if (collided != null) {
				// handle collision
				this.owner.addComponent(new FlickerAnimation(4000));
				this.gameModel.immuneMode = true;
				this.decelerate(this.currentMaxSpeed/2);
				this.sendmsg(MSG_CAR_COLLIDED);
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
	oninit(){
		this.model = this.scene.getGlobalAttribute(ATTR_GAME_MODEL);
		this.owner.addComponent(new AnimTextDisplayComponent("Prepare", 5000));
		this.subscribe(MSG_CAR_COLLIDED);
		this.subscribe(MSG_ANIM_ENDED);
	}
	
	onmessage(msg){
		if(msg.action == MSG_CAR_COLLIDED) {
			this.model.lives--;
			if(this.model.lives == 0) {
				
				let gameOverComp = new AnimTextDisplayComponent("Game Over", 5000);
				this.owner.addComponent(gameOverComp);
				this.sendmsg(MSG_GAME_OVER);
				this.postponedAnimationId = gameOverComp.id;
			}
		}
		
		if(this.postponedAnimationId !== undefined 
		&& msg.action == MSG_ANIM_ENDED 
		&& msg.component.id == this.postponedAnimationId){
			// restore the whole scene
			this.scene.clearScene();
			initGame();
		}
	}
	
	update(delta, absolute){
		
	}
}

class CameraComponent extends Component {

	oninit() {
		this.model = this.scene.getGlobalAttribute(ATTR_GAME_MODEL);
		this.car = this.scene.findAllObjectsByTag("car")[0];
	}

	update(delta, absolute) {
		// by default, speed of the camera will be the same as the speed of the car
		// however, we can animate the camera independently. That's why there are two attributes 
		this.model.cameraSpeed = this.car.getAttribute(ATTR_SPEED);
		this.model.cameraPosition += Math.floor(this.model.cameraSpeed * delta * 0.01);
		
		this.model.score += this.car.getAttribute(ATTR_SPEED)* delta * 0.001;
	}
}
