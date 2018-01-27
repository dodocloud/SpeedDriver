// ===========================================================================
// IMAGE LOADING
var imagesToLoad = ["speeddriver.png"];
var images = [];
var loadedImages = 0;

function loadImages(){
	for(var i=0; i<imagesToLoad.length; i++){
		var path = imagesToLoad[i];
		images[i] = document.createElement("img");
		images[i].onload = function(){
			loadedImages++;
			if(loadedImages >= imagesToLoad.length){
				
			}
		};
		images[i].src = "images/"+path;
	}
}


// ===========================================================================
// Input

const KEY_LEFT_ARROW = 37;
const KEY_UP_ARROW = 38;
const KEY_RIGHT_ARROW = 39;
const KEY_DOWN_ARROW = 40;

const KEY_W = 87;
const KEY_A = 65;
const KEY_S = 83;
const KEY_D = 68;

var mouseX = 0;
var mouseY = 0;

function setupInput() {
	canvas.addEventListener('mousemove', updateMousePos);

	document.addEventListener('keydown', keyPressed);
	document.addEventListener('keyup', keyReleased);

	blueWarrior.setupInput(KEY_UP_ARROW, KEY_RIGHT_ARROW, KEY_DOWN_ARROW, KEY_LEFT_ARROW);
} 

function updateMousePos(evt) {
	var rect = canvas.getBoundingClientRect();
	var root = document.documentElement;

	mouseX = evt.clientX - rect.left - root.scrollLeft;
	mouseY = evt.clientY - rect.top - root.scrollTop;

	// cheat / hack to test car in any position
	/*carX = mouseX;
	carY = mouseY;
	carSpeedX = 4;
	carSpeedY = -4;*/
}

function keySet(keyEvent, setTo) {
	if(keyEvent.keyCode == blueWarrior.controlKeyLeft) {
		blueWarrior.keyHeld_West = setTo;
	}
	if(keyEvent.keyCode == blueWarrior.controlKeyRight) {
		blueWarrior.keyHeld_East = setTo;
	}
	if(keyEvent.keyCode == blueWarrior.controlKeyUp) {
		blueWarrior.keyHeld_North = setTo;
	}
	if(keyEvent.keyCode == blueWarrior.controlKeyDown) {
		blueWarrior.keyHeld_South = setTo;
	}
}

function keyPressed(evt) {
	// console.log("Key pressed: "+evt.keyCode);
	keySet(evt, true);

	evt.preventDefault();
}

function keyReleased(evt) {
	// console.log("Key pressed: "+evt.keyCode);
	keySet(evt, false);
}
// ===========================================================================
// Warrior
const PLAYER_MOVE_SPEED = 3.0;

function warriorClass() {
	this.x = 75;
	this.y = 75;
	this.myWarriorPic; // which picture to use
	this.name = "Untitled Warrior";
	this.keysHeld = 0;

	this.keyHeld_North = false;
	this.keyHeld_South = false;
	this.keyHeld_West = false;
	this.keyHeld_East = false;

	this.controlKeyUp;
	this.controlKeyRight;
	this.controlKeyDown;
	this.controlKeyLeft;

	this.setupInput = function(upKey, rightKey, downKey, leftKey) {
		this.controlKeyUp = upKey;
		this.controlKeyRight = rightKey;
		this.controlKeyDown = downKey;
		this.controlKeyLeft = leftKey;
	}

	this.reset = function(whichImage, warriorName) {
		this.name = warriorName;
		this.myWarriorPic = whichImage;
		this.keysHeld = 0;
		this.updateKeyReadout();

		for(var eachRow=0;eachRow<WORLD_ROWS;eachRow++) {
			for(var eachCol=0;eachCol<WORLD_COLS;eachCol++) {
				var arrayIndex = rowColToArrayIndex(eachCol, eachRow); 
				if(worldGrid[arrayIndex] == TILE_PLAYERSTART) {
					worldGrid[arrayIndex] = TILE_GROUND;
					this.x = eachCol * WORLD_W + WORLD_W/2;
					this.y = eachRow * WORLD_H + WORLD_H/2;
					return;
				} // end of player start if
			} // end of col for
		} // end of row for
		console.log("NO PLAYER START FOUND!");
	} // end of warriorReset func

	this.updateKeyReadout = function() {
		//document.getElementById("debugText").innerHTML = "Keys: " + this.keysHeld;
	}

	this.move = function() {
		var nextX = this.x;
		var nextY = this.y;

		if(this.keyHeld_North) {
			nextY -= PLAYER_MOVE_SPEED;
		}
		if(this.keyHeld_East) {
			nextX += PLAYER_MOVE_SPEED;
		}
		if(this.keyHeld_South) {
			nextY += PLAYER_MOVE_SPEED;
		}
		if(this.keyHeld_West) {
			nextX -= PLAYER_MOVE_SPEED;
		}

		var walkIntoTileIndex = getTileIndexAtPixelCoord(nextX, nextY);
		var walkIntoTileType = TILE_WALL;

		if(walkIntoTileIndex != undefined) {
			walkIntoTileType = worldGrid[walkIntoTileIndex];
		}

		switch(walkIntoTileType) {
			case TILE_GROUND:
				this.x = nextX;
				this.y = nextY;
				break;
			case TILE_GOAL:
				console.log(this.name + " WINS!");
				loadLevel(levelOne);
				break;
			case TILE_DOOR:
				if(this.keysHeld > 0) {
					this.keysHeld--; // one less key
					this.updateKeyReadout();
					worldGrid[walkIntoTileIndex] = TILE_GROUND;
				}
				break;
			case TILE_KEY:
				this.keysHeld++; // one more key
				this.updateKeyReadout();
				worldGrid[walkIntoTileIndex] = TILE_GROUND;
				break;
			case TILE_WALL:
			default:
				break;
		}
	}

	this.draw = function() {
		drawBitmapCenteredWithRotation(this.myWarriorPic, this.x,this.y, 0);
	}
}


