var fps = 30; 
var interval = 1000 / fps;
var lastTime = (new Date()).getTime(); 
var gameTime = 0;


var canvas; 
var canvasCtx;

window.onload = function () {

	canvas = document.getElementById('gameCanvas');
	let context = new Context(canvas);
	scene = new Scene(context);

	canvasCtx = canvas.getContext('2d');

	var currentTime = (new Date()).getTime();
	gameTime = (new Date()).getTime() - currentTime;

	loadImages().then(initGame).then(gameLoop);
}

function initGame() {
	let model = new GameModel(getAtlas(), this.mdata);
	let root = new GameObject("root");
	root.addAttribute(ATTR_GAME_MODEL, model);
	root.addComponent(new InputManager());
	root.addComponent(new GameManager());
	scene.addGameObject(root);

	let road = new GameObject("road");
	road.addComponent(new RoadComponent());
	scene.addGameObject(road);

	let car = new GameObject("car");
	car.sprite = new Sprite(getAtlas(), mdata.car.offsetX, mdata.car.offsetY, mdata.car.width, mdata.car.height);

	car.posX = mdata.grass_left_1.width + mdata.road.width / 3 * 1;
	car.posY = canvas.height - 1.5 * mdata.car.height;
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
	var delta = (currentTime - lastTime);
	gameTime += delta;

	if (delta > interval) {
		canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
		scene._update(delta, gameTime);
		scene._draw(canvasCtx);
		lastTime = currentTime - (delta % interval);
	}

}
