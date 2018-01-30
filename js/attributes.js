/**
 * @file All generic attributes the whole scene is working with
 * @author Adam Vesecky <vesecky.adam@gmail.com>
 */

/**
 * Main game model
 */
class GameModel {
	constructor() {
		this.cameraPosition = 0; // position of the camera
		this.cameraSpeed = 0; // speed of the camera (by default the same as the speed of the car)
		this.lives = DEFAULT_LIVES; // current number of lives
		this.score = 0; // current score
		this.immuneMode = false; // indicator for immune mode (when the car collides with anything)
		this.currentMaxSpeed = DEFAULT_MAX_SPEED; // current max speed the car is able to achieve
		this.trafficFrequency = DEFAULT_TRAFFIC_FREQUENCY; // current traffic frequency [1, MAXIMUM_FREQUENCY]
	}
}

/**
 * Sprite sheet wrapper
 */
class SpriteManager {
	constructor(sprites, atlas) {
		this.sprites = sprites;
		this.atlas = atlas;
	}

	// gets width of the background sprite
	getBgrWidth() {
		return this.sprites.bgr_left[0].width;
	}

	// gets left background sprite
	getLeftBgr(index) {
		return this.sprites.bgr_left[index];
	}

	// gets right background sprite
	getRightBgr(index) {
		return this.sprites.bgr_right[index];
	}

	// gets road sprite
	getRoad() {
		return this.sprites.road;
	}

	// gets player's car sprite
	getCar() {
		return this.sprites.car;
	}

	// gets player's car sprite when it is destroyed
	getCarDestroyed() {
		return this.sprites.car_destroyed;
	}

	// gets life sprite
	getLife() {
		return this.sprites.life;
	}

	// gets border of the speedbar
	getBarCover() {
		return this.sprites.bar_cover;
	}

	// gets inner sprite of the speedbar
	getBarFill() {
		return this.sprites.bar_fill;
	}

	// gets obstacle by type and index
	getObstacle(type, index = 0) {
		let counter = 0;

		for (let obstacle of this.sprites.obstacles) {
			if (obstacle.type == type && counter++ == index) {
				return obstacle;
			}
		}

		return null;
	}

	// gets coordinates of the center of given lane
	getCenterOfLane(laneIndex) {
		if (laneIndex == 0) {
			// the first line starts 10 pixels from the left
			return this.getCenterOfLane(1) - (this.sprites.road.width - (2 * 10)) / 3;
		}

		if (laneIndex == 1) {
			return this.sprites.road.width / 2;
		}

		if (laneIndex == 2) {
			return this.getCenterOfLane(1) + (this.sprites.road.width - (2 * 10)) / 3;
		}
	}

}

/**
 * Structure that stores obstacles (traffic)
 */
class ObstacleMap {
	constructor() {
		this.count = 0; // current number of obstacles
		this.obstacles = new Map(); // obstacles mapped by their id

		// these parameters works as follows:
		// there must be at least one lane free
		// when switching to another free lane, there must be a delay long enough
		// for the player to move to the new lane safely
		// -> when switching to a new lane, there would be two forbidden lanes at a time before the delay ends
		this.forbiddenLane1 = Math.floor(Math.random() * LANES_NUM);
		this.forbiddenLane2 = this.forbiddenLane1;
		this.lastForbiddenSwitchTime1 = 0;
		this.lastForbiddenSwitchTime2 = 0;
	}

	// gets map with obstacles, mapped by their ids
	getObstacles() {
		return this.obstacles;
	}

	// adds a new obstacle
	addObstacle(gameObject, gameTime) {
		this.obstacles.set(gameObject.id, gameObject);
		let lane = gameObject.getAttribute(ATTR_LANE);

		// check whether it is time to switch to a new lane
		if (gameTime - this.lastForbiddenSwitchTime1 >= 10000) {
			// for now there shouldn't be any new obstacle on two lanes
			this.forbiddenLane2 = this.forbiddenLane1;
			this.forbiddenLane1 = Math.floor(Math.random() * LANES_NUM);
			this.lastForbiddenSwitchTime2 = gameTime;
			this.lastForbiddenSwitchTime1 = gameTime;

		}

		// check whether the delay has ended and therefore we can forbide only one lane
		if (gameTime - this.lastForbiddenSwitchTime2 >= 5000 && this.forbiddenLane2 != this.forbiddenLane1) {
			this.forbiddenLane2 = this.forbiddenLane1;
			this.lastForbiddenSwitchTime2 = gameTime;
			this.lastForbiddenSwitchTime1 = gameTime;
		}

		this.count++;
	}

	// removes an existing obstacle
	removeObstacle(gameObject) {
		this.obstacles.delete (gameObject.id);
		this.count--;
	}

	/**
	 * @file All generic attributes the whole scene is working with
	 * @param topPos top coordinate
	 * @param bottomPos bottom coordinate
	 * @param lane lane index
	 */
	isPlaceFreeForObstacle(topPos, bottomPos, lane) {
		if (lane == this.forbiddenLane1 || lane == this.forbiddenLane2) {
			return false;
		}

		for (let[key, val]of this.obstacles) {
			if (val.getAttribute(ATTR_LANE) != lane) {
				continue;
			}

			let obstacleTopPos = val.posY;
			let obstacleBottomPos = val.posY - val.sprite.height;
			// 20 pixels tolerance
			let intersection = -Math.max(obstacleBottomPos - 20, bottomPos) + Math.min(obstacleTopPos + 20, topPos);

			if (intersection >= 0) {
				return false;
			}
		}

		return true;
	}

	// finds an obstacle that is in collision with given object
	findCollidedObstacle(gameObject) {
		for (let[key, val]of this.obstacles) { 
			if (gameObject.intersects(val)) {
				return val;
			}
		}
		return null;
	}

	// gets obstacle that is closest to given object
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

	// return true, if the given line is forbidden
	isLaneForbidden(lane) {
		return (lane == this.forbiddenLane1 || lane == this.forbiddenLane2);
	}
}
