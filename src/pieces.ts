export class Vector {
  constructor(public x: number, public y: number) {}
  minus(other: Vector): Vector {
    return new Vector(this.x - other.x, this.y - other.y)
  }
  absMinus(other: Vector): Vector {
    return new Vector(Math.abs(this.x - other.x), Math.abs(this.y - other.y))
  }
  plus(other: Vector): Vector {
    return new Vector(this.x + other.x, this.y + other.y)
  }
  copy(): Vector {
    return new Vector(this.x, this.y)
  }
}

export interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface Board {
  pieces: Piece[]
}

export type Color = "WHITE" | "BLACK"

export abstract class PieceType {
  abstract whiteImage: HTMLImageElement
  abstract blackImage: HTMLImageElement
  /**
   * Determines whether a certain piece of this type can
   * move to a certain tile.
   *
   * @param piece The piece being moved.
   * @returns A list of legal moves for the piece
   */
   abstract moves(piece: Piece, board: Board, bounds: Bounds): Vector[]
   takes(piece: Piece, board: Board, bounds: Bounds): Vector[] {
     return this.moves(piece, board, bounds)
   }
}

export interface Piece {
  type: PieceType
  location: Vector
  color: Color
}

/**
 * A shorthand for grabbing images in the /public/images/ folder.
 */
function createImage(src: string) {
  let img = new Image()
  img.src = `/images/${src}.png`
  return img
}

// ------------------- PIECES ---------------------- //

export let king = new (class extends PieceType {
  whiteImage = createImage("wk")
  blackImage = createImage("bk")
  override moves = step(new Vector(1, 1), 1, false)
})()

export let bishop = new (class extends PieceType {
  whiteImage = createImage("wb")
  blackImage = createImage("bb")
  override moves = step(new Vector(1, 1))
})()

export let rook = new (class extends PieceType {
  whiteImage = createImage("wr")
  blackImage = createImage("br")
  override moves = step(new Vector(0, 1), Infinity, true)
})()

export let pawn = new (class extends PieceType {
  whiteImage = createImage("wp")
  blackImage = createImage("bp")
  override moves = (piece: Piece) => 
    piece.color === 'WHITE' 
      ? [piece.location.plus(new Vector(0,  1)), piece.location.plus(new Vector(0,  2))]
      : [piece.location.plus(new Vector(0, -1)), piece.location.plus(new Vector(0, -2))]
})()

export let knight = new (class extends PieceType {
  whiteImage = createImage("wn")
  blackImage = createImage("bn")
  override moves = step(new Vector(2, 1), 1, true)
})()

type Moves = (piece: Piece, board: Board, bounds: Bounds) => Vector[]

function combine(m1: Moves, m2: Moves): Moves {
  return (piece: Piece, board: Board, bounds: Bounds) => {
    return [...m1(piece, board, bounds), ...m2(piece, board, bounds)]
  }
}

export let queen = new (class extends PieceType {
  whiteImage = createImage("wq")
  blackImage = createImage("bq")
  override moves = combine(rook.moves, bishop.moves)
})()

function inBounds(bounds: Bounds, v: Vector) {
  return bounds.minX <= v.x && v.x <= bounds.maxX &&
         bounds.minY <= v.y && v.y <= bounds.maxY
}

/**
 * Create
 * 
 * @param d The absolute change in position per "step".
 * @param maxN The maximum number of steps; by default, there
 *          is no maximum. 
 */

function step(d: Vector, maxN: number = Infinity, symmetric: boolean = false): Moves {
  return (piece: Piece, _board: Board, bounds: Bounds) => {
    let moves: Vector[] = []
    function stepInOneDirection(sx: number, sy: number) {
      let n = 0;
      let newLocation = piece.location.plus(new Vector(d.x * sx, d.y * sy))
      // console.log(bounds, newLocation)
      while (n < maxN && inBounds(bounds, newLocation)) {
        moves.push(newLocation)
        newLocation = newLocation.plus(new Vector(d.x * sx, d.y * sy))
        n++
      }
    }
    stepInOneDirection(1, 1)
    stepInOneDirection(-1, 1)
    stepInOneDirection(1, -1)
    stepInOneDirection(-1, -1)
    if (symmetric) {
      // swap them and do it again.
      let tmp = d.x
      d.x = d.y
      d.y = tmp
      stepInOneDirection(1, 1)
      stepInOneDirection(-1, 1)
      stepInOneDirection(1, -1)
      stepInOneDirection(-1, -1)
    }
    // moves = moves.filter(doesNotCauseCheck) // ...eventually.
    return moves
  }
}