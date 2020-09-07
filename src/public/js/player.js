import * as THREE from './three.min.js'

export default class Player {

  // static attributes

  // static methods

  // instance attributes
  model = null
  moveUp = false
  moveDown = false
  moveForward = false
  moveLeft = false
  moveRight = false
  moveBackward = false
  canJump = false
  velocity = new THREE.Vector3()
  direction = new THREE.Vector3()

  // instance methods

  get isChangingX() {
    return this.moveLeft || this.moveRight
  }

  get isChangingY() {
    return this.moveUp || this.moveDown
  }
 
  get isChangingZ() {
    return this.moveForward || this.moveBackward
  }

  updateView(camera) {
    if(this.model == null) return
    
    this.model.position.set(camera.position.x + Math.sin(camera.rotation.y), camera.position.y - 1.25, camera.position.z - Math.cos(camera.rotation.z))
    this.model.rotation.set(0, camera.rotation.y, 0)

    const box = new THREE.Box3().setFromObject(this.model)
    const boxCenter = box.getCenter(new THREE.Vector3())
    const dx = boxCenter.x - camera.position.x
    const dz = boxCenter.z - camera.position.z
    
    this.model.position.x -= dx
    this.model.position.z -= dz
  }

  updateVelocity(delta) {
    this.velocity.x -= this.velocity.x * 10.0 * delta
    this.velocity.y -= this.velocity.y * 10.0 * delta
    this.velocity.z -= this.velocity.z * 10.0 * delta
    if(this.isChangingZ) this.velocity.z -= this.direction.z * 400.0 * delta
    if(this.isChangingY) this.velocity.y -= this.direction.y * 400.0 * delta
    if(this.isChangingX) this.velocity.x -= this.direction.x * 400.0 * delta
  }

  updateDirection() {
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft)
    this.direction.y = Number(this.moveUp) - Number(this.moveDown)
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward)
    this.direction.normalize()
  }

  update(camera, delta) {
    this.updateView(camera)
    this.updateVelocity(delta)
    this.updateDirection()
  }

}

