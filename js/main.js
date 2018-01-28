var fps = 30; 							// frames per second
var lastTime = (new Date()).getTime(); 	// last update time
var gameTime = 0;						// number of ms since the game started
var sprites = null;						// sprites.json

var spriteAssets = ["speeddriver.png"];	// path to all assets
var loadedImages = [];

var canvas; 
var canvasCtx;

window.onload = function () {
	// get canvas
	canvas = document.getElementById('gameCanvas');
	canvasCtx = canvas.getContext('2d');

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
	
	// load json with sprite data
	promises.push(
		fetch("js/sprites.json")
			.then((res) => res.json())
			.then((json) => { sprites = json;}));
	
	return Promise.all(promises);
}

function initGame() {
	let atlas = loadedImages[spriteAssets[0]];
	
	let model = new GameModel();
	let spriteMgr = new SpriteManager(sprites, atlas)
	
	scene.addGlobalAttribute(ATTR_GAME_MODEL, model);
	scene.addGlobalAttribute(ATTR_SPRITE_MGR, spriteMgr);
	
	let root = new GameObject("root");
	root.addComponent(new InputManager());
	root.addComponent(new GameManager());
	scene.addGameObject(root);

	let road = new GameObject("road");
	road.addComponent(new RoadComponent());
	scene.addGameObject(road);

	let car = new GameObject("car");
	car.sprite = spriteMgr.getCar();

	car.posX = spriteMgr.getBgrWidth() + spriteMgr.getRoad().width / 3 * 1;
	car.posY = canvas.height - 1.5 * spriteMgr.getCar().height;
	car.addComponent(new Renderer());
	car.addComponent(new CarController());

	car.addAttribute(ATTR_CAR_STATE, CAR_STATE_NONE);
	car.addAttribute(ATTR_LANE, 1);

	scene.addGameObject(car);

	let obstacleMgr = new GameObject("obstacle_manager");
	obstacleMgr.addComponent(new ObstacleManager());
	scene.addGameObject(obstacleMgr);
	
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
