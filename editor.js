
var realBoardOffset
var shownBoardOffset
var dragBegin

function pieceAt(x, y) {
  for (var i = 0; i < pieces.length; i++) {
    if (pieces[i].x == x && pieces[i].y == y) return pieces[i]
  }
}

function pieceAtReal(x, y) {
  return pieceAt(realXToBoard(x), realYToBoard(y))
}

function realXToBoard(x) {
  return Math.floor((x - realBoardOffset.x) / (tileSize * shownScale))
}

function realYToBoard(y) {
  return -Math.floor((y - realBoardOffset.y) / (tileSize * shownScale))
}

var bp
var wp
var br
var wr
var bn
var wn
var bb
var wb
var bq
var wq
var bk
var wk
var bh
var wh
var bc
var wb
var bg
var wg
var bp
var wp

function combinePowers(list) {
  return function(x1, y1, x2, y2, color) {
    for (var i = 0; i < list.length; i++) {
      if (list[i](x1, y1, x2, y2, color)) return true
    }
    return false
  }
}

templates = []

function createTemplate(id, name, image, moves, color) {
  var image = loadImage("images/" + image + ".png")
  var a = {
    id: id,
    name: name,
    image: image,
    moves: moves,
    takes: moves,
    done: () => {},
    color: color
  }
  templates.push(a)
  return a
}


function createTemplateSpecial(id, name, image, moves, takes, done, color) {
  var a = {
    id: id,
    name: name,
    image: loadImage("images/" + image + ".png"),
    moves: moves,
    takes: takes,
    done: done,
    color: color
  }
  templates.push(a)
  return a
}

const WHITE = 1
const BLACK = -1

function vacant(x, y) {
  for (var i = 0; i < pieces.length; i++) {
    if (pieces[i].x === x && pieces[i].y === y) return false
  }
  return true
}

function blocking(x, y, color) {
  for (var i = 0; i < pieces.length; i++) {
    if ((pieces[i].p === ww || pieces[i].p === bw) && pieces[i].p.color === color && abs(pieces[i].x - x) <= 1 && abs(pieces[i].y - y) <= 1) return false
  }
  for (var i = 0; i < pieces.length; i++) {
    if (pieces[i].x === x && pieces[i].y === y) {
      return true
    }
  }
  return false
}

var mobile = false

if(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
  mobile = true
}

function preload() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioContext();
  if (!mobile) {
    move = new Audio("sounds/Move.mp3")
    take = new Audio("sounds/Capture.mp3")
  }
  pawn = function(x1, y1, x2, y2, color, piece) {
    return ((y2 - y1) * color === 2 && piece.state['dj'] === 1 || (y2 - y1) * color === 1) && x1 - x2 == 0 && vacant(x1, y1 + 1 * color)
  }
  pawn_takes = function(x1, y1, x2, y2, color, piece) {
    return (y2 - y1) * color === 1 && abs(x1 - x2) == 1
  }
  pawn_done = function(x1, y1, x2, y2, color, piece) {
    piece.state['dj'] = 0
    if (color === WHITE && y2 >= 8) piece.p = wq
    else if (color === BLACK && y2 <= 1) piece.p = bq
  }
  rook = function(x1, y1, x2, y2, color, piece) {
    if (!(x1 === x2 || y1 === y2)) return false
    var stepX = x1 === x2 ? 0 : x1 < x2 ? 1 : -1
    var stepY = y1 === y2 ? 0 : y1 < y2 ? 1 : -1
    var iterations = max(abs(x2 - x1), abs(y2 - y1))
    for (var i = 1; i < iterations; i++) {
      if (blocking(x1 + stepX * i, y1 + stepY * i, color)) return false
    }
    return true
  }
  knight = function(x1, y1, x2, y2, color, piece) {
    return abs(x1 - x2) == 2 && abs(y1 - y2) == 1 ||
           abs(x1 - x2) == 1 && abs(y1 - y2) == 2
  }
  bishop = function(x1, y1, x2, y2, color, piece) {
    if (!(abs(x1 - x2) == abs(y1 - y2))) return false
    var stepX = x1 < x2 ? 1 : -1
    var stepY = y1 < y2 ? 1 : -1
    var iterations = abs(x2 - x1)
    for (var i = 1; i < iterations; i++) {
      if (blocking(x1 + stepX * i, y1 + stepY * i, color)) return false
    }
    return true
  }
  queen = combinePowers([rook, bishop])
  king = function(x1, y1, x2, y2, color, piece) {
    return abs(x1 - x2) <= 1 && abs(y1 - y2) <= 1
  }
  guard = king
  hawk = function(x1, y1, x2, y2, color, piece) {
    return (abs(x1 - x2) === abs(y1 - y2) && (abs(x1 - x2) === 2 || abs(x1 - x2) === 3))
    || (x1 === x2 && (abs(y2 - y1) === 2 || abs(y2 - y1) === 3))
    || (y1 === y2 && (abs(x2 - x1) === 2 || abs(x2 - x1) === 3))
  }
  amazon = combinePowers([queen, knight])
  chancellor = combinePowers([rook, knight])
  princess = combinePowers([bishop, knight])
  rose_pairs = [[1,2], [3,3], [5,2], [4, 0], [4, 4], [6,0]]
  rose = function(x1, y1, x2, y2, color, piece) {
    var dx = abs(x1 - x2)
    var dy = abs(y1 - y2)
    for (var i = 0; i < rose_pairs.length; i++) {
      if (dx === rose_pairs[i][0] && dy === rose_pairs[i][1]
      ||  dx === rose_pairs[i][1] && dy === rose_pairs[i][0]) return true
    }
    return false
  }
  witch = function(x1, y1, x2, y2, color, piece) {
    if ((abs(x1 - x2) === abs(y1 - y2) && (abs(x1 - x2) === 2))
    || (x1 === x2 && abs(y1 - y2) === 2)
    || (y1 === y2 && abs(x1 - x2) === 2)) return true
    if (knight(x1, y1, x2, y2, color, piece)) return true
    var valid = false
    if ((abs(x1 - x2) == abs(y1 - y2))) {
      valid = true
      var stepX = x1 < x2 ? 1 : -1
      var stepY = y1 < y2 ? 1 : -1
      var iterations = abs(x2 - x1)
      for (var i = 1; i < iterations; i++) {
        if (!vacant(x1 + stepX * i, y1 + stepY * i)) {
          valid = false
          break
        }
      }
    }
    if ((x1 === x2 || y1 === y2)) {
      valid = true
      var stepX = x1 === x2 ? 0 : x1 < x2 ? 1 : -1
      var stepY = y1 === y2 ? 0 : y1 < y2 ? 1 : -1
      var iterations = max(abs(x2 - x1), abs(y2 - y1))
      for (var i = 1; i < iterations; i++) {
        if (!vacant(x1 + stepX * i, y1 + stepY * i)) {
          valid = false
          break
        }
      }
    }
    return valid
  }
  pegasus = combinePowers([hawk, knight])
  huygen = function(x1, y1, x2, y2, color, piece) {
    var max = width / (tileSize * shownScale) * 3
    for (var i = 2; i < primes.length; i++) {
      if (primes[i] > max) {
        break
      }
      if (x1 === x2 && abs(y1 - y2) === primes[i]) return true
      if (y1 === y2 && abs(x1 - x2) === primes[i]) return true
    }
    return false
  }
  superp = function(x1, y1, x2, y2, color, piece) {
    return sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2)) % 1 < 0.0001
  }
  wp = createTemplateSpecial(0, "", "wp", pawn, pawn_takes, pawn_done, WHITE)
  bp = createTemplateSpecial(1, "", "bp", pawn, pawn_takes, pawn_done, BLACK)
  wr = createTemplate(2, "R", "wr", rook, WHITE)
  br = createTemplate(3, "R", "br", rook, BLACK)
  wn = createTemplate(4, "N", "wn", knight, WHITE)
  bn = createTemplate(5, "N", "bn", knight, BLACK)
  wb = createTemplate(6, "B", "wb", bishop, WHITE)
  bb = createTemplate(7, "B", "bb", bishop, BLACK)
  wq = createTemplate(8, "Q", "wq", queen, WHITE)
  bq = createTemplate(9, "Q", "bq", queen, BLACK)
  wk = createTemplate(10, "K", "wk", king, WHITE)
  bk = createTemplate(11, "K", "bk", king, BLACK)
  wh = createTemplate(12, "H", "wh_new", hawk, WHITE)
  bh = createTemplate(13, "H", "bh_new", hawk, BLACK)
  wg = createTemplate(14, "G", "wg_new_new", guard, WHITE)
  bg = createTemplate(15, "G", "bg_new_new", guard, BLACK)
  wc = createTemplate(16, "C", "wc", chancellor, WHITE)
  bc = createTemplate(17, "C", "bc", chancellor, BLACK)
  wpr = createTemplate(18, "P", "wpr", princess, WHITE)
  bpr = createTemplate(19, "P", "bpr", princess, BLACK)
  wro = createTemplate(20, "R", "wro", rose, WHITE)
  bro = createTemplate(21, "R", "bro", rose, BLACK)
  ww = createTemplateSpecial(22, "W", "ww", witch, () => false, () => {}, WHITE)
  bw = createTemplateSpecial(23, "W", "bw", witch, () => false, () => {}, BLACK)
  wa = createTemplate(26, "A", "wa", amazon, WHITE)
  ba = createTemplate(27, "A", "ba", amazon, BLACK)
  whu = createTemplate(28, "H", "whu", huygen, WHITE)
  bhu = createTemplate(29, "H", "bhu", huygen, BLACK)
  // todo: add warning message for unsupported actions (eg taking a screenshot on a mobile device)
}

