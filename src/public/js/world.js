import * as THREE from './three.min.js'
import { CHUNK_SIZE, HALF_CHUNK_SIZE } from './constants.js'

export default class World {

  // static properties
  static MAX_CHUNKS = 100

  // static methods

  // instances attributes
  chunks = {}
  objects = []
  lastChunk = new THREE.Vector3(500, 0, 500)
  currentChunk = new THREE.Vector3(500, 0, 500)

  // instance methods

  constructor(scene, ...args) {
    this.scene = scene
    this.materials = args
    this.chunks.size = 0
    this.generateChunk(this.currentChunk)
  }

  addChunk(chunk) {
    if(chunk == null) return
    if(chunk.name == null) return
    if(this.chunks[chunk.name] != null) return
    if(this.chunks.size < World.MAX_CHUNKS) {
      this.chunks.size++
      this.chunks[chunk.name] = chunk
      this.scene.add(chunk)
      this.objects.push(chunk)
    }
  }

  removeChunk(name) {
    if(!Object.hasOwnProperty(name)) return
    const chunk = this.chunks[name]
    this.objects.splice(this.objects.indexOf(chunk), 1)
    this.chunks.size--
    delete this.chunks[name]
  }

  getChunkName(position) {
    const { x, y, z } = position
    return `${x}/${y}/${z}`
  }

  getChunkPosition(camera) {
    const position = camera.position
    const currChunkX = Math.floor((position.x / CHUNK_SIZE)) + 500
    const currChunkZ = Math.floor((position.z / CHUNK_SIZE)) + 500
    return new THREE.Vector3(currChunkX, 0, currChunkZ)
  }

  updateCurrentChunk(camera) {
    const chunk = this.getChunkPosition(camera)
    if (chunk !== this.currentChunk) {
      this.lastChunk = this.currentChunk
      this.currentChunk = chunk
    }
  }

  generateChunk(position) {

    const sx = ((position.x - 500) * CHUNK_SIZE) - HALF_CHUNK_SIZE
    const sy = ((position.z - 500) * CHUNK_SIZE) - HALF_CHUNK_SIZE
    const ex = sx + CHUNK_SIZE
    const ey = sy + CHUNK_SIZE
    const geometry = new THREE.Geometry()

    for (let row = sy; row < ey; row++) {
      for (let col = sx; col < ex; col++) {
        const height = Math.round(document.noise.simplex2(col / 100, row / 100) * 10)
        const cube = new THREE.Mesh(new THREE.BoxGeometry())
        cube.castShadow = true
        cube.recieveShadow = true
        cube.position.set(col, height, row)
        cube.updateMatrix()
        geometry.merge(cube.geometry, cube.matrix)
      }
    }

    const chunkName = this.getChunkName(position)
    const chunk = new THREE.Mesh(geometry, this.materials[0])
    chunk.name = chunkName

    this.addChunk(chunk)

    return chunk

  }

  generateNeighboringChunks(camera) {
    const currentChunkPosition = this.getChunkPosition(camera)
    const currentChunkName = this.getChunkName(currentChunkPosition)
    const chunkNames = [currentChunkName]

    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const neighborChunk = new THREE.Vector3(this.currentChunk.x + dx, 0, this.currentChunk.z + dz)
        const neighborChunkName = this.getChunkName(neighborChunk)
        chunkNames.push(neighborChunkName)
        if (this.scene.getObjectByName(neighborChunkName) == null) {
          const preRenderedChunk = this.chunks[neighborChunkName]
          preRenderedChunk == null ? this.generateChunk(neighborChunk) : this.scene.add(preRenderedChunk)
        }
      }
    }

    this.removeUneccesaryChunks(chunkNames)
  }

  removeUneccesaryChunks(names) {
    for (let i = this.scene.children.length - 1; i >= 0; i--) {
      if (this.scene.children[i].type === "Mesh") {
        if (!names.includes(this.scene.children[i].name)) {
          this.scene.remove(this.scene.children[i])
        }
      }
    }
  }

}