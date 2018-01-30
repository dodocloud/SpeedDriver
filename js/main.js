var fps = 30; 							// frames per second
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
	// load all images
	for (let spriteAsset  of spriteAssets) {
		promises.push(loadImage("images/" + spriteAsset).then((prom) => {
				loadedImages[spriteAsset] = prom;
			}));
	}

	return Promise.all(promises);
}

function initGame() {
	let atlas = loadedImages[spriteAssets[0]];
	
	let model = new GameModel();
	let spriteMgr = new SpriteManager(sprites_data, atlas)
	
	scene.addGlobalAttribute(ATTR_GAME_MODEL, model);
	scene.addGlobalAttribute(ATTR_SPRITE_MGR, spriteMgr);
	scene.addGlobalAttribute(ATTR_OBSTACLE_MAP, new ObstacleMap());
	
	let root = new GameObject("root");
	root.addComponent(new InputManager());
	
	scene.addGameObject(root);

	let road = new GameObject("road");
	road.addComponent(new RoadComponent());
	scene.addGameObject(road);

	let car = new GameObject("car");
	car.sprite = spriteMgr.getCar();
	
	// place the car into the middle lane
	car.posX = spriteMgr.getBgrWidth() + spriteMgr.getCenterOfRoad(1) - car.sprite.width/2;
	car.posY = model.cameraPosition -canvas.height + 1.5 * spriteMgr.getCar().height;
	car.addComponent(new CarTouchController());
	car.addComponent(new RoadObjectRenderer());
	car.addComponent(new CarCollisionChecker());
	car.zIndex = 5;
	
	car.addAttribute(ATTR_LANE, 1);

	scene.addGameObject(car);

	root.addComponent(new ScoreDisplayComponent());
	
	let obstacleMgr = new GameObject("obstacle_manager");
	obstacleMgr.addComponent(new ObstacleManager());
	scene.addGameObject(obstacleMgr);
	
	
	let speedbar = new GameObject("bar");
	let sprite = spriteMgr.getBarCover();
	speedbar.posX = spriteMgr.getBgrWidth() * 2 + spriteMgr.getRoad().width - sprite.width - 20;
	speedbar.posY = 20;
	speedbar.zIndex = 10;
	speedbar.addComponent(new SpeedbarComponent());
	scene.addGameObject(speedbar);
	
	let lives = new GameObject("lives");
	let livesSprite  = spriteMgr.getLife();
	lives.sprite = livesSprite;
	lives.zIndex = 10;
	lives.addComponent(new LivesComponent());
	scene.addGameObject(lives);
	
	let gameMgr = new GameObject("gameManager");
	gameMgr.addComponent(new GameManager());
	gameMgr.posX = spriteMgr.getBgrWidth() + spriteMgr.getRoad().width/2;
	gameMgr.posY = canvas.height/2;
	scene.addGameObject(gameMgr);
	
	return true;
}


function gameLoop() {
	window.requestAnimationFrame(gameLoop);

	var currentTime = (new Date()).getTime();
	let interval = 1000/fps;
	// delta shouldn't exceed double of period
	var delta = Math.min(interval*2, (currentTime - lastTime));
	
	gameTime += delta;

	if (delta > interval) {
		// clear canvas and call update and render function upon the scene
		canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
		scene.update(delta, gameTime);
		scene.draw(canvasCtx);
		lastTime = currentTime - (delta % interval);
	}
}