var primes = [2, 3, 5]

function rotatePieces(x, y, theta) {
  for (var i = 0; i < pieces.length; i++) {
    var p = pieces[i]
    var dx = p.x - x
    var dy = p.y - y
    var distance = dist(x, y, p.x, p.y)
    var angle = Math.atan2(dy, dx)
    angle += theta
    var nx = x + Math.cos(angle) * distance
    var ny = y + Math.sin(angle) * distance
    p.x = Math.floor(nx)
    p.y = Math.floor(ny)
    p.x = nx
    p.y = ny
  }
}

function generatePrimes() {
  top: for (var i = 7; i < 20000; i += 2/* primes are never even */) {
    for (var j = 0; j < primes.length; j++) {
      if (i % primes[j] === 0) continue top
    }
    primes.push(i)
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  realBoardOffset = createVector(0, 0)
  shownBoardOffset = createVector(0, 0)
  dragBegin = createVector(0, 0)

  generatePrimes()
  setup_pieces()
  initButtons()

  lastMoveFirst = createVector(0, 0)
  lastMoveLast = createVector(0, 0)
}

function setup_pieces() {
  superPawn = createPiece(-2, 1, wp)
  pieces.push(superPawn)
  pieces.push(createPiece(-1, 1, wr))
  pieces.push(createPiece(0, 1, wc))
  pieces.push(createPiece(1, 1, wg))
  pieces.push(createPiece(2, 1, wn))
  pieces.push(createPiece(3, 1, wb))
  pieces.push(createPiece(4, 1, wq))
  pieces.push(createPiece(5, 1, wk))
  pieces.push(createPiece(6, 1, wb))
  pieces.push(createPiece(7, 1, wn))
  pieces.push(createPiece(8, 1, wg))
  pieces.push(createPiece(9, 1, wc))
  pieces.push(createPiece(10, 1, wr))
  pieces.push(createPiece(11, 1, wp))

  pieces.push(createPiece(-4, -6, wp))
  pieces.push(createPiece(-3, -5, wp))
  pieces.push(createPiece(-2, -4, wp))
  pieces.push(createPiece(-1, -5, wp))
  pieces.push(createPiece(0, -6, wp))

  pieces.push(createPiece(-2, -6, wh))

  pieces.push(createPiece(9, -6, wp))
  pieces.push(createPiece(10, -5, wp))
  pieces.push(createPiece(11, -4, wp))
  pieces.push(createPiece(12, -5, wp))
  pieces.push(createPiece(13, -6, wp))

  pieces.push(createPiece(11, -6, wh))

  for (var i = -1; i < 11; i++) {
    pieces.push(createPiece(i, 2, wp))
  }

  pieces.push(createPiece(-2, 8, bp))
  pieces.push(createPiece(-1, 8, br))
  pieces.push(createPiece(0, 8, bc))
  pieces.push(createPiece(1, 8, bg))
  pieces.push(createPiece(2, 8, bn))
  pieces.push(createPiece(3, 8, bb))
  pieces.push(createPiece(4, 8, bq))
  pieces.push(createPiece(5, 8, bk))
  pieces.push(createPiece(6, 8, bb))
  pieces.push(createPiece(7, 8, bn))
  pieces.push(createPiece(8, 8, bg))
  pieces.push(createPiece(9, 8, bc))
  pieces.push(createPiece(10, 8, br))
  pieces.push(createPiece(11, 8, bp))

  pieces.push(createPiece(-4, 15, bp))
  pieces.push(createPiece(-3, 14, bp))
  pieces.push(createPiece(-2, 13, bp))
  pieces.push(createPiece(-1, 14, bp))
  pieces.push(createPiece(0, 15, bp))

  pieces.push(createPiece(-2, 15, bh))

  pieces.push(createPiece(9, 15, bp))
  pieces.push(createPiece(10, 14, bp))
  pieces.push(createPiece(11, 13, bp))
  pieces.push(createPiece(12, 14, bp))
  pieces.push(createPiece(13, 15, bp))

  pieces.push(createPiece(11, 15, bh))

  for (var i = -1; i < 11; i++) {
    pieces.push(createPiece(i, 7, bp))
  }

  var totalX = 0
  var totalY = 0

  for (var i = 0; i < pieces.length; i++) {
    totalX += pieces[i].x * tileSize * realScale + tileSize * realScale / 2
    totalY += pieces[i].y * tileSize * realScale - tileSize * realScale / 2
  }

  realBoardOffset.x = -totalX / pieces.length + width / 2
  realBoardOffset.y = totalY / pieces.length + height / 2
  shownBoardOffset.x = -totalX / pieces.length + width / 2
  shownBoardOffset.y = totalY / pieces.length + height / 2
  boards.push(pieces)
  moves.push(createMove(createVector(1, 1), createVector(1, 1)))
}

function center() {
  var totalX = 0
  var totalY = 0

  for (var i = 0; i < pieces.length; i++) {
    totalX += pieces[i].x * tileSize * realScale + tileSize * realScale / 2
    totalY += pieces[i].y * tileSize * realScale - tileSize * realScale / 2
  }

  realBoardOffset.x = -totalX / pieces.length + width / 2
  realBoardOffset.y = totalY / pieces.length + height / 2
}

var tileSize = 100;

function createPiece(x, y, p) {
  var state = {}
  if (p === wp || p === bp) {
    state['dj'] = 1
  }
  return {
    x: x,
    y: y,
    p: p,
    state: state
  }
}

function copyPieces(pieces) {
  newPieces = []
  for (var i = 0; i < pieces.length; i++) {
    newPieces.push(createPiece(pieces[i].x, pieces[i].y, pieces[i].p))
  }
  return newPieces
}

var pieces = []

var haveMoved = false
var lastMoveFirst
var lastMoveLast

var string = ""

var turn = WHITE

var warning = false
var lastWarning = 0
var warningText = ""
var warningIcon

var download
var cancel
var preview

function draw() {
  if (window.innerWidth != width || window.innerWidth != height) {
    resizeCanvas(window.innerWidth, window.innerHeight, false)
  }
  background(240, 217, 181)
  shownScale += (realScale - shownScale) * 0.3
  shownBoardOffset.x += (realBoardOffset.x - shownBoardOffset.x) * 0.3
  shownBoardOffset.y += (realBoardOffset.y - shownBoardOffset.y) * 0.3
  if (draggingBoard) {
    realBoardOffset.x = winMouseX - dragBegin.x;
    realBoardOffset.y = winMouseY - dragBegin.y;
  }
  for (var x = Math.floor(-shownBoardOffset.x / (tileSize * shownScale)); x < (width - shownBoardOffset.x) / (tileSize * shownScale) + 1; x++) {
    for (var y = Math.floor(-shownBoardOffset.y / (tileSize * shownScale)); y < (height - shownBoardOffset.y) / (tileSize * shownScale) + 1; y++) {
      if ((x + y) % 2 == 0) {
        fill(181, 136, 99);
        noStroke();
        rect(x * (tileSize * shownScale) + shownBoardOffset.x, y * (tileSize * shownScale) + shownBoardOffset.y, (tileSize * shownScale), (tileSize * shownScale));
      }
      if (!takingImage) {
        if (currentBoard > 0 && haveMoved && x === lastMoveLast.x && -y === lastMoveLast.y) {
          fill(0, 255, 26, 127);
          noStroke();
          rect(x * (tileSize * shownScale) + shownBoardOffset.x, y * (tileSize * shownScale) + shownBoardOffset.y, (tileSize * shownScale), (tileSize * shownScale));
        }
        if (currentBoard > 0 && haveMoved && x === lastMoveFirst.x && -y === lastMoveFirst.y) {
          fill(0, 255, 26, 127);
          noStroke();
          rect(x * (tileSize * shownScale) + shownBoardOffset.x, y * (tileSize * shownScale) + shownBoardOffset.y, (tileSize * shownScale), (tileSize * shownScale));
        }
      }
      if (blackInCheck && pieceAt(x, -y) != undefined && pieceAt(x, -y).p === bk) {
        fill(255, 100, 100)
        rect(x * (tileSize * shownScale) + shownBoardOffset.x, y * (tileSize * shownScale) + shownBoardOffset.y, (tileSize * shownScale), (tileSize * shownScale));
      }
      if (whiteInCheck && pieceAt(x, -y) != undefined && pieceAt(x, -y).p === wk) {
        fill(255, 100, 100)
        rect(x * (tileSize * shownScale) + shownBoardOffset.x, y * (tileSize * shownScale) + shownBoardOffset.y, (tileSize * shownScale), (tileSize * shownScale));
      }
      if (draggingPiece && !boardEditor) {
        thePieceAt = pieceAt(x, -y)
        canMove = draggedPiece.p.moves(draggedPiece.x, draggedPiece.y, x, -y, draggedPiece.p.color, draggedPiece) && thePieceAt == undefined
        canTake = draggedPiece.p.takes(draggedPiece.x, draggedPiece.y, x, -y, draggedPiece.p.color, draggedPiece) && thePieceAt != undefined && thePieceAt.p.color != draggedPiece.p.color
        if (canMove) {
          fill(0, 0, 0, 100)
          ellipse(x * (tileSize * shownScale) + shownBoardOffset.x + (tileSize * shownScale) / 2, y * (tileSize * shownScale) + shownBoardOffset.y + (tileSize * shownScale) / 2, (tileSize * shownScale) / 4, (tileSize * shownScale) / 4);
          fill(0, 0, 255)
        }
        if (canTake) {
          fill(0, 0, 0, 100)
          rect(x * (tileSize * shownScale) + shownBoardOffset.x, y * (tileSize * shownScale) + shownBoardOffset.y, (tileSize * shownScale), (tileSize * shownScale));
        }
      }
    }
  }
  for (var i = 0; i < pieces.length; i++) {
    if (draggingPiece && pieces[i] == draggedPiece) {
    } else {
      image(pieces[i].p.image, pieces[i].x * (tileSize * shownScale) + shownBoardOffset.x, -pieces[i].y * (tileSize * shownScale) + shownBoardOffset.y, (tileSize * shownScale), (tileSize * shownScale));
    }
  }
  strokeWeight(9 * shownScale)
  stroke(255)
  line(shownBoardOffset.x + -3 * (shownScale * tileSize), shownBoardOffset.y, shownBoardOffset.x + 13 * (shownScale * tileSize), shownBoardOffset.y)
  stroke(0)
  line(shownBoardOffset.x + -3 * (shownScale * tileSize), shownBoardOffset.y - 8 * (shownScale * tileSize), shownBoardOffset.x + 13 * (shownScale * tileSize), shownBoardOffset.y - 8 * (shownScale * tileSize))
  stroke(255, 127, 39)
  line(shownBoardOffset.x + 1 * (shownScale * tileSize), shownBoardOffset.y + 0 * (shownScale * tileSize), shownBoardOffset.x + 2 * (shownScale * tileSize), shownBoardOffset.y + 0 * (shownScale * tileSize))
  line(shownBoardOffset.x + 1 * (shownScale * tileSize), shownBoardOffset.y + 0 * (shownScale * tileSize), shownBoardOffset.x + 1 * (shownScale * tileSize), shownBoardOffset.y - 1 * (shownScale * tileSize))
  line(shownBoardOffset.x + 1 * (shownScale * tileSize), shownBoardOffset.y + -8 * (shownScale * tileSize), shownBoardOffset.x + 2 * (shownScale * tileSize), shownBoardOffset.y - 8 * (shownScale * tileSize))
  line(shownBoardOffset.x + 1 * (shownScale * tileSize), shownBoardOffset.y + -8 * (shownScale * tileSize), shownBoardOffset.x + 1 * (shownScale * tileSize), shownBoardOffset.y - 7 * (shownScale * tileSize))
  line(shownBoardOffset.x + 8 * (shownScale * tileSize), shownBoardOffset.y + 0 * (shownScale * tileSize), shownBoardOffset.x + 9 * (shownScale * tileSize), shownBoardOffset.y + 0 * (shownScale * tileSize))
  line(shownBoardOffset.x + 9 * (shownScale * tileSize), shownBoardOffset.y + 0 * (shownScale * tileSize), shownBoardOffset.x + 9 * (shownScale * tileSize), shownBoardOffset.y - 1 * (shownScale * tileSize))
  line(shownBoardOffset.x + 8 * (shownScale * tileSize), shownBoardOffset.y + -8 * (shownScale * tileSize), shownBoardOffset.x + 9 * (shownScale * tileSize), shownBoardOffset.y - 8 * (shownScale * tileSize))
  line(shownBoardOffset.x + 9 * (shownScale * tileSize), shownBoardOffset.y + -8 * (shownScale * tileSize), shownBoardOffset.x + 9 * (shownScale * tileSize), shownBoardOffset.y - 7 * (shownScale * tileSize))

  if (draggingPiece) image(draggedPiece.p.image, winMouseX - (tileSize * shownScale) / 2, winMouseY - (tileSize * shownScale) / 2, (tileSize * shownScale), (tileSize * shownScale));
  for (var i = 0; i < lines.length; i++) {
    strokeWeight(11 * shownScale)
    var theLine = lines[i]
    if (!theLine.c) {
      stroke(0, 102, 255)
    } else {
      stroke(230, 76, 76)
    }
    var sx = theLine.x1 * (tileSize * shownScale) + shownBoardOffset.x + (tileSize * shownScale) / 2
    var sy = -theLine.y1 * (tileSize * shownScale) + shownBoardOffset.y + (tileSize * shownScale) / 2
    var ex = theLine.x2 * (tileSize * shownScale) + shownBoardOffset.x + (tileSize * shownScale) / 2
    var ey = -theLine.y2 * (tileSize * shownScale) + shownBoardOffset.y + (tileSize * shownScale) / 2
    if (sx === ex && sy === ey) {
      noFill()
      ellipse(sx, sy, (tileSize * shownScale), (tileSize * shownScale))
    } else {
      line(sx, sy, ex, ey)
      angleMode(RADIANS)
      var angle = atan2(ey - sy, ex - sx)
      line(ex, ey, ex + (tileSize * shownScale) / 4 * cos(angle + PI + PI / 4), ey + (tileSize * shownScale) / 4 * sin(angle + PI + PI / 4))
      line(ex, ey, ex + (tileSize * shownScale) / 4 * cos(angle + PI - PI / 4), ey + (tileSize * shownScale) / 4 * sin(angle + PI - PI / 4))
    }
  }
  if (creatingLine) {
    if (!shiftPressed) {
      stroke(0, 102, 255, 200)
    } else {
      stroke(230, 76, 76, 200)
    }
    strokeWeight(13 * shownScale)
    var sx = lineStart.x * (tileSize * shownScale) + shownBoardOffset.x + (tileSize * shownScale) / 2
    var sy = -lineStart.y * (tileSize * shownScale) + shownBoardOffset.y + (tileSize * shownScale) / 2
    var ex = realXToBoard(winMouseX) * (tileSize * shownScale) + shownBoardOffset.x + (tileSize * shownScale) / 2
    var ey = -realYToBoard(winMouseY) * (tileSize * shownScale) + shownBoardOffset.y + (tileSize * shownScale) / 2
    if (sx === ex && sy === ey) {
      noFill()
      ellipse(sx, sy, (tileSize * shownScale), (tileSize * shownScale))
    } else {
      line(sx, sy, ex, ey)
      angleMode(RADIANS)
      var angle = atan2(ey - sy, ex - sx)
      line(ex, ey, ex + (tileSize * shownScale) / 4 * cos(angle + PI + PI / 4), ey + (tileSize * shownScale) / 4 * sin(angle + PI + PI / 4))
      line(ex, ey, ex + (tileSize * shownScale) / 4 * cos(angle + PI - PI / 4), ey + (tileSize * shownScale) / 4 * sin(angle + PI - PI / 4))
    }
  }
  var numberBarSize = 18
  fill(0)
  noStroke()
  rect(0, 0, numberBarSize * 2, height)
  rect(0, height - numberBarSize * 2, width, numberBarSize * 2)
  fill(255)
  textSize(24)
  textAlign(CENTER, CENTER)
  for (var x = Math.floor(-(shownBoardOffset.x) / (tileSize * shownScale)); x < ((width) - (shownBoardOffset.x)) / (tileSize * shownScale) + 1; x++) {
    if (x * (tileSize * shownScale) + shownBoardOffset.x > numberBarSize && x * (tileSize * shownScale) + shownBoardOffset.x + (tileSize * shownScale) < width) if (x % 5 === 0) text(x, x * (tileSize * shownScale) + shownBoardOffset.x + (tileSize * shownScale) / 2, height - numberBarSize)
  }
  textAlign(CENTER, CENTER)
  for (var y = Math.floor(-(shownBoardOffset.y) / (tileSize * shownScale)); y < ((height) - (shownBoardOffset.y)) / (tileSize * shownScale) + 1; y++) {
    if (y * (tileSize * shownScale) + shownBoardOffset.y > 0 && y * (tileSize * shownScale) + shownBoardOffset.y + (tileSize * shownScale) < height - numberBarSize) if (y % 5 === 0) text(-y, numberBarSize, y * (tileSize * shownScale) + shownBoardOffset.y + (tileSize * shownScale) / 2)
  }

  if (!mobileZooming && touches.length >= 2) {
    distInit = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y)
    scaleInit = realScale
    midInit = createVector((touches[0].x + touches[1].x) / 2, (touches[0].y + touches[1].y) / 2)
    boardInit = createVector(realBoardOffset.x, realBoardOffset.y)
    mobileZooming = true
    draggingBoard = false
    draggingPiece = false
  }
  if (mobileZooming) {
    if (touches.length < 2) {
      mobileZooming = false
      if (touches.length === 1) {
        draggingBoard = true;
        dragBegin.x = winMouseX - realBoardOffset.x;
        dragBegin.y = winMouseY - realBoardOffset.y;
      }
    } else {
      var midFinal = createVector((touches[0].x + touches[1].x) / 2, (touches[0].y + touches[1].y) / 2)
      var distFinal = dist(touches[0].x, touches[0].y, touches[1].x, touches[1].y)
      realBoardOffset.x = boardInit.x + (midFinal.x - midInit.x)
      realBoardOffset.y = boardInit.y + (midFinal.y - midInit.y)
      var scaleFactor = (distFinal / distInit)
      realScale = scaleInit * scaleFactor
      realBoardOffset.x -= (midFinal.x - realBoardOffset.x) * (scaleFactor - 1);
      realBoardOffset.y -= (midFinal.y - realBoardOffset.y) * (scaleFactor - 1);
    }
  }
  if (!takingImage) drawButtons()
  if (boardEditor) {
    drawBox()
  }
  if (addingPieces) {
    if (pieceAt(realXToBoard(winMouseX), realYToBoard(winMouseY)) === undefined) {
      pieces.push(createPiece(realXToBoard(winMouseX), realYToBoard(winMouseY), templates[pieceSelected]))
      checkIfInCheck()
    }
  }
  if (otherMenu) {
    drawOtherMenu()
  }
  if (takingImage) {
    fill(0, 0, 0, 127)
    noStroke()
    rect(0, 0, width, captureY1)
    rect(0, captureY2, width, height - captureY2)
    rect(0, captureY1, captureX1, captureY2 - captureY1)
    rect(captureX2, captureY1, width - captureX2, captureY2 - captureY1)
    if (draggingCorner) {
      if (corner === 0) {
        captureX1 = winMouseX
        captureY1 = winMouseY
      }
      if (corner === 1) {
        captureX2 = winMouseX
        captureY1 = winMouseY
      }
      if (corner === 2) {
        captureX1 = winMouseX
        captureY2 = winMouseY
      }
      if (corner === 3) {
        captureX2 = winMouseX
        captureY2 = winMouseY
      }
    }
    fill(0)
    noStroke()
    rect(margin / 2, margin / 2, size, size)
    image(download, margin / 2 + size * 0.1, margin / 2 + size * 0.1, size * 0.8, size * 0.8)
    rect(margin / 2, margin / 2 + (size + margin), size, size)
    image(cancel, margin / 2 + size * 0.1, margin / 2 + (size + margin) + size * 0.1, size * 0.8, size * 0.8)
  }
}

