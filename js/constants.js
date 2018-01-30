/**
 * @file Constants that are used across the game
 * @author Adam Vesecky <vesecky.adam@gmail.com>
 */

// steering states
const STEERING_NONE = 0;
const STEERING_LEFT = 1;
const STEERING_RIGHT = 2;

// keys of game attributes
const ATTR_GAME_MODEL = 100;	// game model
const ATTR_SPRITE_MGR = 101;	// sprite manager
const ATTR_LANE = 102;			// lane index
const ATTR_SPEED = 103;			// current speed
const ATTR_OBSTACLE_MAP = 104;	// ObstacleMap structure

// keys of message actions
const MSG_TOUCH = 103;	// touch event
const MSG_ANIM_ENDED = 104;	// an animation has ended
const MSG_CAR_COLLIDED = 105;	// a collision with player's car occurred
const MSG_IMMUNE_MODE_STARTED = 106;	// immune mode has just started
const MSG_IMMUNE_MODE_ENDED = 107;	// immune mode has just ended


const LANES_NUM = 3; // default number of lanes