/**
 * @file Sprites and their offsets as they are placed in the main sprite sheet
 * @author Adam Vesecky <vesecky.adam@gmail.com>
 */



// Chrome doesn't support fetching JSON files from disc by default :-(
var sprites_data = {
	"road": {
		"offsetX": 262,
		"offsetY": 2,
		"width": 169,
		"height": 154
	},
	"bgr_left" : [
		{
			"type" : "grass",
			"offsetX" : 2,
			"offsetY" : 134,
			"width" : 80,
			"height" : 154
		},
		{
			"type" : "grass",
			"offsetX" : 90,
			"offsetY" : 134,
			"width" : 80,
			"height" : 154
		},
		{
			"type" : "pond",
			"offsetX" : 2,
			"offsetY" : 294,
			"width" : 80,
			"height" : 154
		},
		{
			"type" : "forest",
			"offsetX" : 90,
			"offsetY" : 294,
			"width" : 80,
			"height" : 154
		}
	],
	"bgr_right" : [
		{
			"type" : "grass",
			"offsetX" : 180,
			"offsetY" : 162,
			"width" : 80,
			"height" : 154
		},
		{
			"type" : "grass",
			"offsetX" : 268,
			"offsetY" : 162,
			"width" : 80,
			"height" : 154
		},
		{
			"type" : "carpet",
			"offsetX" : 180,
			"offsetY" : 322,
			"width" : 80,
			"height" : 154
		},
		{
			"type" : "forest",
			"offsetX" : 268,
			"offsetY" : 322,
			"width" : 80,
			"height" : 154
		}
	],
	"car": {
		"offsetX": 352,
		"offsetY": 162,
		"width": 41,
		"height": 66
	},
	"car_destroyed": {
		"offsetX": 396,
		"offsetY": 173,
		"width": 41,
		"height": 67
	},
	"obstacles" : [
		{
			"type" : "car",
			"offsetX": 44,
			"offsetY": 453,
			"width": 35,
			"height": 47
		},
		{
			"type" : "car",
			"offsetX": 440,
			"offsetY": 177,
			"width": 41,
			"height": 60
		},
		{
			"type" : "truck",
			"offsetX": 436,
			"offsetY": 0,
			"width": 45,
			"height": 86
		},
		{
			"type" : "car",
			"offsetX": 352,
			"offsetY": 229,
			"width": 32,
			"height": 46
		},
		{
			"type" : "truck",
			"offsetX": 436,
			"offsetY": 88,
			"width": 45,
			"height": 86
		},
		{
			"type" : "static",
			"offsetX": 176,
			"offsetY": 132,
			"width": 53,
			"height": 21
		},
		{
			"type" : "static",
			"offsetX": 352,
			"offsetY": 274,
			"width": 26,
			"height": 25
		}
	],
	"bar_cover" : {
		"offsetX" : 486,
		"offsetY" : 2,
		"width" : 16,
		"height" : 133
	},
	"bar_fill" : {
		"offsetX" : 486,
		"offsetY" : 142,
		"width" : 12,
		"height" : 129
	},
	"life" : {
		"offsetX" : 2,
		"offsetY" : 454,
		"width" : 37,
		"height" : 47
	}
};