var numPiecesPerRow = 4

var pieceSelected = undefined
// 0 move
// 1 piece
// 2 delete
var modeSelected = undefined
var modeButtons = []

function outline(num) {
  for (var t = 0; t < templates.length; t++) {
    var template = templates[t]
    if (template.color != BLACK) continue
    var img = template.image
    img.loadPixels()
    for (var n = 0; n < num; n++) {
      var chosen = []
      for (var i = 0; i < img.pixels.length; i++) {
        if (i % 4 === 3 && img.pixels[i] < 255 && (
          i + 4 < img.pixels.length                && img.pixels[i + 4] > 0
          || i - 4 >= 0                            && img.pixels[i - 4] > 0
          || i - img.width * 4 + 4 > 0                 && img.pixels[i - img.width * 4 + 4] > 0
          || i + img.width * 4 + 4 < img.pixels.length && img.pixels[i + img.width * 4 + 4] > 0
          || i - img.width * 4 - 4 > 0                 && img.pixels[i - img.width * 4 - 4] > 0
          || i + img.width * 4 - 4 < img.pixels.length && img.pixels[i + img.width * 4 - 4] > 0
        )) chosen.push(i)
      }
      for (var i = 0; i < chosen.length; i++) {
        img.pixels[chosen[i]] = 255
        img.pixels[chosen[i] - 1] = 255
        img.pixels[chosen[i] - 2] = 255
        img.pixels[chosen[i] - 3] = 255
      }
    }
    img.updatePixels()
  }
}

