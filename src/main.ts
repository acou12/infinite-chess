import "./style.css"
import {
  Piece,
  Vector,
  king,
  queen,
  bishop,
  knight,
  pawn,
  rook,
  Bounds,
} from "./pieces"

const canvas = document.querySelector("canvas")!
const ctx = canvas.getContext("2d")!

let img = new Image()
img.src = "/images/wk.png"

/**
 * CONSIDERATION: In order to do minmax stuff (which I'd look to do at some point),
 * it will be necessary to implement the game logic based on any arbitrary board state,
 * not just the current board state. It might be best to move all chess logic into a
 * seperate file with an abstract `Game` class (with a copy constructor) and just import
 * that for both the AI logic and the actual UI logic.
 */

let pieces: Piece[] = [
  { color: "WHITE", location: new Vector(0, 0), type: rook },
  { color: "WHITE", location: new Vector(1, 0), type: knight },
  { color: "WHITE", location: new Vector(2, 0), type: bishop },
  { color: "WHITE", location: new Vector(3, 0), type: king },
  { color: "WHITE", location: new Vector(4, 0), type: queen },
  { color: "WHITE", location: new Vector(5, 0), type: bishop },
  { color: "WHITE", location: new Vector(6, 0), type: knight },
  { color: "WHITE", location: new Vector(7, 0), type: rook },

  { color: "WHITE", location: new Vector(0, 1), type: pawn },
  { color: "WHITE", location: new Vector(1, 1), type: pawn },
  { color: "WHITE", location: new Vector(2, 1), type: pawn },
  { color: "WHITE", location: new Vector(3, 1), type: pawn },
  { color: "WHITE", location: new Vector(4, 1), type: pawn },
  { color: "WHITE", location: new Vector(5, 1), type: pawn },
  { color: "WHITE", location: new Vector(6, 1), type: pawn },
  { color: "WHITE", location: new Vector(7, 1), type: pawn },

  { color: "BLACK", location: new Vector(0, 7), type: rook },
  { color: "BLACK", location: new Vector(1, 7), type: knight },
  { color: "BLACK", location: new Vector(2, 7), type: bishop },
  { color: "BLACK", location: new Vector(3, 7), type: king },
  { color: "BLACK", location: new Vector(4, 7), type: queen },
  { color: "BLACK", location: new Vector(5, 7), type: bishop },
  { color: "BLACK", location: new Vector(6, 7), type: knight },
  { color: "BLACK", location: new Vector(7, 7), type: rook },

  { color: "BLACK", location: new Vector(0, 6), type: pawn },
  { color: "BLACK", location: new Vector(1, 6), type: pawn },
  { color: "BLACK", location: new Vector(2, 6), type: pawn },
  { color: "BLACK", location: new Vector(3, 6), type: pawn },
  { color: "BLACK", location: new Vector(4, 6), type: pawn },
  { color: "BLACK", location: new Vector(5, 6), type: pawn },
  { color: "BLACK", location: new Vector(6, 6), type: pawn },
  { color: "BLACK", location: new Vector(7, 6), type: pawn },
]

let board = {
  pieces: pieces
}

let offsetX = 0
let offsetY = 0
let scale = 1

function transformX(x: number) {
  return x * scale + offsetX
}

function transformY(y: number) {
  return y * scale + offsetY
}

function matchScale(n: number) {
  return n * scale
}

function invTransformX(x: number) {
  return (x - offsetX) / scale
}

function invTransformY(y: number) {
  return (y - offsetY) / scale
}

function tileAt(x: number, y: number) {
  return new Vector(
    Math.floor(invTransformX(x) / tileSize),
    Math.floor(invTransformY(y) / tileSize)
  )
}

function pieceAt(x: number, y: number): Piece | undefined {
  let tile = tileAt(x, y)
  return pieces.find((p) => p.location.x === tile.x && p.location.y === tile.y)
}

function pieceAtTile(tile: Vector): Piece | undefined {
  return pieces.find((p) => p.location.x === tile.x && p.location.y === tile.y)
}

const tileSize = 100

let bounds: Bounds = {
  minX: 0,
  maxX: 100,
  minY: 0,
  maxY: 100
}

