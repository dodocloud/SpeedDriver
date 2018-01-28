
const CAR_STATE_NONE = 0;
const CAR_STATE_STEERING_LEFT = 1;
const CAR_STATE_STEERING_RIGHT = 2;
const ATTR_GAME_MODEL = 100;
const ATTR_CAR_STATE = 101;
const ATTR_SPRITE_MGR = 102;
const ATTR_LANE = 103;
const ATTR_SPEED = 104;

const MSG_TOUCH = 103;

class Renderer extends Component {
	
	oninit(){
		let spriteMgr = this.scene.getGlobalAttribute(ATTR_SPRITE_MGR);
		this.atlas = spriteMgr.atlas;
	}
	
	draw(ctx) {
		if (this.owner.sprite != null) {
			
			ctx.drawImage(this.atlas, this.owner.sprite.offsetX, this.owner.sprite.offsetY,
				this.owner.sprite.width, this.owner.sprite.height, this.owner.posX, this.owner.posY, this.owner.sprite.width, this.owner.sprite.height);
		}
	}
}


class SpriteManager {
	constructor(sprites, atlas){
		this.sprites = sprites;
		this.atlas = atlas;
	}
	
	getBgrWidth(){
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
	
	getRoad(){
		return this.sprites.road;
	}
	
	getCar(){
		return this.sprites.car;
	}
	
	getObstacle(type, index = 0) {
		let counter = 0;
		
		for(let obstacle of this.sprites.obstacles){
			if(obstacle.type == type && counter++ == index){
				return obstacle;
			}
		}
		
		return null;
	}
	
	getRoadLaneWidth(){
		return (this.sprites.road.width - (2 * 10)) / 3;
	}
	
	getCenterOfRoad(lineIndex){
		if(lineIndex == 0) {
			return this.getCenterOfRoad(1) - this.getRoadLaneWidth();
		}
		
		if(lineIndex == 1) {
			return this.sprites.road.width / 2;
		}
		
		if(lineIndex == 2) {
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

let scene = null;




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

class Obstacle {
	constructor(sprite, lane, speed, position) {
		this.sprite = sprite;
		this.lane = lane;
		this.speed = speed;
		this.position = position;
	}
}

class ObstacleComponent extends Component {
	oninit(){
		this.spriteMgr = this.scene.getGlobalAttribute(ATTR_SPRITE_MGR);
		this.gameModel = this.scene.getGlobalAttribute(ATTR_GAME_MODEL);
	}
	
	draw(ctx){
		var sprite = this.owner.sprite;
		let currentPosition = this.gameModel.currentPosition;

		ctx.drawImage(this.spriteMgr.atlas, sprite.offsetX, sprite.offsetY,
			sprite.width, sprite.height, this.owner.posX, currentPosition - this.owner.posY, sprite.width, sprite.height);

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
	}

	draw(ctx) {
		/*var bgrWidth = this.spriteMgr.getBgrWidth();
		let currentPosition = this.gameModel.currentPosition;
		
		for (var i = 0; i < this.obstacles.length; i++) {
			var obst = this.obstacles[i];
			var sprite = obst.sprite;
			var lanePos = bgrWidth + this.spriteMgr.getCenterOfRoad(obst.lane) - sprite.width/2;
			

			ctx.drawImage(this.spriteMgr.atlas, sprite.offsetX, sprite.offsetY,
				sprite.width, sprite.height, lanePos, currentPosition - obst.position, sprite.width, sprite.height);

			obst.position += obst.speed;

			if ((currentPosition - obst.position) > 1000) {
				// delete obstacle
				this.obstacles.splice(i, 1);
			}
		}*/
	}

	update(delta, absolute) {
		var globalSpeed = this.gameModel.currentSpeed;

		if (Math.random() <= 0.1) {
			var rnd = Math.floor(Math.random() * 5);
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
				sprite =this.spriteMgr.getObstacle("truck", 1);
				speed = globalSpeed / 8 + Math.random() * globalSpeed * 0.5;
			}
			if (rnd == 4) {
				sprite =this.spriteMgr.getObstacle("static");
			}
			let posX = this.spriteMgr.getBgrWidth() + this.spriteMgr.getCenterOfRoad(lane) - sprite.width/2;
			let posY = this.gameModel.currentPosition + 200;
		
			let newObj = new GameObject("obstacle");
			newObj.sprite = sprite;
			newObj.posX = posX;
			newObj.posY = posY;
			newObj.addAttribute(ATTR_LANE, lane);
			newObj.addAttribute(ATTR_SPEED, speed);
			newObj.addComponent(new ObstacleComponent());
			this.scene.addGameObject(newObj);
		}
	}

}

class CarController extends Component {
	oninit() {
		this.steeringTime = 0;
		this.spriteMgr = this.scene.getGlobalAttribute(ATTR_SPRITE_MGR);
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

			if (posX > (this.owner.posX + this.spriteMgr.getCar().width) && currentCarLane < 2) {
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
		
		let road = this.spriteMgr.getRoad();
		let bgrWidth = this.spriteMgr.getBgrWidth();

		if (currentCarState == CAR_STATE_STEERING_LEFT || currentCarState == CAR_STATE_STEERING_RIGHT) {
			let increment = currentCarState == CAR_STATE_STEERING_LEFT ? -1 : 1;
			var carLocationX = bgrWidth + this.spriteMgr.getCenterOfRoad(currentCarLane) - this.spriteMgr.getCar().width/2;
			var desiredLocationX = bgrWidth + this.spriteMgr.getCenterOfRoad(currentCarLane + increment) - this.spriteMgr.getCar().width/2;

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
		let model = this.scene.getGlobalAttribute(ATTR_GAME_MODEL);
		model.currentPosition += model.currentSpeed;
	}
}

