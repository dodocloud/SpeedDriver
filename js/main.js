/**
 * @file Bootstrapper of the game, initializes game loop and the scene
 * @author Adam Vesecky <vesecky.adam@gmail.com>
 */



const MAXIMUM_SPEED = 50;	// maximum speed
const MAXIMUM_FREQUENCY = 50;	// maximum frequency

const DEFAULT_LIVES = 3;	// default number of lives
const DEFAULT_MAX_SPEED = MAXIMUM_SPEED / 6;	// initial maximum speed the player's car can achieve
const DEFAULT_TRAFFIC_FREQUENCY = 1;	// initial traffic frequency
const STEERING_DURATION = 400;			// number of ms the steering of player's car should take

var fps = 60; 							// frames per second
var lastTime = (new Date()).getTime(); 	// last update time
var gameTime = 0;						// number of ms since the game started

var spriteAssets = ["speeddriver.png"];	// path to all assets
var loadedImages = [];

var canvas; 
var canvasCtx;

window.onload = function () {
	// get canvas
	canvas = document.getElementById('gameCanvas');
	
	canvasCtx = canvas.getContext('2d');
	canvasCtx.font = '24px Impact';

	// init component microengine
	let context = new Context(canvas);
	scene = new Scene(context);

	var currentTime = (new Date()).getTime();
	gameTime = (new Date()).getTime() - currentTime;

	// load assets, init game and start the loop
	loadAssets()
	.then(initGame)
	.then(gameLoop);
}

function loadAssets() {
	promises = [];
	// load all images (there is only one at the moment)
	for (let spriteAsset  of spriteAssets) {
		promises.push(loadImage("images/" + spriteAsset).then((prom) => {
				loadedImages[spriteAsset] = prom;
			}));
	}

	return Promise.all(promises);
}

// initializes the whole game scene, its game entities, attributes and components
function initGame() {
	
	let atlas = loadedImages[spriteAssets[0]];
	
	// create global attributes
	let model = new GameModel();
	let spriteMgr = new SpriteManager(sprites_data, atlas)
    let obstacleMap = new ObstacleMap();
	
	// put global attributes into the scene
	scene.addGlobalAttribute(ATTR_GAME_MODEL, model);
	scene.addGlobalAttribute(ATTR_SPRITE_MGR, spriteMgr);
	scene.addGlobalAttribute(ATTR_OBSTACLE_MAP, obstacleMap);
	
	// create root game object (all global components should be put into this object)
	let root = new GameObject("root");
	root.addComponent(new InputManager()); 
	
	scene.addGameObject(root);

	// add road
	let road = new GameObject("road");
	road.addComponent(new RoadRenderer());
	scene.addGameObject(road);

	// add player's car
	let car = new GameObject("car");
	car.sprite = spriteMgr.getCar();
	
	car.posX = spriteMgr.getBgrWidth() + spriteMgr.getCenterOfLane(1) - car.sprite.width/2; // the middle lane
	car.posY = model.cameraPosition -canvas.height + 1.5 * spriteMgr.getCar().height; // slightly above the bottom border of the scene
	car.zIndex = 5;
	
	car.addComponent(new CarTouchController());	// component which controls the car
	car.addComponent(new RoadObjectRenderer());	// component which renders the car
	car.addComponent(new CarCollisionChecker()); // component which controls collisions
	car.addAttribute(ATTR_LANE, 1); // the middle lane
	scene.addGameObject(car);

	// score renderer
	root.addComponent(new ScoreDisplayComponent());
	
	// obstacle manager
	let obstacleMgr = new GameObject("obstacle_manager");
	obstacleMgr.addComponent(new ObstacleManager());
	scene.addGameObject(obstacleMgr);
	
	// speed bar
	let speedbar = new GameObject("bar");
	let sprite = spriteMgr.getBarCover();
	speedbar.posX = spriteMgr.getBgrWidth() * 2 + spriteMgr.getRoad().width - sprite.width - 20;
	speedbar.posY = 20;
	speedbar.zIndex = 10;
	speedbar.addComponent(new SpeedbarComponent());
	scene.addGameObject(speedbar);
	
	// number of lives (only view)
	let lives = new GameObject("lives");
	let livesSprite  = spriteMgr.getLife();
	lives.sprite = livesSprite;
	lives.zIndex = 10;
	lives.addComponent(new LivesComponent());
	scene.addGameObject(lives);
	
	// manager that orchestrates global events
	let gameMgr = new GameObject("gameManager");
	gameMgr.addComponent(new GameComponent());
	// the manager also renders messages such as Game Over and Get Ready
	gameMgr.posX = spriteMgr.getBgrWidth() + spriteMgr.getRoad().width/2;
	gameMgr.posY = canvas.height/2;
	scene.addGameObject(gameMgr);
	
	return true;
}

// ========================= GAME LOOP =========================
function gameLoop() {
	var currentTime = (new Date()).getTime();
	let interval = 1000/fps;
	var delta = currentTime - lastTime;
	gameTime += delta;

	// clear canvas and call update and render function upon the scene
	canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
	scene.update(delta, gameTime);
	scene.draw(canvasCtx);
	lastTime = currentTime - (delta % interval);
	
	window.requestAnimationFrame(gameLoop);
}
// =============================================================