function draw() {
  requestAnimationFrame(draw)
  canvas.width = canvas.clientWidth
  canvas.height = canvas.clientHeight

  ctx.fillStyle = "#34007a"
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  bounds = {
    minX: Math.floor((0 - offsetX) / tileSize / scale),
    minY: Math.floor((0 - offsetY) / tileSize / scale),
    maxX: (canvas.width - offsetX) / tileSize / scale,
    maxY: (canvas.height - offsetY) / tileSize / scale,
  }

  for (let x = bounds.minX; x < bounds.maxX; x++) {
    for (let y = bounds.minY; y < bounds.maxY; y++) {
      if ((x + y) % 2 == 0) {
        ctx.fillStyle = "#7448b0"
        ctx.fillRect(
          transformX(x * tileSize),
          transformY(y * tileSize),
          matchScale(tileSize),
          matchScale(tileSize)
        )
      }
      if (pickedUp && pickedUpLegalMove(new Vector(x, y))) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
        ctx.beginPath()
        ctx.ellipse(
          transformX(x * tileSize + tileSize / 2),
          transformY(y * tileSize + tileSize / 2),
          matchScale(20),
          matchScale(20),
          0,
          0,
          Math.PI * 2
        )
        ctx.fill()
      }
    }
  }

  for (let piece of pieces) {
    if (!(pickedUp && piece == pickedUp))
      ctx.drawImage(
        piece.color === "WHITE" ? piece.type.whiteImage : piece.type.blackImage,
        transformX(piece.location.x * tileSize),
        transformY(piece.location.y * tileSize),
        matchScale(tileSize),
        matchScale(tileSize)
      )
  }

  if (pickedUp) {
    ctx.drawImage(
      pickedUp.color === "WHITE"
        ? pickedUp.type.whiteImage
        : pickedUp.type.blackImage,
      mousePos.x - matchScale(tileSize / 2),
      mousePos.y - matchScale(tileSize / 2),
      matchScale(tileSize),
      matchScale(tileSize)
    )
  }

  if (movingBoard) {
    offsetX += mousePos.x - mousePosPrevious.x
    offsetY += mousePos.y - mousePosPrevious.y
  }
  mousePosPrevious = {
    ...mousePos,
  }
}

interface Point {
  x: number
  y: number
}

let movingBoard = false
let mousePos: Point = {
  x: 0,
  y: 0,
}
let mousePosPrevious: Point = {
  x: 0,
  y: 0,
}

document.addEventListener("mousemove", (e) => {
  mousePos = {
    x: e.clientX,
    y: e.clientY,
  }
})

let pickedUp: Piece | undefined = undefined
let pickedUpMoves: Vector[] = []
let pickedUpTakes: Vector[] = []

document.addEventListener("mousedown", () => {
  let piece = pieceAt(mousePos.x, mousePos.y)
  if (piece) {
    pickedUp = piece
    pickedUpMoves = pickedUp.type.moves(pickedUp, board, bounds)
    pickedUpTakes = pickedUp.type.takes(pickedUp, board, bounds)
  } else {
    movingBoard = true
  }

})

function matchingVector(list: Array<Vector>, v: Vector) {
  return list.find(it => it.x === v.x && it.y === v.y)
}

function pickedUpLegalMove(tile: Vector) {
  if (!pickedUp) return false
  let otherPiece = pieceAtTile(tile)
  return otherPiece ? (matchingVector(pickedUpTakes, tile) && !(pickedUp === otherPiece) &&
  !(pickedUp.color === otherPiece.color)) : matchingVector(pickedUpMoves, tile)
}

/**
 * @returns Whether it is legal for `piece` to move to `tile`.
 * 
 * 
 */
function legalMove(piece: Piece, tile: Vector) {
  // return false
  let otherPiece = pieceAtTile(tile)
  return otherPiece
    ? piece.type.takes(piece, board, bounds).find(other => other.x === tile.x && other.y === tile.y) &&
        !(piece === otherPiece) &&
        !(piece.color === otherPiece.color)
    : piece.type.moves(piece, board, bounds).find(other => other.x === tile.x && other.y === tile.y)
}

/**
 * Move a certain piece to a tile, capturing if necessary.
 * For performance reasons, this method does not check move
 * validity; use `legalMove` to do that.
 */
function movePiece(piece: Piece, tile: Vector) {
  let otherPiece = pieceAtTile(tile)
  if (otherPiece) pieces = pieces.filter((o) => o !== otherPiece)
  piece.location.x = tile.x
  piece.location.y = tile.y
}

document.addEventListener("mouseup", () => {
  movingBoard = false
  if (pickedUp) {
    let tile = tileAt(mousePos.x, mousePos.y)
    if (pickedUpLegalMove(tile)) movePiece(pickedUp, tile)
    pickedUp = undefined
  }
})

const scrollFactor = 0.07
const maxScale = 5
const minScale = 1 / 5

document.addEventListener("wheel", (e) => {
  let n = e.deltaY > 0 ? -scrollFactor : scrollFactor
  let newScale = scale * (1 + n)
  if (minScale < newScale && newScale < maxScale) {
    scale *= 1 + n
    offsetX -= (mousePos.x - offsetX) * n
    offsetY -= (mousePos.y - offsetY) * n
  }
})

canvas.addEventListener("contextmenu", (e) => e.preventDefault())

draw()