function drawBox() {
  fill(0)
  noStroke()
  var boxWidth = (4 * (margin + size)) - margin
  var boxHeight = height - margin * 3 / 2 - size
  rect(width - boxWidth - margin/2, margin + size, boxWidth, boxHeight, 10, 10)
  var boxMargin = (boxWidth - size * numPiecesPerRow) / (numPiecesPerRow + 1)
  for (var i = 0; i < modeButtons.length; i++) {
    x = (width - boxWidth - margin/2) + boxMargin + (i % numPiecesPerRow) * (size + boxMargin)
    y = (margin + size) + boxMargin + (Math.floor(i / numPiecesPerRow)) * (size + boxMargin)
    fill(70)
    if (x < winMouseX && winMouseX < x + size && y < winMouseY && winMouseY < y + size) {
      fill(55)
    }
    if (modeSelected === i) fill(80, 110, 150)
    noStroke()
    rect(x, y, size, size, 10, 10)
    image(modeButtons[i].image, x + size * 0.1, y + size * 0.1, size * 0.8, size * 0.8)
  }
  for (var i = 0; i < templates.length; i++) {
    x = (width - boxWidth - margin/2) + boxMargin + (i % numPiecesPerRow) * (size + boxMargin)
    y = (margin + size) + boxMargin + (Math.floor(i / numPiecesPerRow) + 1) * (size + boxMargin)
    fill(70)
    if (x < winMouseX && winMouseX < x + size && y < winMouseY && winMouseY < y + size) {
      fill(55)
    }
    if (pieceSelected === i) fill(80, 110, 150)
    noStroke()
    rect(x, y, size, size, 10, 10)
    image(templates[i].image, x, y, size, size)
  }
}