// ===========================================================================
// World
const WORLD_W = 50;
const WORLD_H = 50;
const WORLD_GAP = 2;
const WORLD_COLS = 16;
const WORLD_ROWS = 12;
var levelOne =  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
				 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 5, 0, 1, 1, 1, 1,
				 1, 0, 4, 0, 4, 0, 1, 0, 2, 0, 1, 0, 1, 4, 4, 1,
				 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 5, 1, 5, 1, 1,
				 1, 1, 1, 5, 1, 1, 1, 0, 4, 0, 1, 0, 0, 0, 1, 1,
				 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 4, 0, 1, 1,
				 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1,
				 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 4, 0, 1, 1,
				 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1,
				 1, 0, 5, 0, 5, 0, 5, 0, 3, 0, 1, 1, 1, 1, 1, 1,
				 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1,
				 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
var worldGrid = [];

const TILE_GROUND = 0;
const TILE_WALL = 1;
const TILE_PLAYERSTART = 2;
const TILE_GOAL = 3;
const TILE_KEY = 4;
const TILE_DOOR = 5;

function returnTileTypeAtColRow(col, row) {
	if(col >= 0 && col < WORLD_COLS &&
		row >= 0 && row < WORLD_ROWS) {
		 var worldIndexUnderCoord = rowColToArrayIndex(col, row);
		 return worldGrid[worldIndexUnderCoord];
	} else {
		return WORLD_WALL;
	}
}

function getTileIndexAtPixelCoord(atX, atY) {
	var warriorWorldCol = Math.floor(atX / WORLD_W);
	var warriorWorldRow = Math.floor(atY / WORLD_H);
	var worldIndexUnderWarrior = rowColToArrayIndex(warriorWorldCol, warriorWorldRow);

	if(warriorWorldCol >= 0 && warriorWorldCol < WORLD_COLS &&
		warriorWorldRow >= 0 && warriorWorldRow < WORLD_ROWS) {
		return worldIndexUnderWarrior;
	} // end of valid col and row

	return undefined;
} // end of warriorWorldHandling func

function rowColToArrayIndex(col, row) {
	return col + WORLD_COLS * row;
}

function tileTypeHasTransparency(checkTileType) {
	return (checkTileType == TILE_GOAL ||
			checkTileType == TILE_KEY ||
			checkTileType == TILE_DOOR);
}

function drawWorld() {

	var arrayIndex = 0;
	var drawTileX = 0;
	var drawTileY = 0;
	for(var eachRow=0;eachRow<WORLD_ROWS;eachRow++) {
		for(var eachCol=0;eachCol<WORLD_COLS;eachCol++) {

			var arrayIndex = rowColToArrayIndex(eachCol, eachRow); 
			var tileKindHere = worldGrid[arrayIndex];
			var useImg = worldPics[tileKindHere];

			if( tileTypeHasTransparency(tileKindHere) ) {
				canvasContext.drawImage(worldPics[TILE_GROUND],drawTileX,drawTileY);
			}
			canvasContext.drawImage(useImg,drawTileX,drawTileY);
			drawTileX += WORLD_W;
			arrayIndex++;
		} // end of for each col
		drawTileY += WORLD_H;
		drawTileX = 0;
	} // end of for each row

} // end of drawWorld func


// ===========================================================================
// GraphicsCommon
function drawBitmapCenteredWithRotation(useBitmap, atX,atY, withAng) {
	canvasContext.save();
	canvasContext.translate(atX, atY);
	canvasContext.rotate(withAng);
	canvasContext.drawImage(useBitmap, -useBitmap.width/2, -useBitmap.height/2);
	canvasContext.restore();
}

function colorRect(topLeftX,topLeftY, boxWidth,boxHeight, fillColor) {
	canvasContext.fillStyle = fillColor;
	canvasContext.fillRect(topLeftX,topLeftY, boxWidth,boxHeight);
}

function colorCircle(centerX,centerY, radius, fillColor) {
	canvasContext.fillStyle = fillColor;
	canvasContext.beginPath();
	canvasContext.arc(centerX,centerY, 10, 0,Math.PI*2, true);
	canvasContext.fill();
}

function colorText(showWords, textX,textY, fillColor) {
	canvasContext.fillStyle = fillColor;
	canvasContext.fillText(showWords, textX, textY);
}



// ===========================================================================
// Main

var canvas, canvasContext;

var blueWarrior = new warriorClass();

window.onload = function() {
	canvas = document.getElementById('gameCanvas');
	canvasContext = canvas.getContext('2d');

	colorRect(0,0, canvas.width,canvas.height, 'black');
	colorText("LOADING IMAGES", canvas.width/2, canvas.height/2, 'white');

	loadImages();
}

function imageLoadingDoneSoStartGame() {
	var framesPerSecond = 30;
	setInterval(updateAll, 1000/framesPerSecond);

	setupInput();

	loadLevel(levelOne);
}

function loadLevel(whichLevel) {
	worldGrid = whichLevel.slice();
	blueWarrior.reset(warriorPic, "Blue Storm");
}

function updateAll() {
	moveAll();
	drawAll();
}

function moveAll() {
	blueWarrior.move();
}

function drawAll() {
	drawWorld();
	blueWarrior.draw();
} 