export const getRandomColor = () => {
  const r = getRandomInteger(0, 255)
  const g = getRandomInteger(0, 255)
  const b = getRandomInteger(0, 255)
  return `rgb(${r}, ${g}, ${b})`
}

export const equalVectors = (a, b) => {
  return a.x === b.x && a.y === b.y && a.z === b.z
}

export const getRandomInteger = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min
}

export const getAspectRatio = () => {
  return window.innerWidth / window.innerHeight
}