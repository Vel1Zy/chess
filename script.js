class ChessGame {
  constructor() {
    this.board = this.initializeBoard();
    this.currentPlayer = "white";
    this.selectedSquare = null;
    this.validMoves = [];
    this.gameBoard = document.getElementById("chessboard");
    this.turnIndicator = document.getElementById("current-turn");
    this.resetBtn = document.getElementById("reset-btn");

    // Track game state for special moves
    this.moveHistory = [];
    this.hasKingMoved = { white: false, black: false };
    this.hasRookMoved = {
      white: { kingside: false, queenside: false },
      black: { kingside: false, queenside: false },
    };

    this.initializeGame();
  }

  initializeBoard() {
    // Unicode chess pieces
    const pieces = {
      white: {
        king: "♔",
        queen: "♕",
        rook: "♖",
        bishop: "♗",
        knight: "♘",
        pawn: "♙",
      },
      black: {
        king: "♚",
        queen: "♛",
        rook: "♜",
        bishop: "♝",
        knight: "♞",
        pawn: "♟",
      },
    };

    const board = Array(8)
      .fill()
      .map(() => Array(8).fill(null));

    // Set up pieces
    // Black pieces
    board[0] = ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"];
    board[1] = Array(8).fill("♟");

    // White pieces
    board[6] = Array(8).fill("♙");
    board[7] = ["♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"];

    return board;
  }

  getValidMoves(row, col) {
    const piece = this.board[row][col];
    const moves = [];

    if (!piece) return moves;

    const pieceType = this.getPieceType(piece);
    const pieceColor = this.getPieceColor(piece);

    switch (pieceType) {
      case "pawn":
        moves.push(...this.getPawnMoves(row, col, pieceColor));
        break;
      case "rook":
        moves.push(...this.getRookMoves(row, col, pieceColor));
        break;
      case "bishop":
        moves.push(...this.getBishopMoves(row, col, pieceColor));
        break;
      case "knight":
        moves.push(...this.getKnightMoves(row, col, pieceColor));
        break;
      case "queen":
        moves.push(...this.getQueenMoves(row, col, pieceColor));
        break;
      case "king":
        moves.push(...this.getKingMoves(row, col, pieceColor));
        break;
    }

    return moves;
  }

  getPieceType(piece) {
    const pieceMap = {
      "♔": "king",
      "♚": "king",
      "♕": "queen",
      "♛": "queen",
      "♖": "rook",
      "♜": "rook",
      "♗": "bishop",
      "♝": "bishop",
      "♘": "knight",
      "♞": "knight",
      "♙": "pawn",
      "♟": "pawn",
    };
    return pieceMap[piece];
  }

  isValidSquare(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  canMoveToSquare(row, col, pieceColor) {
    if (!this.isValidSquare(row, col)) return false;

    const targetPiece = this.board[row][col];
    if (!targetPiece) return true; // Empty square

    return this.getPieceColor(targetPiece) !== pieceColor; // Can capture opponent
  }

  getPawnMoves(row, col, color) {
    const moves = [];
    const direction = color === "white" ? -1 : 1; // White moves up (-1), black moves down (+1)
    const startRow = color === "white" ? 6 : 1;

    // Move forward one square
    if (
      this.isValidSquare(row + direction, col) &&
      !this.board[row + direction][col]
    ) {
      moves.push({ row: row + direction, col });

      // Move forward two squares from starting position
      if (row === startRow && !this.board[row + 2 * direction][col]) {
        moves.push({ row: row + 2 * direction, col });
      }
    }

    // Capture diagonally
    [-1, 1].forEach((colOffset) => {
      const newRow = row + direction;
      const newCol = col + colOffset;
      if (this.isValidSquare(newRow, newCol)) {
        const targetPiece = this.board[newRow][newCol];
        if (targetPiece && this.getPieceColor(targetPiece) !== color) {
          moves.push({ row: newRow, col: newCol });
        }
      }
    });

    return moves;
  }

  getRookMoves(row, col, color) {
    const moves = [];
    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
    ]; // Right, Left, Down, Up

    directions.forEach(([rowDir, colDir]) => {
      for (let i = 1; i < 8; i++) {
        const newRow = row + i * rowDir;
        const newCol = col + i * colDir;

        if (!this.isValidSquare(newRow, newCol)) break;

        const targetPiece = this.board[newRow][newCol];
        if (!targetPiece) {
          moves.push({ row: newRow, col: newCol });
        } else {
          if (this.getPieceColor(targetPiece) !== color) {
            moves.push({ row: newRow, col: newCol }); // Capture
          }
          break; // Can't move past any piece
        }
      }
    });

    return moves;
  }

  getBishopMoves(row, col, color) {
    const moves = [];
    const directions = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ]; // Diagonal directions

    directions.forEach(([rowDir, colDir]) => {
      for (let i = 1; i < 8; i++) {
        const newRow = row + i * rowDir;
        const newCol = col + i * colDir;

        if (!this.isValidSquare(newRow, newCol)) break;

        const targetPiece = this.board[newRow][newCol];
        if (!targetPiece) {
          moves.push({ row: newRow, col: newCol });
        } else {
          if (this.getPieceColor(targetPiece) !== color) {
            moves.push({ row: newRow, col: newCol }); // Capture
          }
          break; // Can't move past any piece
        }
      }
    });

    return moves;
  }

  getKnightMoves(row, col, color) {
    const moves = [];
    const knightMoves = [
      [-2, -1],
      [-2, 1],
      [-1, -2],
      [-1, 2],
      [1, -2],
      [1, 2],
      [2, -1],
      [2, 1],
    ];

    knightMoves.forEach(([rowOffset, colOffset]) => {
      const newRow = row + rowOffset;
      const newCol = col + colOffset;

      if (this.canMoveToSquare(newRow, newCol, color)) {
        moves.push({ row: newRow, col: newCol });
      }
    });

    return moves;
  }

  getQueenMoves(row, col, color) {
    // Queen combines rook and bishop moves
    return [
      ...this.getRookMoves(row, col, color),
      ...this.getBishopMoves(row, col, color),
    ];
  }

  getKingMoves(row, col, color) {
    const moves = [];
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];

    directions.forEach(([rowOffset, colOffset]) => {
      const newRow = row + rowOffset;
      const newCol = col + colOffset;

      if (this.canMoveToSquare(newRow, newCol, color)) {
        moves.push({ row: newRow, col: newCol });
      }
    });

    return moves;
  }

  initializeGame() {
    this.renderBoard();
    this.resetBtn.addEventListener("click", () => this.resetGame());
  }

  renderBoard() {
    this.gameBoard.innerHTML = "";

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const square = document.createElement("div");
        square.className = "square";
        square.dataset.row = row;
        square.dataset.col = col;

        // Alternating colors
        if ((row + col) % 2 === 0) {
          square.classList.add("light");
        } else {
          square.classList.add("dark");
        }

        const piece = this.board[row][col];
        if (piece) {
          square.textContent = piece;
          square.classList.add("piece");
          square.classList.add(this.getPieceColor(piece) + "-piece");
        }

        square.addEventListener("click", () =>
          this.handleSquareClick(row, col)
        );
        this.gameBoard.appendChild(square);
      }
    }
  }

  getPieceColor(piece) {
    const whitePieces = ["♔", "♕", "♖", "♗", "♘", "♙"];
    return whitePieces.includes(piece) ? "white" : "black";
  }

  handleSquareClick(row, col) {
    const clickedSquare = this.gameBoard.children[row * 8 + col];
    const piece = this.board[row][col];

    if (this.selectedSquare) {
      // If clicking on a valid move square
      if (
        this.validMoves.some((move) => move.row === row && move.col === col)
      ) {
        this.movePiece(
          this.selectedSquare.row,
          this.selectedSquare.col,
          row,
          col
        );
        this.clearSelection();
        this.switchPlayer();
      } else {
        this.clearSelection();
        // If clicking on own piece, select it
        if (piece && this.getPieceColor(piece) === this.currentPlayer) {
          this.selectSquare(row, col);
        }
      }
    } else {
      // Select piece if it belongs to current player
      if (piece && this.getPieceColor(piece) === this.currentPlayer) {
        this.selectSquare(row, col);
      }
    }
  }

  selectSquare(row, col) {
    this.selectedSquare = { row, col };
    this.validMoves = this.getValidMoves(row, col);

    // Highlight selected square
    const square = this.gameBoard.children[row * 8 + col];
    square.classList.add("selected");

    // Highlight valid moves
    this.validMoves.forEach((move) => {
      const moveSquare = this.gameBoard.children[move.row * 8 + move.col];
      moveSquare.classList.add("valid-move");
    });
  }

  clearSelection() {
    // Remove all highlights
    document.querySelectorAll(".square").forEach((square) => {
      square.classList.remove("selected", "valid-move");
    });
    this.selectedSquare = null;
    this.validMoves = [];
  }

  movePiece(fromRow, fromCol, toRow, toCol) {
    const piece = this.board[fromRow][fromCol];
    const capturedPiece = this.board[toRow][toCol];

    // Track king and rook movements for castling
    if (this.getPieceType(piece) === "king") {
      this.hasKingMoved[this.currentPlayer] = true;
    }
    if (this.getPieceType(piece) === "rook") {
      if (fromCol === 0) {
        // Queenside rook
        this.hasRookMoved[this.currentPlayer].queenside = true;
      } else if (fromCol === 7) {
        // Kingside rook
        this.hasRookMoved[this.currentPlayer].kingside = true;
      }
    }

    // Record move in history
    this.moveHistory.push({
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      piece: piece,
      captured: capturedPiece,
      player: this.currentPlayer,
    });

    // Execute the move
    this.board[toRow][toCol] = piece;
    this.board[fromRow][fromCol] = null;

    this.renderBoard();
  }

  switchPlayer() {
    this.currentPlayer = this.currentPlayer === "white" ? "black" : "white";
    this.turnIndicator.textContent = `${
      this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)
    }'s Turn`;
  }

  resetGame() {
    this.board = this.initializeBoard();
    this.currentPlayer = "white";
    this.clearSelection();
    this.turnIndicator.textContent = "White's Turn";
    this.renderBoard();
  }
}

// Initialize the game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ChessGame();
});
