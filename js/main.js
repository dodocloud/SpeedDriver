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
	scene = new Scene(canvas);

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
	scene.addGlobalComponent(new DebugComponent(document.getElementById("debugSect")));
	
	// create game manager (all global components should be put into this object)
	let gameManager = new GameObject("game_manager");
	gameManager.addComponent(new InputManager(INPUT_TOUCH | INPUT_DOWN)); 
	gameManager.addComponent(new RoadRenderer());
	scene.addGlobalGameObject(gameManager);


	// add player's car
	let car = new GameObject("car");
	car.sprite = spriteMgr.getCar();
	
	car.trans.posX = spriteMgr.getBgrWidth() + spriteMgr.getCenterOfLane(1) - car.sprite.width/2; // the middle lane
	car.trans.posY = model.cameraPosition -canvas.height + 1.5 * spriteMgr.getCar().height; // slightly above the bottom border of the scene
	car.zIndex = 5;
	
	car.addComponent(new CarTouchController());	// component which controls the car
	car.addComponent(new RoadObjectRenderer());	// component which renders the car
	car.addComponent(new CarCollisionChecker()); // component which controls collisions
	car.addAttribute(ATTR_LANE, 1); // the middle lane
	scene.addGlobalGameObject(car);

	// score renderer
	let score = new GameObject("score");
	score.zIndex = 10;
	score.addComponent(new ScoreDisplayComponent());
	scene.addGlobalGameObject(score);
	
	// obstacle manager
	let obstacleMgr = new GameObject("obstacle_manager");
	obstacleMgr.addComponent(new ObstacleManager());
	scene.addGlobalGameObject(obstacleMgr);
	
	// speed bar
	let speedbar = new GameObject("speedbar");
	let sprite = spriteMgr.getBarCover();
	speedbar.trans.posX = spriteMgr.getBgrWidth() * 2 + spriteMgr.getRoad().width - sprite.width - 20;
	speedbar.trans.posY = 20;
	speedbar.zIndex = 10;
	speedbar.addComponent(new SpeedbarComponent());
	scene.addGlobalGameObject(speedbar);
	
	// number of lives (only view)
	let lives = new GameObject("lives");
	let livesSprite  = spriteMgr.getLife();
	lives.sprite = livesSprite;
	lives.zIndex = 10;
	lives.addComponent(new LivesComponent());
	scene.addGlobalGameObject(lives);
	scene.submitChanges();

	gameManager.addComponent(new GameComponent());
	// the manager also renders messages such as Game Over and Get Ready
	gameManager.trans.posX = spriteMgr.getBgrWidth() + spriteMgr.getRoad().width/2;
	gameManager.trans.posY = canvas.height/2;

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