buttons = []

function createCustomButton(image, onClick) {
  return {
    image: loadImage("images/" + image + ".png"),
    onClick: onClick
  }
}

var boardEditor = false

var otherMenu = false

var otherMenuX
var otherMenuY
var otherMenuWidth
var otherMenuHeight
var otherMenuPadding = 20

var otherMenuSubMenus = []

function drawOtherMenu() {
  fill(0, 0, 0, 100)
  rect(0, 0, width, height)
  otherMenuX = width / 4
  otherMenuY = height / 8
  otherMenuWidth = width / 2
  otherMenuHeight = height * 6/8
  fill(0, 0, 0, 255)
  rect(otherMenuX, otherMenuY, otherMenuWidth, otherMenuHeight, 10, 10)
  var div = document.getElementById('credits');
  div.style.position = "absolute"
  div.style.left = otherMenuX + "px"
  div.style.top = otherMenuY + "px"
  div.style.width = otherMenuWidth + "px"
  div.style.height = otherMenuHeight + "px"
  div.style.padding = otherMenuPadding + "px"
}

function createSubMenu(image, name, draw, click) {
  var sm = {
    image: image,
    name: name,
    draw: draw,
    click: click
  }
  otherMenuSubMenus.push(sm)
  return sm
}

var captureX1
var captureX2
var captureY1
var captureY2

var draggingCorner = false
var corner

function initButtons() {
  cursor = loadImage('images/move.png')
  trash = loadImage('images/trash.png')
  reset = loadImage('images/reset.png')
  editb = loadImage("images/analysis.png")

  download = loadImage('images/download.png')
  cancel = loadImage('images/cancel.png')
  buttons.push(createCustomButton('more', () => {
    otherMenu = !otherMenu
    document.getElementById('credits').style.display = otherMenu ? "block" : "none"
    document.getElementsByTagName('body')[0].oncontextmenu =  () => {return otherMenu;}
  }))
  buttons.push(createCustomButton('save', () => {
    var string = "v0;"
    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i]
      string += p.p.id + "," + p.x + "," + p.y + ";"
    }
    prompt("Copy this code to restore this board state later:", string)
  }))
  buttons.push(createCustomButton('upload', () => {
    var string = prompt("Paste in your board code here:")
    if (string.substring(0, 2) !== "v0") return alert("Invalid board code.")
    string = string.substring(3, string.length)
    split = string.split(";")
    var oldPieces = pieces
    pieces = []
    for (var i = 0; i < split.length; i++) {
      var split2 = split[i].split(",")
      if (split2[0] === "") {
        continue
      }
      var temp
      for (var j = 0; j < templates.length; j++) {
        if (templates[j].id === parseInt(split2[0])) {
          temp = templates[j]
          break
        }
      }
      pieces.push(createPiece(parseInt(split2[1]), parseInt(split2[2]), temp))
    }
  }))
  buttons.push(createCustomButton('camera', () => {
    takingImage = true
    captureX1 = width / 4
    captureX2 = width / 4 * 3
    captureY1 = height / 4
    captureY2 = height / 4 * 3
  }))
  editButton = createCustomButton('edit', () => {
    boardEditor = !boardEditor
    pieceSelected = undefined
  })
  buttons.push(editButton)
  if (mobile) {
    buttons.push(createCustomButton('right', redo))
    buttons.push(createCustomButton('left', undo))
  }
  modeButtons.push(createCustomButton('move', () => {
    modeSelected = 0
    pieceSelected = undefined
  }))
  modeButtons.push(createCustomButton('trash', () => {
    modeSelected = 1
    pieceSelected = undefined
  }))
  modeButtons.push(createCustomButton('reset', () => {
    var con = confirm('Are you sure you want to clear all pieces from the board? (ok - yes, cancel - no)')
    if (con) {
      pieces = []
      boards = []
      moves = []
      boards.push(pieces)
      moves.push(createMove(createVector(1, 1), createVector(1, 1)))
    }
  }))
}

