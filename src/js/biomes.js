import { blockIds } from "./blockData.js"

let biomes = [
	{
		"name": "river",
		"temperature": "hardcoded",
		"moisture": "hardcoded",
		"elevation": "52",
		"tallness": "16",
		"roughness": "0.01",
		"trees": [0, 0, 0, 0, 0, 0, 0],
		"pallette": [blockIds.sand, blockIds.gravel, blockIds.stone]
	},
	{
		"name": "ocean",
		"temperature": "hardcoded",
		"moisture": "hardcoded",
		"elevation": 32,
		"tallness": 32,
		"roughness": 0.001,
		"trees": [0, 0, 0, 0, 0, 0, 0],
		"pallette": [blockIds.gravel, blockIds.stone, blockIds.stone]
	},
	{
		"name": "foothills",
		"temperature": "hardcoded",
		"moisture": "hardcoded",
		"elevation": 72,
		"tallness": 32,
		"roughness": 0.001,
		"trees": [0, 0, 0, 0, 0, 0, 0],
		"pallette": [blockIds.grass, blockIds.dirt, blockIds.stone]
	},
	{
		"name": "mountains",
		"temperature": "hardcoded",
		"moisture": "hardcoded",
		"elevation": 88,
		"tallness": 64,
		"roughness": 0.001,
		"trees": [0, 0, 0, 0, 0, 0, 0],
		"pallette": [blockIds.stone, blockIds.stone, blockIds.stone]
	},
	{
		"name": "peaks",
		"temperature": "hardcoded",
		"moisture": "hardcoded",
		"elevation": 128,
		"tallness": 128,
		"roughness": 0.005,
		"trees": [0, 0, 0, 0, 0, 0, 0],
		"pallette": [blockIds.whiteWool, blockIds.whiteWool, blockIds.stone]
	},
	{
		"name": "plains",
		"temperature": 0,
		"moisture": -0.1,
		"elevation": 64,
		"tallness": 32,
		"roughness": 0.0005,
		"trees": [0, 0, 0, 0, 0, 0, 0],
		"pallette": [blockIds.grass, blockIds.dirt, blockIds.stone]
	},
	{
		"name": "forest",
		"temperature": 0,
		"moisture": 0,
		"elevation": 64,
		"tallness": 64,
		"roughness": 0.0025,
		"trees": [1, 1, 1, 0, 0, 0, 0],
		"pallette": [blockIds.grass, blockIds.dirt, blockIds.stone]
	},
	{
		"name": "swamp",
		"temperature": 0,
		"moisture": 0.1,
		"elevation": 50,
		"tallness": 32,
		"roughness": 0.001,
		"trees": [1, 0, 0, 0, 0, 0, 1],
		"pallette": [blockIds.grass, blockIds.dirt, blockIds.stone]
	},
	{
		"name": "desert",
		"temperature": 0.1,
		"moisture": -0.1,
		"elevation": 64,
		"tallness": 16,
		"roughness": 0.0005,
		"trees": [0, 0, 0, 0, 0, 0, 0],
		"pallette": [blockIds.sand, blockIds.sand, blockIds.stone]
	}
];

export { biomes };