import { random, randomSeed, hash, noiseProfile } from "./random.js"
import { blockData, blockIds } from "./blockData.js"
import { Section } from "./section.js"
import { i1D, i2D, i3D } from "./utils.js"

const { floor, min, max, round, sin, cos, abs } = Math;

class Chunk {
	constructor(x, z, world, glExtensions, gl, glCache, superflat, caves) {
		this.x = x
		this.z = z
		this.maxY = 0
		this.minY = 255
		this.sections = []
		this.cleanSections = []
		this.tops = new Uint8Array(16 * 16) // Store the heighest block at every (x,z) coordinate
		this.surfaceBiomes = []
		this.caveBiomes = []
		this.optimized = false
		this.generated = false; // Terrain data
		this.populated = superflat // Trees and ores
		this.lit = false
		this.lazy = false
		this.edited = false
		this.loaded = false
		// vao for this chunk
		this.vao = glExtensions.vertex_array_object.createVertexArrayOES()
		this.caves = !caves
		this.world = world
		this.gl = gl
		this.glCache = glCache
		this.glExtensions = glExtensions
		this.doubleRender = false
	}
	genChunk(superflat) {
		let trueX = this.x
		let trueZ = this.z

		if (this.generated) {
			return false
		}

		let temperature
		let moisture
		let height
		let biome
		let groundBlocks
		let soilDepth
		let soilDepth2
		let soilDepth3
		let soilDepth4
		let caveNoiseVal
		let caveNoiseVal2
		let caveNoiseVal3
		let undergroundBlock = blockIds.stone
		let deepUndergroundBlock = blockIds.stone
		let biomeThreshhold = 0.05
		let temperatureScale = 0.0005
		let moistureScale = 0.001
		let baseHeight = 40
		let minHeight = 32
		let maxHeight = 240
		let horizontalScale = 0.005
		let horizontalVariationScale = 0.005
		let verticalVariationScale = 0.001
		let riverScale = 0.0018
		let verticalScale = 128
		let heightnodes = []
		let nodeHeight
		let nodeBiomes = []
		let nodeVal
		let nodeVal2
		let nodeVal3
		for (let i = 0; i < 16; i++) {
			for (let k = 0; k < 16; k++) {
				temperature = superflat ? 0 : (noiseProfile.noise((trueX + i) * temperatureScale, (trueZ + k) * temperatureScale, 16)-0.5)
				moisture = superflat ? 0 : (noiseProfile.noise((trueX + i) * moistureScale, (trueZ + k) * moistureScale, 17)-0.5)
				temperature += random(-0.001, 0.001)
				moisture += random(-0.001, 0.001)
				
				if(temperature>biomeThreshhold){
					if(moisture<-biomeThreshhold){biome = 'desert';}
					else if(moisture>biomeThreshhold){biome = 'jungle';}
					else{biome = 'savanna';}
				}
				else if(temperature<-biomeThreshhold){
					if(moisture<-biomeThreshhold){biome = 'tundra';}
					else if(moisture>biomeThreshhold){biome = 'glacier';}
					else{biome = 'taiga';}
				}
				else{
					if(moisture<-biomeThreshhold){biome = 'plains';}
					else if(moisture>biomeThreshhold){biome = 'swamp';}
					else{biome = 'forest';}
				}
				this.surfaceBiomes[k * 16 + i] = biome;
			}
		}
		if (superflat) {
			for (let i = 0; i < 16; i++) {
				for (let k = 0; k < 16; k++) {
					
					height = 4;
					this.tops[k * 16 + i] = height;
					biome = this.surfaceBiomes[k * 16 + i];
					
					if(height < 72){
						if(height < 64){biome = 'water';}
						else{biome = 'beach';}
					}
					
					for (let j = 1; j < height + 1; j++) {
						caveNoiseVal = noiseProfile.noise((trueX + i)*0.01, j*0.01, (trueZ + k)*0.01);
						caveNoiseVal2 = noiseProfile.noise((trueX + i)*0.01, j*0.01+4, (trueZ + k)*0.01);
						caveNoiseVal3 = noiseProfile.noise((trueX + i)*0.01, j*0.01-4, (trueZ + k)*0.01);
						if(caveNoiseVal+caveNoiseVal2<sin((j+19)/24)&&caveNoiseVal3>0.5){
							if(j < 8){
								this.setBlock(i, j, k, blockIds.lava)
							}
						}
						else{
							if(j < 64){
								this.setBlock(i, j, k, deepUndergroundBlock)
							}
							else{
								this.setBlock(i, j, k, undergroundBlock)
							}
						}
					}
					this.setBlock(i, 0, k, blockIds.bedrock)
					this.setBlock(i, 1, k, deepUndergroundBlock)
					
					
					soilDepth = floor(random(1, 3));
					soilDepth2 = soilDepth + floor(random(1, 3));
					soilDepth3 = soilDepth2 + floor(random(1, 3));
					soilDepth4 = soilDepth3 + floor(random(1, 3));
					
					switch(biome){
						case 'beach':
							groundBlocks = [blockIds.sand]
							for (let j = 0; j < soilDepth3; j++) {
								groundBlocks[j] = blockIds.sand
							}
						break;
						
						case 'water':
							groundBlocks = [blockIds.gravel]
							for (let j = 0; j < soilDepth4; j++) {
								groundBlocks[j] = blockIds.gravel
							}
						break;
						
						case 'desert':
							groundBlocks = [blockIds.sand]
							for (let j = 0; j < soilDepth2; j++) {
								groundBlocks[j] = blockIds.sand
							}
						break;
						
						case 'jungle':
							groundBlocks = [blockIds.grass]
							for (let j = 1; j < soilDepth2; j++) {
								groundBlocks[j] = blockIds.dirt
							}
						break;
						
						case 'savanna':
							groundBlocks = [blockIds.grass]
							for (let j = 1; j < soilDepth4; j++) {
								groundBlocks[j] = blockIds.acaciaPlanks
							}
						break;
						
						case 'tundra':
							groundBlocks = [blockIds.whiteWool]
							for (var j = 0; j < soilDepth2; j++) {
								groundBlocks[j] = blockIds.whiteWool
							}
						break;
						
						case 'glacier':
							groundBlocks = [blockIds.lightBlueWool]
							for (var j = 0; j < soilDepth3; j++) {
								groundBlocks[j] = blockIds.lightBlueWool
							}
						break;
						
						case 'taiga':
							groundBlocks = [blockIds.sprucePlanks]
							for (var j = 0; j < soilDepth; j++) {
								groundBlocks[j] = blockIds.sprucePlanks
							}
						break;
						
						case 'plains':
							groundBlocks = [blockIds.grass]
							for (var j = 1; j < soilDepth; j++) {
								groundBlocks[j] = blockIds.dirt
							}
						break;
						
						case 'swamp':
							groundBlocks = [blockIds.brownWool]
							for (var j = 0; j < soilDepth3; j++) {
								groundBlocks[j] = blockIds.brownWool
							}
						break;
						
						case 'forest':
							groundBlocks = [blockIds.grass]
							for (var j = 1; j < soilDepth; j++) {
								groundBlocks[j] = blockIds.dirt
							}
						break;
						
						default:
							groundBlocks = [blockIds.grass]
							for (var j = 1; j < soilDepth; j++) {
								groundBlocks[j] = blockIds.dirt
							}
						break;
					}
					
					this.surfaceBiomes[k * 16 + i] = biome;
					
					for( let j = height + 1; j < 69; j++) {
					this.setBlock(i, j, k, blockIds.water)
					}
					
					if (height > minHeight) {
						for (let a = 0; a < groundBlocks.length; a++) {
							if (this.getBlock(i, height - a, k) === blockIds.air||this.getBlock(i, height - a, k) === blockIds.water) break
							this.setBlock(i, height - a, k, groundBlocks[a])
						}
					}
			
			
		}
		else {
			for (let i = 0; i < 3; i++) {
				for (let k = 0; k < 3; k++) {
					temperature = superflat ? 0 : (noiseProfile.noise((trueX + (i * 8)) * temperatureScale, (trueZ + (k * 8)) * temperatureScale, 16)-0.5)
					moisture = superflat ? 0 : (noiseProfile.noise((trueX + (i * 8)) * moistureScale, (trueZ + (k * 8)) * moistureScale, 17)-0.5)
					temperature += random(-0.001, 0.001)
					moisture += random(-0.001, 0.001)
					
					if(temperature>biomeThreshhold){
						if(moisture<-biomeThreshhold){biome = 'desert';}
						else if(moisture>biomeThreshhold){biome = 'jungle';}
						else{biome = 'savanna';}
					}
					else if(temperature<-biomeThreshhold){
						if(moisture<-biomeThreshhold){biome = 'tundra';}
						else if(moisture>biomeThreshhold){biome = 'glacier';}
						else{biome = 'taiga';}
					}
					else{
						if(moisture<-biomeThreshhold){biome = 'plains';}
						else if(moisture>biomeThreshhold){biome = 'swamp';}
						else{biome = 'forest';}
					}
					nodeBiomes[i * 3 + k] = biome;
				}
			}
			for (let i = 0; i < 3; i++) {
				for (let j = 0; j < 3; j++) {
					
					//Mountain Noise
					nodeVal = noiseProfile.noise((trueX + (i * 8)) * horizontalScale, (trueZ + (j * 8)) * horizontalScale);
					if(nodeVal>0.5){
						nodeVal = 1 - nodeVal
					}
					nodeVal *= 2
					
					//River Noise
					nodeVal2 = noiseProfile.noise((trueX + (i * 8)) * riverScale, (trueZ + (j * 8)) * riverScale, 3.14);
					if(nodeVal2<0.5){
						nodeVal2 = 1 - nodeVal2
					}
					nodeVal2 *= nodeVal2
					nodeVal2 -= 0.25
					nodeVal2 *= 4
					
					//Hill Noise
					nodeVal3 = noiseProfile.noise((trueX + (i * 8)) * verticalVariationScale, (trueZ + (j * 8)) * verticalVariationScale, 6.28);
					
					biome = nodeBiomes[i * 3 + j];
					
					switch(biome){
						
						case 'plains':
							nodeHeight = min(nodeVal, nodeVal2 * 2) * nodeVal3 * verticalScale * 0.75 + baseHeight
						break;
						
						case 'swamp':
							nodeHeight = min(nodeVal, nodeVal2 * 2) * nodeVal3 * verticalScale * 0.5 + baseHeight
						break;
						
						default:
							nodeHeight = min(nodeVal, nodeVal2 * 2) * nodeVal3 * verticalScale + baseHeight
						break;
					}
					
					if(nodeHeight > maxHeight){nodeHeight = maxHeight;}
					if(nodeHeight < minHeight){nodeHeight = minHeight;}
					
					heightnodes[i * 3 + j] = nodeHeight
				}
			}
			for (let i = 0; i < 16; i++) {
				for (let k = 0; k < 16; k++) {
					height = minHeight;
					if(i<8){
						if(k<8){
							height = i2D(heightnodes[0], heightnodes[3], heightnodes[1], heightnodes[4], i/8, k/8);
						}
						else{
							height = i2D(heightnodes[1], heightnodes[4], heightnodes[2], heightnodes[5], i/8, (k-8)/8);
						}
					}
					else{
						if(k<8){
							height = i2D(heightnodes[3], heightnodes[6], heightnodes[4], heightnodes[7], (i-8)/8, k/8);
						}
						else{
							height = i2D(heightnodes[4], heightnodes[7], heightnodes[5], heightnodes[8], (i-8)/8, (k-8)/8);
						}
					}
					this.tops[k * 16 + i] = floor(height);
					//this.tops[k * 16 + i] = (k * 16 + i) / 2 + 16
				}
			}
			for (let i = 0; i < 16; i++) {
				for (let k = 0; k < 16; k++) {
					
					height = this.tops[k * 16 + i];
					biome = this.surfaceBiomes[k * 16 + i];
					
					if(height < 72){
						if(height < 64){biome = 'water';}
						else{biome = 'beach';}
					}
					
					for (let j = 1; j < height + 1; j++) {
						caveNoiseVal = noiseProfile.noise((trueX + i)*0.01, j*0.01, (trueZ + k)*0.01);
						caveNoiseVal2 = noiseProfile.noise((trueX + i)*0.01, j*0.01+4, (trueZ + k)*0.01);
						caveNoiseVal3 = noiseProfile.noise((trueX + i)*0.01, j*0.01-4, (trueZ + k)*0.01);
						if(caveNoiseVal+caveNoiseVal2<sin((j+19)/24)&&caveNoiseVal3>0.5){
							if(j < 8){
								this.setBlock(i, j, k, blockIds.lava)
							}
						}
						else{
							if(j < 64){
								this.setBlock(i, j, k, deepUndergroundBlock)
							}
							else{
								this.setBlock(i, j, k, undergroundBlock)
							}
						}
					}
					this.setBlock(i, 0, k, blockIds.bedrock)
					this.setBlock(i, 1, k, deepUndergroundBlock)
					
					
					soilDepth = floor(random(1, 3));
					soilDepth2 = soilDepth + floor(random(1, 3));
					soilDepth3 = soilDepth2 + floor(random(1, 3));
					soilDepth4 = soilDepth3 + floor(random(1, 3));
					
					switch(biome){
						case 'beach':
							groundBlocks = [blockIds.sand]
							for (let j = 0; j < soilDepth3; j++) {
								groundBlocks[j] = blockIds.sand
							}
						break;
						
						case 'water':
							groundBlocks = [blockIds.gravel]
							for (let j = 0; j < soilDepth4; j++) {
								groundBlocks[j] = blockIds.gravel
							}
						break;
						
						case 'desert':
							groundBlocks = [blockIds.sand]
							for (let j = 0; j < soilDepth2; j++) {
								groundBlocks[j] = blockIds.sand
							}
						break;
						
						case 'jungle':
							groundBlocks = [blockIds.grass]
							for (let j = 1; j < soilDepth2; j++) {
								groundBlocks[j] = blockIds.dirt
							}
						break;
						
						case 'savanna':
							groundBlocks = [blockIds.grass]
							for (let j = 1; j < soilDepth4; j++) {
								groundBlocks[j] = blockIds.acaciaPlanks
							}
						break;
						
						case 'tundra':
							groundBlocks = [blockIds.whiteWool]
							for (var j = 0; j < soilDepth2; j++) {
								groundBlocks[j] = blockIds.whiteWool
							}
						break;
						
						case 'glacier':
							groundBlocks = [blockIds.lightBlueWool]
							for (var j = 0; j < soilDepth3; j++) {
								groundBlocks[j] = blockIds.lightBlueWool
							}
						break;
						
						case 'taiga':
							groundBlocks = [blockIds.sprucePlanks]
							for (var j = 0; j < soilDepth; j++) {
								groundBlocks[j] = blockIds.sprucePlanks
							}
						break;
						
						case 'plains':
							groundBlocks = [blockIds.grass]
							for (var j = 1; j < soilDepth; j++) {
								groundBlocks[j] = blockIds.dirt
							}
						break;
						
						case 'swamp':
							groundBlocks = [blockIds.brownWool]
							for (var j = 0; j < soilDepth3; j++) {
								groundBlocks[j] = blockIds.brownWool
							}
						break;
						
						case 'forest':
							groundBlocks = [blockIds.grass]
							for (var j = 1; j < soilDepth; j++) {
								groundBlocks[j] = blockIds.dirt
							}
						break;
						
						default:
							groundBlocks = [blockIds.grass]
							for (var j = 1; j < soilDepth; j++) {
								groundBlocks[j] = blockIds.dirt
							}
						break;
					}
					
					this.surfaceBiomes[k * 16 + i] = biome;
					
					for( let j = height + 1; j < 69; j++) {
					this.setBlock(i, j, k, blockIds.water)
					}
					
					if (height > minHeight) {
						for (let a = 0; a < groundBlocks.length; a++) {
							if (this.getBlock(i, height - a, k) === blockIds.air||this.getBlock(i, height - a, k) === blockIds.water) break
							this.setBlock(i, height - a, k, groundBlocks[a])
						}
					}
				}
			}
		}
		this.generated = true
	}
	getBlock(x, y, z) {
		let s = y >> 4
		return this.sections.length > s ? this.sections[s].getBlock(x, y & 15, z) : 0
	}
	setBlock(x, y, z, blockID, user) {
		if (!this.sections[y >> 4]) {
			do {
				this.sections.push(new Section(this.x, this.sections.length * 16, this.z, 16, this, !this.caves, this.world))
			} while (!this.sections[y >> 4])
		}
		if (user && !this.sections[y >> 4].edited) {
			this.cleanSections[y >> 4] = this.sections[y >> 4].blocks.slice()
			this.sections[y >> 4].edited = true
			this.edited = true
		}
		if (blockData[blockID].semiTrans) {
			this.doubleRender = true
			if (!this.world.doubleRenderChunks.includes(this)) {
				this.world.doubleRenderChunks.push(this)
			}
		}
		this.sections[y >> 4].setBlock(x, y & 15, z, blockID)
	}
	fillLight() {
		let max = this.sections.length * 16 - 1
		let blockSpread = []

		// Set vertical columns of light to level 15
		for (let x = 0; x < 16; x++) {
			for (let z = 0; z < 16; z++) {
				let stop = false
				for (let y = max; y >= 0; y--) {
					let data = blockData[this.getBlock(x, y, z)]
					if (data.lightLevel) {
						if (!blockSpread[data.lightLevel]) blockSpread[data.lightLevel] = []
						blockSpread[data.lightLevel].push(x + this.x, y, z + this.z)
						this.setLight(x, y, z, data.lightLevel, 1)
					}
					if (!stop && !data.transparent) {
						this.tops[z * 16 + x] = y
						stop = true
					}
					else if (!stop) {
						this.setLight(x, y, z, 15, 0)
					}
				}
			}
		}

		// Spread the light to places where the vertical columns stopped earlier, plus chunk borders
		let spread = []
		for (let x = 0; x < 16; x++) {
			for (let z = 0; z < 16; z++) {
				for (let y = this.tops[z * 16 + x] + 1; y <= max; y++) {
					if (x === 15 || this.tops[z * 16 + x + 1] > y) {
						spread.push(x + this.x, y, z + this.z)
						continue
					}
					if (x === 0 || this.tops[z * 16 + x - 1] > y) {
						spread.push(x + this.x, y, z + this.z)
						continue
					}
					if (z === 15 || this.tops[(z + 1) * 16 + x] > y) {
						spread.push(x + this.x, y, z + this.z)
						continue
					}
					if (z === 0 || this.tops[(z - 1) * 16 + x] > y) {
						spread.push(x + this.x, y, z + this.z)
						continue
					}
					break
				}
			}
		}
		this.spreadLight(spread, 14)

		for (let i = blockSpread.length - 1; i > 0; i--) {
			let blocks = blockSpread[i]
			if (blocks && blocks.length) {
				this.spreadLight(blocks, i - 1, false, 1)
			}
		}

		this.lit = true
	}
	setLight(x, y, z, level, blockLight) {
		if (y < this.sections.length * 16) {
			this.sections[y >> 4].setLight(x, y & 15, z, level, blockLight)
		}
	}
	getLight(x, y, z, blockLight = 0) {
		if (y >= this.sections.length * 16) return 15
		return this.sections[y >> 4].getLight(x, y & 15, z, blockLight)
	}
	trySpread(x, y, z, level, spread, blockLight, update = false) {
		const { world } = this
		if (world.getLight(x, y, z, blockLight) < level) {
			if (blockData[world.getBlock(x, y, z)].transparent) {
				world.setLight(x, y, z, level, blockLight)
				spread.push(x, y, z)
			}
		}
		if (update && (x < this.x || x > this.x + 15 || z < this.z || z > this.z + 15)) {
			let chunk = world.getChunk(x, z)
			if (chunk.buffer && !world.meshQueue.includes(chunk)) {
				world.meshQueue.push(chunk)
			}
		}
	}
	spreadLight(blocks, level, update = false, blockLight = 0) {
		let spread = []
		let x = 0, y = 0, z = 0
		for (let i = 0; i < blocks.length; i += 3) {
			x = blocks[i]
			y = blocks[i + 1]
			z = blocks[i + 2]
			this.trySpread(x - 1, y, z, level, spread, blockLight, update)
			this.trySpread(x + 1, y, z, level, spread, blockLight, update)
			this.trySpread(x, y - 1, z, level, spread, blockLight, update)
			this.trySpread(x, y + 1, z, level, spread, blockLight, update)
			this.trySpread(x, y, z - 1, level, spread, blockLight, update)
			this.trySpread(x, y, z + 1, level, spread, blockLight, update)
		}
		if (level > 1 && spread.length) {
			this.spreadLight(spread, level - 1, update, blockLight)
		}
	}
	tryUnSpread(x, y, z, level, spread, respread, blockLight) {
		const { world } = this
		let light = world.getLight(x, y, z, blockLight)
		let trans = blockData[world.getBlock(x, y, z)].transparent
		if (light === level) {
			if (trans) {
				world.setLight(x, y, z, 0, blockLight)
				spread.push(x, y, z)
			}
		}
		else if (light > level) {
			respread[light].push(x, y, z)
		}
		if (x < this.x || x > this.x + 15 || z < this.z || z > this.z + 15) {
			let chunk = world.getChunk(x, z)
			if (chunk && chunk.buffer && !world.meshQueue.includes(chunk)) {
				world.meshQueue.push(chunk)
			}
		}
	}
	unSpreadLight(blocks, level, respread, blockLight) {
		let spread = []
		let x = 0, y = 0, z = 0
		for (let i = 0; i < blocks.length; i += 3) {
			x = blocks[i]
			y = blocks[i + 1]
			z = blocks[i + 2]
			this.tryUnSpread(x - 1, y, z, level, spread, respread, blockLight)
			this.tryUnSpread(x + 1, y, z, level, spread, respread, blockLight)
			this.tryUnSpread(x, y - 1, z, level, spread, respread, blockLight)
			this.tryUnSpread(x, y + 1, z, level, spread, respread, blockLight)
			this.tryUnSpread(x, y, z - 1, level, spread, respread, blockLight)
			this.tryUnSpread(x, y, z + 1, level, spread, respread, blockLight)
		}
		if (level > 1 && spread.length) {
			this.unSpreadLight(spread, level - 1, respread, blockLight)
		}
	}
	reSpreadLight(respread, blockLight) {
		for (let i = respread.length - 1; i > 1; i--) {
			let blocks = respread[i]
			let level = i - 1
			let spread = respread[level]
			for (let j = 0; j < blocks.length; j += 3) {
				let x = blocks[j]
				let y = blocks[j + 1]
				let z = blocks[j + 2]
				this.trySpread(x - 1, y, z, level, spread, blockLight)
				this.trySpread(x + 1, y, z, level, spread, blockLight)
				this.trySpread(x, y - 1, z, level, spread, blockLight)
				this.trySpread(x, y + 1, z, level, spread, blockLight)
				this.trySpread(x, y, z - 1, level, spread, blockLight)
				this.trySpread(x, y, z + 1, level, spread, blockLight)
			}
		}
	}
	optimize(screen) {
		const { world } = this
		for (let i = 0; i < this.sections.length; i++) {
			this.sections[i].optimize(screen)
		}
		if (!world.meshQueue.includes(this)) {
			world.meshQueue.push(this)
		}
		this.optimized = true
	}
	render(p, global) {
		const { glExtensions, gl } = this
		if (this.buffer === undefined) {
			return
		}
		if (p.canSee(this.x, this.minY, this.z, this.maxY)) {
			global.renderedChunks++
			glExtensions.vertex_array_object.bindVertexArrayOES(this.vao)
			gl.drawElements(gl.TRIANGLES, 6 * this.faces, gl.UNSIGNED_INT, 0)
			glExtensions.vertex_array_object.bindVertexArrayOES(null)
		}
	}
	updateBlock(x, y, z, world, lazy, screen) {
		if (this.buffer) {
			this.lazy = lazy
			if (this.sections.length > y >> 4) {
				this.sections[y >> 4].updateBlock(x, y & 15, z, world, screen)
			}
		}
	}
	deleteBlock(x, y, z, user) {
		if (!this.sections[y >> 4]) {
			return
		}
		if (user && !this.sections[y >> 4].edited) {
			this.cleanSections[y >> 4] = this.sections[y >> 4].blocks.slice()
			this.sections[y >> 4].edited = true
			this.edited = true
		}
		this.sections[y >> 4].deleteBlock(x, y & 15, z)
		this.minY = y < this.minY ? y : this.minY
		this.maxY = y > this.maxY ? y : this.maxY
	}
	async carveCaves() {
		let promises = []
		for (let i = 0; i < this.sections.length; i++) {
			if (!this.sections[i].caves) {
				promises.push(this.sections[i].carveCaves())
			}
		}
		await Promise.all(promises)
		this.caves = true
	}
	populate(trees) {
		const { world } = this
		randomSeed(hash(this.x, this.z) * 210000000)
		let wx = 0, wz = 0, ground = 0, biome, top = 0, rand = 0, place = false
		for (let i = 0; i < 16; i++) {
			for (let k = 0; k < 16; k++) {
				wx = this.x + i
				wz = this.z + k
				
				ground = this.tops[k * 16 + i]
				biome = this.surfaceBiomes[k * 16 + i]
				
				if (biome === 'swamp' && world.getBlock(wx + 1, ground, wz) && world.getBlock(wx - 1, ground, wz) && world.getBlock(wx, ground, wz + 1) && world.getBlock(wx, ground, wz - 1)) {
					this.setBlock(i, ground, k, blockIds.water)
					if(random()>0.5){
						this.setBlock(i, ground - 1, k, blockIds.water)
					}
				}
				
				if (trees && random() < 0.005 && this.getBlock(i, ground, k) === blockIds.grass && ground > 75 && biome === 'forest') {

					top = ground + floor(4.5 + random(2.5))
					rand = floor(random(4096))
					let tree = random() < 0.6 ? blockIds.oakLog : ++top && blockIds.birchLog

					//Center
					for (let j = ground + 1; j <= top; j++) {
						this.setBlock(i, j, k, tree)
					}
					this.setBlock(i, top + 1, k, blockIds.leaves)
					this.setBlock(i, ground, k, blockIds.dirt)

					//Bottom leaves
					for (let x = -2; x <= 2; x++) {
						for (let z = -2; z <= 2; z++) {
							if (x || z) {
								if ((x * z & 7) === 4) {
									place = rand & 1
									rand >>>= 1
									if (place) {
										world.spawnBlock(wx + x, top - 2, wz + z, blockIds.leaves)
									}
								}
								else {
									world.spawnBlock(wx + x, top - 2, wz + z, blockIds.leaves)
								}
							}
						}
					}

					//2nd layer leaves
					for (let x = -2; x <= 2; x++) {
						for (let z = -2; z <= 2; z++) {
							if (x || z) {
								if ((x * z & 7) === 4) {
									place = rand & 1
									rand >>>= 1
									if (place) {
										world.spawnBlock(wx + x, top - 1, wz + z, blockIds.leaves)
									}
								}
								else {
									world.spawnBlock(wx + x, top - 1, wz + z, blockIds.leaves)
								}
							}
						}
					}

					//3rd layer leaves
					for (let x = -1; x <= 1; x++) {
						for (let z = -1; z <= 1; z++) {
							if (x || z) {
								if (x & z) {
									place = rand & 1
									rand >>>= 1
									if (place) {
										world.spawnBlock(wx + x, top, wz + z, blockIds.leaves)
									}
								}
								else {
									world.spawnBlock(wx + x, top, wz + z, blockIds.leaves)
								}
							}
						}
					}

					//Top leaves
					world.spawnBlock(wx + 1, top + 1, wz, blockIds.leaves)
					world.spawnBlock(wx, top + 1, wz - 1, blockIds.leaves)
					world.spawnBlock(wx, top + 1, wz + 1, blockIds.leaves)
					world.spawnBlock(wx - 1, top + 1, wz, blockIds.leaves)
				}

				if (trees && random() < 0.005 && this.getBlock(i, ground, k) === blockIds.grass && ground > 75 && biome === 'jungle') {

					top = ground + floor(4.5 + random(2.5))
					rand = floor(random(4096))
					let tree = random() < 0.7 ? blockIds.jungleLog : ++top && blockIds.oakLog

					//Center
					for (let j = ground + 1; j <= top; j++) {
						this.setBlock(i, j, k, tree)
					}
					this.setBlock(i, top + 1, k, blockIds.leaves)
					this.setBlock(i, ground, k, blockIds.dirt)

					//Bottom leaves
					for (let x = -2; x <= 2; x++) {
						for (let z = -2; z <= 2; z++) {
							if (x || z) {
								if ((x * z & 7) === 4) {
									place = rand & 1
									rand >>>= 1
									if (place) {
										world.spawnBlock(wx + x, top - 2, wz + z, blockIds.leaves)
									}
								}
								else {
									world.spawnBlock(wx + x, top - 2, wz + z, blockIds.leaves)
								}
							}
						}
					}

					//2nd layer leaves
					for (let x = -2; x <= 2; x++) {
						for (let z = -2; z <= 2; z++) {
							if (x || z) {
								if ((x * z & 7) === 4) {
									place = rand & 1
									rand >>>= 1
									if (place) {
										world.spawnBlock(wx + x, top - 1, wz + z, blockIds.leaves)
									}
								}
								else {
									world.spawnBlock(wx + x, top - 1, wz + z, blockIds.leaves)
								}
							}
						}
					}

					//3rd layer leaves
					for (let x = -1; x <= 1; x++) {
						for (let z = -1; z <= 1; z++) {
							if (x || z) {
								if (x & z) {
									place = rand & 1
									rand >>>= 1
									if (place) {
										world.spawnBlock(wx + x, top, wz + z, blockIds.leaves)
									}
								}
								else {
									world.spawnBlock(wx + x, top, wz + z, blockIds.leaves)
								}
							}
						}
					}

					//Top leaves
					world.spawnBlock(wx + 1, top + 1, wz, blockIds.leaves)
					world.spawnBlock(wx, top + 1, wz - 1, blockIds.leaves)
					world.spawnBlock(wx, top + 1, wz + 1, blockIds.leaves)
					world.spawnBlock(wx - 1, top + 1, wz, blockIds.leaves)
				}

				// Blocks of each per chunk in Minecraft
				// Coal: 185.5
				// Iron: 111.5
				// Gold: 10.4
				// Redstone: 29.1
				// Diamond: 3.7
				// Lapis: 4.1
				ground -= 4

				if (random() < 3.7 / 256) {
					let y = random() * 16 | 0 + 1
					y = y < ground ? y : ground
					if (this.getBlock(i, y, k)===blockIds.stone) {
						this.setBlock(i, y < ground ? y : ground, k, blockIds.diamondOre)
					}
				}

				if (random() < 111.5 / 256) {
					let y = random() * 64 | 0 + 1
					y = y < ground ? y : ground
					if (this.getBlock(i, y, k)===blockIds.stone) {
						this.setBlock(i, y < ground ? y : ground, k, blockIds.ironOre)
					}
				}

				if (random() < 185.5 / 256) {
					let y = random() * ground | 0 + 1
					y = y < ground ? y : ground
					if (this.getBlock(i, y, k)===blockIds.stone) {
						this.setBlock(i, y < ground ? y : ground, k, blockIds.coalOre)
					}
				}

				if (random() < 10.4 / 256) {
					let y = random() * 32 | 0 + 1
					y = y < ground ? y : ground
					if (this.getBlock(i, y, k)===blockIds.stone) {
						this.setBlock(i, y < ground ? y : ground, k, blockIds.goldOre)
					}
				}

				if (random() < 29.1 / 256) {
					let y = random() * 16 | 0 + 1
					y = y < ground ? y : ground
					if (this.getBlock(i, y, k)===blockIds.stone) {
						this.setBlock(i, y < ground ? y : ground, k, blockIds.redstoneOre)
					}
				}

				if (random() < 4.1 / 256) {
					let y = random() * 32 | 0 + 1
					y = y < ground ? y : ground
					if (this.getBlock(i, y, k)===blockIds.stone) {
						this.setBlock(i, y < ground ? y : ground, k, blockIds.lapisOre)
					}
				}
			}
		}

		this.populated = true
	}
	genMesh(indexBuffer, bigArray) {
		const { glExtensions, gl, glCache } = this
		let barray = bigArray
		let index = 0
		for (let i = 0; i < this.sections.length; i++) {
			index = this.sections[i].genMesh(barray, index)
		}

		if (!this.buffer) {
			this.buffer = gl.createBuffer()
		}
		let data = barray.slice(0, index)

		let maxY = 0
		let minY = 255
		let y = 0
		for (let i = 1; i < data.length; i += 6) {
			y = data[i]
			maxY = max(maxY, y)
			minY = min(minY, y)
		}
		this.maxY = maxY
		this.minY = minY
		this.faces = data.length / 32
		glExtensions.vertex_array_object.bindVertexArrayOES(this.vao)
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
		gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
		gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW)
		gl.enableVertexAttribArray(glCache.aVertex)
		gl.enableVertexAttribArray(glCache.aTexture)
		gl.enableVertexAttribArray(glCache.aShadow)
		gl.enableVertexAttribArray(glCache.aSkylight)
		gl.enableVertexAttribArray(glCache.aBlocklight)
		gl.vertexAttribPointer(glCache.aVertex, 3, gl.FLOAT, false, 32, 0)
		gl.vertexAttribPointer(glCache.aTexture, 2, gl.FLOAT, false, 32, 12)
		gl.vertexAttribPointer(glCache.aShadow, 1, gl.FLOAT, false, 32, 20)
		gl.vertexAttribPointer(glCache.aSkylight, 1, gl.FLOAT, false, 32, 24)
		gl.vertexAttribPointer(glCache.aBlocklight, 1, gl.FLOAT, false, 32, 28)
		glExtensions.vertex_array_object.bindVertexArrayOES(null)
		this.lazy = false
	}
	tick() {
		if (this.edited) {
			for (let i = 0; i < this.sections.length; i++) {
				if (this.sections[i].edited) {
					this.sections[i].tick()
				}
			}
		}
	}
	load() {
		const { world } = this
		let chunkX = this.x >> 4
		let chunkZ = this.z >> 4
		let load = null

		for (let i = 0; i < world.loadFrom.length; i++) {
			load = world.loadFrom[i]
			if (load.x === chunkX && load.z === chunkZ) {
				let y = load.y * 16
				for (let j in load.blocks) {
					world.setBlock((j >> 8 & 15) + this.x, (j >> 4 & 15) + y, (j & 15) + this.z, load.blocks[j])
				}
				world.loadFrom.splice(i--, 1)
			}
		}
		this.loaded = true
	}
}

export { Chunk };