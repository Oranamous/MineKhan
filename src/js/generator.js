import { random, randomSeed, hash, noiseProfile } from "./random.js"
import { blockData, blockIds } from "./blockData.js"
import { i1D, i2D, i3D } from "./utils.js"
import { Chunk } from "./chunk.js"
import { Section } from "./section.js"
const { floor } = Math;


/* Biome format:
	{
		"name": "any valid string",
		"temperature": 0, //-1 to 1
		"moisture": 0, //-1 to 1
		"elevation": 0, //-1 to 1
		"tallness": 0, //-1 to 1
		"decor": [oak trees, birch trees, spruce trees, dark oak trees, acacia trees, jungle trees, swamp trees, cacti], //0 to 1 amount of each
		"pallette": [blockIds.grass, blockIds.dirt, blockIds.stone]
	}
*/
let globalBiomes = [
	{
		"name": "beach",
		"temperature": 0,
		"moisture": 0,
		"elevation": 0,
		"tallness": 0,
		"decor": [0, 0, 0, 0, 0, 0, 0, 0],
		"pallette": [blockIds.sand, blockIds.gravel, blockIds.stone]
	},
	{
		"name": "ocean",
		"temperature": 0,
		"moisture": 0,
		"elevation": -0.5,
		"tallness": 0,
		"decor": [0, 0, 0, 0, 0, 0, 0, 0],
		"pallette": [blockIds.gravel, blockIds.stone, blockIds.stone]
	},
	{
		"name": "foothills",
		"temperature": 0,
		"moisture": 0,
		"elevation": 0.5,
		"tallness": 0.25,
		"decor": [0, 0, 0, 0, 0, 0, 0, 0],
		"pallette": [blockIds.grass, blockIds.dirt, blockIds.stone]
	},
	{
		"name": "mountains",
		"temperature": 0,
		"moisture": 0,
		"elevation": 0.75,
		"tallness": 0.25,
		"decor": [0, 0, 0, 0, 0, 0, 0, 0],
		"pallette": [blockIds.stone, blockIds.stone, blockIds.stone]
	},
	{
		"name": "peaks",
		"temperature": 0,
		"moisture": 0,
		"elevation": 1,
		"tallness": 0.25,
		"decor": [0, 0, 0, 0, 0, 0, 0, 0],
		"pallette": [blockIds.whiteWool, blockIds.whiteWool, blockIds.stone]
	},
	{
		"name": "plains",
		"temperature": 0,
		"moisture": -0.5,
		"elevation": 0.25,
		"tallness": 0,
		"decor": [0, 0, 0, 0, 0, 0, 0, 0],
		"pallette": [blockIds.grass, blockIds.dirt, blockIds.stone]
	},
	{
		"name": "forest",
		"temperature": 0,
		"moisture": 0,
		"elevation": 0.25,
		"tallness": 0.5,
		"decor": [1, 0.1, 0.1, 0, 0, 0, 0, 0],
		"pallette": [blockIds.grass, blockIds.dirt, blockIds.stone]
	},
	{
		"name": "swamp",
		"temperature": 0,
		"moisture": 0.5,
		"elevation": 0,
		"tallness": 0,
		"decor": [1, 0, 0, 0, 0, 0, 1, 0],
		"pallette": [blockIds.grass, blockIds.dirt, blockIds.stone]
	}/*,
	{
		"name": "desert",
		"temperature": 0.5,
		"moisture": -0.5,
		"elevation": 0.25,
		"tallness": 0.1,
		"decor": [0, 0, 0, 0, 0, 0, 0, 1],
		"pallette": [blockIds.sand, blockIds.sand, blockIds.stone]
	}*/
];

function sortBiomes(biomes, temperature, moisture, elevation, tallness) {
	return biomes.filter(arrayItem => arrayItem.temperature != "hardcoded" && arrayItem.temperature != "hardcoded" && arrayItem.elevation != "hardcoded" && arrayItem.tallness != "hardcoded").sort((a, b) => {
		return Math.sqrt(
			Math.pow(a.temperature - temperature, 2) + 
			Math.pow(a.moisture - moisture, 2) + 
			Math.pow(a.elevation - elevation, 2) + 
			Math.pow(a.tallness - tallness, 2)
			) - Math.sqrt(
			Math.pow(b.temperature - temperature, 2) + 
			Math.pow(b.moisture - moisture, 2) + 
			Math.pow(b.elevation - elevation, 2) + 
			Math.pow(b.tallness - tallness, 2)
			);
	});
}

class Generator {
	constructor() {
		this.biomes = globalBiomes
		this.temperatureScale = 0.001
		this.moistureScale = 0.005
		this.elevationScale = 0.005
		this.tallnessScale = 0.0025
		this.defaultBlock = blockIds.stone
		this.defaultFluid = blockIds.water
		this.undergroundFluid = blockIds.lava
		this.decor = {
			"normalTree": function(x, y, z, wood, trunkHeight, chunk){
				for(let a = 0; a < trunkHeight; a++){
					chunk.setBlock(x, y + a, z, wood)
				}
				chunk.setBlock(x, y + trunkHeight + 1, z, blockIds.leaves)
				chunk.setBlock(x + 1, y + trunkHeight + 1, z, blockIds.leaves)
				chunk.setBlock(x - 1, y + trunkHeight + 1, z, blockIds.leaves)
				chunk.setBlock(x, y + trunkHeight + 1, z + 1, blockIds.leaves)
				chunk.setBlock(x, y + trunkHeight + 1, z - 1, blockIds.leaves)
			}
		}
	}
	temperature(x, z) { return (noiseProfile.noise(x * this.temperatureScale, z * this.temperatureScale, 16) - 0.5) * 8 }
	moisture(x, z) { return (noiseProfile.noise(x * this.moistureScale, z * this.moistureScale, 17) - 0.5) * 8 }
	elevation(x, z) { return (noiseProfile.noise(x * this.elevationScale, z * this.elevationScale, 18) - 0.5) * 8 }
	tallness(x, z) { return (noiseProfile.noise(x * this.tallnessScale, z * this.tallnessScale, 19) - 0.5) * 8 }
	getBiome(temperature, moisture, elevation, tallness) { return sortBiomes(this.biomes, temperature, moisture, elevation, tallness)[0] }
}

export { Generator, globalBiomes, sortBiomes };