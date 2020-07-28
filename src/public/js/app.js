import './perlin.js'
import World from './world.js'
import Player from './player.js'
import * as THREE from './three.min.js'
import { GLTFLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/examples/jsm/loaders/GLTFLoader.js';
import { PointerLockControls } from './controls/PointerLockControls.min.js'
import { getAspectRatio, equalVectors, getRandomInteger } from './util.js'
import { KEYS, MODELS_PATH } from './constants.js'

// constants
const JS = Array.from(document.querySelectorAll('.js'))
const UI = Object.fromEntries(JS.map(val => [val.id, val]))

{
  // Preload textures
  const topTexture = new THREE.Texture(UI.grassTop)
  const sideTexture = new THREE.Texture(UI.grassSide)
  const bottomTexture = new THREE.Texture(UI.grassBottom)
  topTexture.needsUpdate = true
  sideTexture.needsUpdate = true
  bottomTexture.needsUpdate = true
  const topMaterial = new THREE.MeshPhongMaterial({ map: topTexture })
  const sideMaterial = new THREE.MeshPhongMaterial({ map: sideTexture })
  const bottomMaterial = new THREE.MeshPhongMaterial({ map: bottomTexture })
  var grassMaterial = [sideMaterial, sideMaterial, topMaterial, bottomMaterial, sideMaterial, sideMaterial]
}

// variables
let prevTime = performance.now()

// performance
const stats = new Stats()
stats.showPanel(0)
document.body.appendChild(stats.dom)
document.noise.seed(getRandomInteger(0, 100))

// create the Scene
const fov = 75
const aspect = getAspectRatio()
const near = 0.1
const far = 1000
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)
const player = new Player()
const scene = new THREE.Scene()
const world = new World(scene, grassMaterial)
const controls = new PointerLockControls(camera, document.body)
const raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, - 1, 0), 0, 10)
const renderer = new THREE.WebGLRenderer({})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)
scene.add(controls.getObject())
camera.position.set(0, 5, 0)

{
  // Add a point light
  const color = 0xffffbb
  const near = 0.8
  const far = 18
  const light = new THREE.PointLight(color, near, far)
  light.castShadow = true
  light.shadow.camera.near = near
  light.shadow.camera.far = far
  light.position.set(0, 10, 0)
  scene.add(light)
}

{
  // Add ambient light
  const color = 0x404040
  const intesity = 2.25
  const light = new THREE.AmbientLight(color, intesity)
  scene.add(light)
}

{
  // Add skybox to scene
  const imgs = [UI.nx, UI.px, UI.ny, UI.py, UI.nz, UI.pz]
  const skybox = new THREE.CubeTexture(imgs)
  skybox.needsUpdate = true
  scene.background = skybox
}

{
  // Add fog to scene
  const color = 0xffffff
  const near = 10
  const far = 100
  const fog = new THREE.Fog(color, near, far)
  scene.fog = fog
}

{
  // Load models
  const gltfLoader = new GLTFLoader()
  gltfLoader.setPath(MODELS_PATH)
  gltfLoader.load('steve.glb', (gltf) => {
    const root = gltf.scene
    const bbox = new THREE.Box3().setFromObject(root)
    const size = bbox.getSize(new THREE.Vector3())
    const maxAxis = Math.max(size.x, size.y, size.z)
    const head = root.children.filter(child => child.name === 'Head')[0]
    root.name = 'steve'
    root.castShadow = true
    root.receiveShadow = true
    root.scale.multiplyScalar(2.0 / maxAxis)
    const clone = root.clone()
    clone.position.y += 2
    scene.add(clone)
    head.visible = false
    scene.add(root)
    player.model = root
    player.update(camera, 0)
  })
}

const animate = () => {
  requestAnimationFrame(animate)

  stats.begin()

  if (controls.isLocked === true) {
    raycaster.ray.origin.copy(controls.getObject().position)

    const intersections = raycaster.intersectObjects(world.objects)
    const onObject = intersections.length > 0

    const time = performance.now()
    const delta = (time - prevTime) / 1000

    player.update(camera, delta)
    controls.moveRight(-player.velocity.x * delta)
    controls.moveForward(-player.velocity.z * delta)

    if (onObject) {
      const intersection = intersections[0]
      controls.getObject().position.y = intersection.point.y + 2
    }

    world.generateNeighboringChunks(camera)

    prevTime = time

  }

  renderer.render(scene, camera)
  stats.end()

}

function onControlStateChange() {
  if (controls.isLocked === false) {
    controls.lock()
    UI.Menu.classList.remove('visible')
  }
  if (controls.isLocked === true) {
    controls.unlock()
    UI.Menu.classList.add('visible')
  }
}

window.addEventListener('click', onControlStateChange)

window.addEventListener('resize', event => {
  camera.aspect = getAspectRatio()
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

document.addEventListener('keyup', async (event) => {
  if (event.keyCode === KEYS.UP) (player.moveForward = false)
  if (event.keyCode === KEYS.LEFT) (player.moveLeft = false)
  if (event.keyCode === KEYS.RIGHT) (player.moveRight = false)
  if (event.keyCode === KEYS.DOWN) (player.moveBackward = false)
  if (event.keyCode === KEYS.SPACE) (player.moveUp = false)
})

document.addEventListener('keydown', (event) => {
  if (event.keyCode === KEYS.UP) (player.moveForward = true)
  if (event.keyCode === KEYS.LEFT) (player.moveLeft = true)
  if (event.keyCode === KEYS.RIGHT) (player.moveRight = true)
  if (event.keyCode === KEYS.DOWN) (player.moveBackward = true)
  if (event.keyCode === KEYS.SPACE) (player.moveUp = true)
  if (event.keyCode === KEYS.ESC) (onControlStateChange())
})

document.addEventListener('keypress', event => {
  world.updateCurrentChunk(camera)
})

animate()

