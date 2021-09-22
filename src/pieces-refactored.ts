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
}

export type Color = "WHITE" | "BLACK"

/* IMPROVE: Generate valid moves dynamically, regenerate
   them on zoom or pan using debounce. For now, `moves`
   simply determines if a given move is legal. */

export abstract class PieceType {
  abstract whiteImage: HTMLImageElement
  abstract blackImage: HTMLImageElement
  /**
   * Determines whether a certain piece of this type can
   * move to a certain tile.
   *
   * @param piece The piece being moved.
   * @param to The tile that it may or may not move to.
   * @returns Whether `piece` may move to the tile `to`.
   */
  abstract moves(piece: Piece, to: Vector): boolean
  takes(piece: Piece, to: Vector): boolean {
    return this.moves(piece, to)
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
  override moves(piece: Piece, to: Vector): boolean {
    let diff = piece.location.absMinus(to)
    return (
      Math.abs(diff.x) <= 1 && Math.abs(diff.y) <= 1 && Math.abs(diff.y) <= 1
    )
  }
})()

export let bishop = new (class extends PieceType {
  whiteImage = createImage("wb")
  blackImage = createImage("bb")
  override moves(piece: Piece, to: Vector): boolean {
    let diff = piece.location.absMinus(to)
    return diff.x === diff.y
  }
})()

export let rook = new (class extends PieceType {
  whiteImage = createImage("wr")
  blackImage = createImage("br")
  override moves(piece: Piece, to: Vector): boolean {
    let diff = piece.location.minus(to)
    return diff.x === 0 || diff.y === 0
  }
})()

export let pawn = new (class extends PieceType {
  whiteImage = createImage("wp")
  blackImage = createImage("bp")
  override moves(piece: Piece, to: Vector): boolean {
    let diff = piece.location.minus(to)
    return (
      diff.x === 0 &&
      (piece.color === "WHITE"
        ? diff.y === 1 || diff.y === 2
        : diff.y === -1 || diff.y === -2)
    )
  }
})()

export let knight = new (class extends PieceType {
  whiteImage = createImage("wn")
  blackImage = createImage("bn")
  override moves(piece: Piece, to: Vector): boolean {
    let diff = piece.location.absMinus(to)
    return (diff.x === 2 && diff.y === 1) || (diff.x === 1 && diff.y === 2)
  }
})()

type Moves = (piece: Piece, to: Vector) => boolean

function combine(m1: Moves, m2: Moves): Moves {
  return (piece: Piece, to: Vector) => {
    return m1(piece, to) || m2(piece, to)
  }
}

export let queen = new (class extends PieceType {
  whiteImage = createImage("wq")
  blackImage = createImage("bq")
  override moves = combine(rook.moves, bishop.moves)
})()

interface Bounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

// /**
//  * Create
//  * 
//  * @param d The absolute change in position per "step".
//  * @param n The maximum number of steps; by default, there
//  *          is no maximum. 
//  */
// function step(d: Vector, n: number = Infinity, symmetric: number = false): Moves {
//   return (piece: Piece, to: Vector) => {
//     return false;
//   }
// }