var takingImage = false

var margin = 20
var size = 60
var buttonY = margin / 2

function drawButtons() {
  for (var i = 0; i < buttons.length; i++) {
    var buttonX = width - margin / 2 - (size + margin) * i - size
    fill(0)
    if (buttonX < winMouseX && winMouseX < buttonX + size && buttonY < winMouseY && winMouseY < buttonY + size) {
      fill(80)
    }
    noStroke()
    rect(buttonX, buttonY, size, size, 10, 10)
    if (boardEditor && buttons[i] === editButton) {
      image(editb, buttonX + size * 0.1, buttonY + size * 0.1, size * 0.8, size * 0.8)
    } else image(buttons[i].image, buttonX + size * 0.1, buttonY + size * 0.1, size * 0.8, size * 0.8)
  }
}

function drawMoves() {
  fill(0, 0, 0, 230);
  noStroke()
  rect(width * 4/5, 15, width * 1/5 - 15, height - 15 * 2)
  stroke(255)
  fill(255)
  strokeWeight(1)
  textSize(30)
  text(string, width * 4/5, 30)
}

var draggingBoard = false

var draggingPiece = false
var draggedPiece

var creatingLine

var lineStart

function vector(x, y) {
  return {
    x: x,
    y: y
  }
}

var addingPieces = false

function mousePressed() {
  if (mouseButton == RIGHT) {
    if (draggingPiece) {
      draggingPiece = false
      return
    }
    creatingLine = true
    lineStart = vector(realXToBoard(winMouseX), realYToBoard(winMouseY))
  } else {
    if (otherMenu) {
      if (otherMenuX < winMouseX && winMouseX < otherMenuX + otherMenuWidth && otherMenuY < winMouseY && winMouseY < otherMenuY + otherMenuHeight) {

      } else {
        otherMenu = false
        document.getElementById('credits').style.display = otherMenu ? "block" : "none"
        document.getElementsByTagName('body')[0].oncontextmenu =  () => {return otherMenu;}
      }
      return true
    }
    if (takingImage) {
      if (dist(winMouseX, winMouseY, captureX1, captureY1) < 50) {
        draggingCorner = true
        corner = 0
        return
      }
      if (dist(winMouseX, winMouseY, captureX2, captureY1) < 50) {
        draggingCorner = true
        corner = 1
        return
      }
      if (dist(winMouseX, winMouseY, captureX1, captureY2) < 50) {
        draggingCorner = true
        corner = 2
        return
      }
      if (dist(winMouseX, winMouseY, captureX2, captureY2) < 50) {
        draggingCorner = true
        corner = 3
        return
      }
      if (margin / 2 <= winMouseX && winMouseX <= margin / 2 + size) {
        if (margin / 2 <= winMouseY && winMouseY <= margin / 2 + size) {
          save(createAnImage(0.8), 'infinite' + new Date().toISOString().substring(0, 19).replace('T', '_').replaceAll(':', '.') + '.png')
        } else if (margin / 2 + (size + margin) <= winMouseY && winMouseY <= margin / 2 + (size + margin) + size) {
          takingImage = false
        }
      }
    }
    if (!takingImage) {
      for (var i = 0; i < buttons.length; i++) {
        var buttonX = width - margin / 2 - (size + margin) * i - size
        if (buttonX < winMouseX && winMouseX < buttonX + size && buttonY < winMouseY && winMouseY < buttonY + size) {
          buttons[i].onClick()
          return
        }
      }
      var boxWidth = (4 * (margin + size)) - margin
      var boxHeight = height - margin * 3 / 2 - size
      var boxMargin = (boxWidth - size * numPiecesPerRow) / (numPiecesPerRow + 1)
      if (boardEditor) for (var i = 0; i < templates.length; i++) {
        var x = (width - boxWidth - margin/2) + boxMargin + (i % numPiecesPerRow) * (size + boxMargin)
        var y = (margin + size) + boxMargin + (Math.floor(i / numPiecesPerRow) + 1) * (size + boxMargin)
        if (x < winMouseX && winMouseX < x + size && y < winMouseY && winMouseY < y + size) {
          pieceSelected = i
          modeSelected = undefined
          return
        }
      }
      if (boardEditor) for (var i = 0; i < modeButtons.length; i++) {
        var x = (width - boxWidth - margin/2) + boxMargin + (i % numPiecesPerRow) * (size + boxMargin)
        var y = (margin + size) + boxMargin + Math.floor(i / numPiecesPerRow) * (size + boxMargin)
        if (x < winMouseX && winMouseX < x + size && y < winMouseY && winMouseY < y + size) {
          modeButtons[i].onClick()
          return
        }
      }
      if (boardEditor) {
        var x = (width - boxWidth - margin/2)
        var y = (margin + size)
        if (x < winMouseX && winMouseX < x + boxWidth && y < winMouseY && winMouseY < y + boxHeight) {
          return
        }
      }
      if (boardEditor && pieceSelected !== undefined) {
        //addingPieces = true
        if (pieceAt(realXToBoard(winMouseX), realYToBoard(winMouseY)) !== undefined) {
          var thePieceAt = pieceAt(realXToBoard(winMouseX), realYToBoard(winMouseY))
          var index = pieces.indexOf(thePieceAt)
          if (index > -1) pieces.splice(index, 1)
        }
        pieces.push(createPiece(realXToBoard(winMouseX), realYToBoard(winMouseY), templates[pieceSelected]))
        checkIfInCheck()
        return
      }
      if (boardEditor && modeSelected === 1) {
        var thePieceAt = pieceAt(realXToBoard(winMouseX), realYToBoard(winMouseY))
        if (thePieceAt != undefined) {
          var index = pieces.indexOf(thePieceAt)
          if (index > -1) pieces.splice(index, 1)
          return
        }
      }
    }
    var piece = pieceAtReal(winMouseX, winMouseY)
    if (piece === undefined) {
      draggingBoard = true;
      dragBegin.x = winMouseX - realBoardOffset.x;
      dragBegin.y = winMouseY - realBoardOffset.y;
    } else {
      draggingPiece = true;
      draggedPiece = piece;
    }
  }
}

