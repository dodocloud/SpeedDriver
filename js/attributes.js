class GameModel {
	constructor() {
		this.cameraPosition = 0;
		this.cameraSpeed = 0;
		this.lives = DEFAULT_LIVES;
		this.score = 0;
		this.immuneMode = false;
		this.currentMaxSpeed = DEFAULT_MAX_SPEED;
		this.trafficFrequency = DEFAULT_TRAFFIC_FREQUENCY;
	}
}


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
		this.forbiddenLane1 =  Math.floor(Math.random() * LANES_NUM);
		this.forbiddenLane2 = this.forbiddenLane1;
		this.lastForbiddenSwitchTime1 = 0;
		this.lastForbiddenSwitchTime2 = 0;
	}

	getObstacles() {
		return this.obstacles;
	}

	addObstacle(gameObject, gameTime) {
		this.obstacles.set(gameObject.id, gameObject);
		let lane = gameObject.getAttribute(ATTR_LANE);

		if(gameTime - this.lastForbiddenSwitchTime1 >= 10000) {
			this.forbiddenLane2 = this.forbiddenLane1;
			this.forbiddenLane1 = Math.floor(Math.random() * LANES_NUM);
			this.lastForbiddenSwitchTime2 = gameTime;
			this.lastForbiddenSwitchTime1 = gameTime;
			
		}
		
		if(gameTime - this.lastForbiddenSwitchTime2 >= 5000 && this.forbiddenLane2 != this.forbiddenLane1) {
			this.forbiddenLane2 = this.forbiddenLane1;
			this.lastForbiddenSwitchTime2 = gameTime;
			this.lastForbiddenSwitchTime1 = gameTime;
		}
		
		this.count++;
	}

	removeObstacle(gameObject) {
		this.obstacles.delete (gameObject.id);
		this.count--;
	}

	isPlaceFreeForObstacle(topPos, bottomPos, lane, tolerance = 20) {
		if(lane == this.forbiddenLane1 || lane == this.forbiddenLane2){
			return false;
		}
		
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
		return (lane != this.forbiddenLane1 && lane != this.forbiddenLane2);
	}
}
