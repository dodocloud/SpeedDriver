/**
 * @file Sprites and their offsets as they are placed in the main sprite sheet
 * @author Adam Vesecky <vesecky.adam@gmail.com>
 */



// Chrome doesn't support fetching JSON files from disc by default :-(
var sprites_data = {
	"road": {
		"offsetX": 2,
		"offsetY": 163,
		"width": 169,
		"height": 134
	},
	"bgr_left" : [
		{
			"type" : "grass",
			"offsetX" : 397,
			"offsetY" : 332,
			"width" : 95,
			"height" : 161
		},
		{
			"type" : "forest",
			"offsetX" : 197,
			"offsetY" : 163,
			"width" : 95,
			"height" : 161
		},
		{
			"type" : "forest",
			"offsetX" : 397,
			"offsetY" : 163,
			"width" : 95,
			"height" : 161
		},
		{
			"type" : "forest",
			"offsetX" : 197,
			"offsetY" : 332,
			"width" : 95,
			"height" : 161
		}
	],
	"bgr_right" : [
		{
			"type" : "grass",
			"offsetX" : 397,
			"offsetY" : 332,
			"width" : 95,
			"height" : 161
		},
		{
			"type" : "forest",
			"offsetX" : 197,
			"offsetY" : 163,
			"width" : 95,
			"height" : 161
		},
		{
			"type" : "truck",
			"offsetX" : 297,
			"offsetY" : 163,
			"width" : 95,
			"height" : 161
		},
		{
			"type" : "house",
			"offsetX" : 297,
			"offsetY" : 332,
			"width" : 95,
			"height" : 161
		}
	],
	"car": {
		"offsetX": 128,
		"offsetY": 13,
		"width": 34,
		"height": 74
	},
	"car_destroyed": {
		"offsetX": 165,
		"offsetY": 13,
		"width": 34,
		"height": 74
	},
	"obstacles" : [
		{
			"type" : "truck",
			"offsetX": 8,
			"offsetY": 13,
			"width": 39,
			"height": 106
		},
		{
			"type" : "truck",
			"offsetX": 48,
			"offsetY": 13,
			"width": 39,
			"height": 106
		},
		{
			"type" : "car",
			"offsetX": 87,
			"offsetY": 13,
			"width": 38,
			"height": 71
		},
		{
			"type" : "car",
			"offsetX": 203,
			"offsetY": 13,
			"width": 34,
			"height": 74
		},
		{
			"type" : "car",
			"offsetX": 240,
			"offsetY": 13,
			"width": 34,
			"height": 74
		},
		{
			"type" : "truck",
			"offsetX": 280,
			"offsetY": 13,
			"width": 34,
			"height": 95
		},
		{
			"type" : "car",
			"offsetX": 320,
			"offsetY": 13,
			"width": 29,
			"height": 65
		},
				{
			"type" : "truck",
			"offsetX": 354,
			"offsetY": 13,
			"width": 42,
			"height": 92
		},
		{
			"type" : "static",
			"offsetX": 10,
			"offsetY": 121,
			"width": 27,
			"height": 34
		},
		{
			"type" : "static",
			"offsetX": 47,
			"offsetY": 119,
			"width": 27,
			"height": 34
		}
	],
	"bar_cover" : {
		"offsetX" : 2,
		"offsetY" : 301,
		"width" : 25,
		"height" : 204
	},
	"bar_fill" : {
		"offsetX" : 34,
		"offsetY" : 301,
		"width" : 25,
		"height" : 209
	},
	"life" : {
		"offsetX" : 81,
		"offsetY" : 343,
		"width" : 79,
		"height" : 40
	}
};