var lines = []

function createLine(x1, y1, x2, y2, c) {
  return {
    x1: x1,
    y1: y1,
    x2: x2,
    y2: y2,
    c: c
  }
}

var ply = 0

function createMove(first, last) {
  return {
    first: first,
    last: last
  }
}

var currentBoard = 0
var moves = []
var boards = []

var whiteInCheck = false
var blackInCheck = false

var g

function createAnImage(factor) {
  var numberBarSize = 60 * factor / 0.7
  factor = 1/shownScale * factor
  var s = tileSize * shownScale * factor
  var ox = shownBoardOffset.x - captureX1
  var oy = shownBoardOffset.y - captureY1
  ox += ox * (factor - 1)
  oy += oy * (factor - 1)
  ox += numberBarSize
  g = createGraphics(((captureX2 - captureX1) * factor) + numberBarSize, ((captureY2 - captureY1) * factor) + numberBarSize)
  g.pixelDensity(0.9)
  g.background(240, 217, 181)
  for (var x = Math.floor(-(ox) / s); x < (((captureX2 - captureX1) * factor) - (ox)) / s + 1; x++) {
    for (var y = Math.floor(-(oy) / s); y < (((captureY2 - captureY1) * factor) - (oy)) / s + 1; y++) {
      if ((x + y) % 2 == 0) {
        g.fill(181, 136, 99);
        g.noStroke();
        g.rect(x * s + ox, y * s + oy, s, s);
      }
      if (blackInCheck && pieceAt(x, -y) != undefined && pieceAt(x, -y).p === bk) {
        g.fill(255, 100, 100)
        g.rect(x * s + ox, y * s + oy, s, s);
      }
      if (whiteInCheck && pieceAt(x, -y) != undefined && pieceAt(x, -y).p === wk) {
        g.fill(255, 100, 100)
        g.rect(x * s + ox, y * s + oy, s, s);
      }
    }
  }
  for (var i = 0; i < pieces.length; i++) {
    g.image(pieces[i].p.image, pieces[i].x * s + ox, -pieces[i].y * s + oy, s, s);
  }
  g.strokeWeight(9 * s / tileSize)
  g.stroke(255)
  g.line(ox + -3 * s, oy, ox + 13 * s, oy)
  g.stroke(0)
  g.line(ox + -3 * s, oy - 8 * s, ox + 13 * s, oy - 8 * s)
  g.stroke(0)
  g.line(ox + -3 * s, oy - 8 * s, ox + 13 * s, oy - 8 * s)
  g.stroke(255, 127, 39)
  g.line(ox + 1 * s, oy + 0 * s, ox + 2 * s, oy + 0 * s)
  g.line(ox + 1 * s, oy + 0 * s, ox + 1 * s, oy - 1 * s)
  g.line(ox + 1 * s, oy + -8 * s, ox + 2 * s, oy - 8 * s)
  g.line(ox + 1 * s, oy + -8 * s, ox + 1 * s, oy - 7 * s)
  g.line(ox + 8 * s, oy + 0 * s, ox + 9 * s, oy + 0 * s)
  g.line(ox + 9 * s, oy + 0 * s, ox + 9 * s, oy - 1 * s)
  g.line(ox + 8 * s, oy + -8 * s, ox + 9 * s, oy - 8 * s)
  g.line(ox + 9 * s, oy + -8 * s, ox + 9 * s, oy - 7 * s)
  for (var i = 0; i < lines.length; i++) {
    g.strokeWeight(11 * s / tileSize)
    var theLine = lines[i]
    if (!theLine.c) {
      // stroke(19, 207, 56, 200)
      g.stroke(76, 188, 230)
    } else {
      g.stroke(230, 76, 76)
    }
    var sx = theLine.x1 * s + ox + s / 2
    var sy = -theLine.y1 * s + oy + s / 2
    var ex = theLine.x2 * s + ox + s / 2
    var ey = -theLine.y2 * s + oy + s / 2
    if (sx === ex && sy === ey) {
      g.noFill()
      g.ellipse(sx, sy, s, s)
    } else {
      g.line(sx, sy, ex, ey)
      g.angleMode(RADIANS)
      var angle = atan2(ey - sy, ex - sx)
      g.line(ex, ey, ex + s / 4 * cos(angle + PI + PI / 4), ey + s / 4 * sin(angle + PI + PI / 4))
      g.line(ex, ey, ex + s / 4 * cos(angle + PI - PI / 4), ey + s / 4 * sin(angle + PI - PI / 4))
    }
  }
  g.fill(0)
  g.noStroke()
  g.rect(0, 0, numberBarSize, g.height)
  g.rect(0, g.height - numberBarSize, g.width, numberBarSize)
  g.textAlign(CENTER, CENTER)
  g.fill(255)
  g.textSize(32 * s / tileSize)
  for (var x = Math.floor(-(ox) / s); x < (((captureX2 - captureX1) * factor) - (ox)) / s + 1; x++) {
    if (x * s + ox > numberBarSize && x * s + ox + s < g.width) g.text(x, x * s + ox + s / 2, g.height - s / 2)
  }
  for (var y = Math.floor(-(oy) / s); y < (((captureY2 - captureY1) * factor) - (oy)) / s + 1; y++) {
    if (y * s + oy > 0 && y * s + oy + s < g.height - numberBarSize) g.text(-y, s / 2, y * s + oy + s / 2)
  }
  return g
}

// currently unused.

function colorify(colors) {
  outline(10)
  for (var j = 0; j < templates.length; j++) {
    var img = templates[j].image
    img.loadPixels()
    var start
    var end
    for (var i = 0; i < img.pixels.length; i++) {
      if (i % 4 === 3 && img.pixels[i] > 0) {
        start = i
        break
      }
    }
    for (var i = img.pixels.length - 1; i >= 0; i--) {
      if (i % 4 === 3 && img.pixels[i] > 0) {
        end = i
        break
      }
    }
    for (var i = 0; i < img.pixels.length; i++) {
      if (i % 4 === 0 && i >= start && i <= end) {
        var current = i - start
        var total = end - start
        var currentColor = Math.floor(current / total * (colors.length - 1))
        var colorSize = total / (colors.length - 1)
        var percent = (current - currentColor * colorSize) / colorSize
        var r1 = colors[currentColor][0]
        var g1 = colors[currentColor][1]
        var b1 = colors[currentColor][2]
        var r2 = colors[currentColor + 1][0]
        var g2 = colors[currentColor + 1][1]
        var b2 = colors[currentColor + 1][2]
        img.pixels[i] = (r1 * (1 - percent) + r2 * percent) / 255 * img.pixels[i]
        img.pixels[i + 1] = (g1 * (1 - percent) + g2 * percent) / 255 * img.pixels[i + 1]
        img.pixels[i + 2] = (b1 * (1 - percent) + b2 * percent) / 255 * img.pixels[i + 2]
      }
    }
    img.updatePixels()
  }
}

// currently unused.

function colorifyOld(r1, g1, b1, r2, g2, b2) {
  for (var j = 0; j < templates.length; j++) {
    var img = templates[j].image
    img.loadPixels()
    for (var i = 0; i < img.pixels.length; i++) {
      if (i % 4 === 0) {
        // var percent = i / (img.pixels.length)
        var percent = i / img.pixels.length
        img.pixels[i] = (r1 * (1 - percent) + r2 * percent) / 255 * img.pixels[i]
        img.pixels[i + 1] = (g1 * (1 - percent) + g2 * percent) / 255 * img.pixels[i + 1]
        img.pixels[i + 2] = (b1 * (1 - percent) + b2 * percent) / 255 * img.pixels[i + 2]
      }
    }
    img.updatePixels()
  }
}

function checkIfInCheck() {
  var wKing
  var bKing
  blackInCheck = false
  whiteInCheck = false
  for (var i = 0; i < pieces.length; i++) {
    var p = pieces[i]
    if (p.p === wk) wKing = p
    if (p.p === bk) bKing = p
  }
  for (var i = 0; i < pieces.length; i++) {
    var p = pieces[i]
    if (bKing !== undefined && bKing.p.color != p.p.color && p.p.takes(p.x, p.y, bKing.x, bKing.y, p.p.color, p)) {
      blackInCheck = true
    }
    if (wKing !== undefined && wKing.p.color != p.p.color && p.p.takes(p.x, p.y, wKing.x, wKing.y, p.p.color, p)) {
      whiteInCheck = true
    }
  }
}

function mouseReleased() {
  if (mouseButton == RIGHT) {
    if (creatingLine) {
      var theLine
      for (var i = 0; i < lines.length; i++) {
        if (lines[i].x1 === lineStart.x && lines[i].y1 === lineStart.y && lines[i].x2 === realXToBoard(winMouseX) && lines[i].y2 === realYToBoard(winMouseY)) {
          theLine = lines[i]
        }
      }
      if (theLine != undefined) {
        if (shiftPressed && !theLine.c) {
          theLine.c = true
        } else if (!shiftPressed && theLine.c) {
          theLine.c = false
        } else {
          var index = lines.indexOf(theLine)
          if (index > -1) lines.splice(index, 1)
        }
      } else {
        lines.push(createLine(lineStart.x, lineStart.y, realXToBoard(winMouseX), realYToBoard(winMouseY), shiftPressed))
      }
      creatingLine = false
    }
  } else {
    if (draggingCorner) {
      draggingCorner = false
    }
    if (addingPieces) {
      addingPieces = false
    }
    if (draggingBoard) {
      draggingBoard = false;
    }
    if (draggingPiece) {
      var oldBoard = copyPieces(pieces)
      var oldMoveFirst = createVector(lastMoveFirst.x, lastMoveFirst.y)
      var oldMoveLast = createVector(lastMoveLast.x, lastMoveLast.y)
      draggingPiece = false
      if (realXToBoard(winMouseX) === draggedPiece.x && realYToBoard(winMouseY) == draggedPiece.y) return
      thePieceAt = pieceAtReal(winMouseX, winMouseY)
      canMove = draggedPiece.p.moves(draggedPiece.x, draggedPiece.y, realXToBoard(winMouseX), realYToBoard(winMouseY), draggedPiece.p.color, draggedPiece) && thePieceAt == undefined
      canTake = draggedPiece.p.takes(draggedPiece.x, draggedPiece.y, realXToBoard(winMouseX), realYToBoard(winMouseY), draggedPiece.p.color, draggedPiece) && thePieceAt != undefined
      if (!boardEditor) {
        if (!(canTake || canMove)) return
        if (thePieceAt != undefined && thePieceAt.p.color === draggedPiece.p.color) return
      } else {
        haveMoved = false
      }
      if (thePieceAt != undefined) {
        var index = pieces.indexOf(thePieceAt)
        if (index > -1) pieces.splice(index, 1)
      }
      lastMoveFirst.x = draggedPiece.x
      lastMoveFirst.y = draggedPiece.y
      lastMoveLast.x = realXToBoard(winMouseX)
      lastMoveLast.y = realYToBoard(winMouseY)
      draggedPiece.x = realXToBoard(winMouseX)
      draggedPiece.y = realYToBoard(winMouseY)
      lines = []
      checkIfInCheck()
      if ((whiteInCheck && draggedPiece.p.color === WHITE || blackInCheck && draggedPiece.p.color === BLACK) && !boardEditor) {
        pieces = oldBoard
        lastMoveFirst = oldMoveFirst
        lastMoveLast = oldMoveLast
        checkIfInCheck()
      } else {
        if (!boardEditor) draggedPiece.p.done(lastMoveFirst.x, lastMoveFirst.y, lastMoveLast.x, lastMoveLast.y, draggedPiece.p.color, draggedPiece)
        if (!mobile) {
          if (canTake && !boardEditor) {
            take.cloneNode(true).play()
          } else {
            move.cloneNode(true).play()
          }
        }
        if (!boardEditor) haveMoved = true
        if (currentBoard < boards.length - 1) {
          boards = boards.slice(0, currentBoard + 1)
          moves = moves.slice(0, currentBoard + 1)
        }
        boards.push(copyPieces(pieces))
        moves.push(createMove(lastMoveFirst, lastMoveLast))
        boards[currentBoard] = oldBoard
        moves[currentBoard] = createMove(oldMoveFirst, oldMoveLast)
        currentBoard++
        pieces = boards[currentBoard]
        lastMoveFirst = moves[currentBoard].first
        lastMoveLast = moves[currentBoard].last
      }
    }
  }
}

var realScale = 0.33
var shownScale = 0.33

function mouseWheel(event) {
  if (event.delta < 0) {
    var n = 0.15
  } else {
    var n = -0.15
  }
    realScale *= 1 + n;
    if (realScale > 2 || realScale < 0.17) {
      realScale /= 1 + n;
    } else {
      realBoardOffset.x -= (winMouseX - realBoardOffset.x) * n;
      realBoardOffset.y -= (winMouseY - realBoardOffset.y) * n;
    }
  return false
}

var shiftPressed = false

function keyPressed() {
  if (keyCode === 32) {
    draggingBoard = true;
    dragBegin.x = winMouseX - realBoardOffset.x;
    dragBegin.y = winMouseY - realBoardOffset.y;
  }
  if (keyCode === CONTROL) shiftPressed = true
  if (keyCode === LEFT_ARROW) {
    undo()
  }
  if (keyCode === RIGHT_ARROW) {
    redo()
  }
  if (key === 'c' || key === 'C') {
    center()
  }
}

function undo() {
  if (currentBoard > 0) {
    currentBoard--
    pieces = boards[currentBoard]
    lastMoveFirst = moves[currentBoard].first
    lastMoveLast = moves[currentBoard].last
    checkIfInCheck()
    move.cloneNode(true).play()
  }
}

function redo() {
  if (currentBoard < boards.length - 1) {
    currentBoard++
    pieces = boards[currentBoard]
    lastMoveFirst = moves[currentBoard].first
    lastMoveLast = moves[currentBoard].last
    checkIfInCheck()
    if (boards[currentBoard].length < boards[currentBoard - 1].length) {
      take.cloneNode(true).play()
    } else {
      move.cloneNode(true).play()
    }
  }
}

function keyReleased() {
  if (keyCode === CONTROL) shiftPressed = false
  if (keyCode === 32) {
    draggingBoard = false;
  }
}

var mobileZooming = false

var touch1
var touch2
var distInit
var scaleInit
