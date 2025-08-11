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

    this.gameOver = false;
    this.gameResult = null;
    this.enPassantTarget = null; // Stores the position of pawn that can be captured en passant

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

    if (!piece || this.gameOver) return moves;

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

    // Filter out moves that would put own king in check
    return moves.filter(
      (move) =>
        !this.wouldBeInCheckAfterMove(row, col, move.row, move.col, pieceColor)
    );
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
    const direction = color === "white" ? -1 : 1;
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

    // En passant
    if (this.enPassantTarget) {
      [-1, 1].forEach((colOffset) => {
        const newCol = col + colOffset;
        if (
          newCol === this.enPassantTarget.col &&
          row === this.enPassantTarget.row &&
          this.isValidSquare(row + direction, newCol)
        ) {
          moves.push({
            row: row + direction,
            col: newCol,
            isEnPassant: true,
          });
        }
      });
    }

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

    // Castling
    if (!this.hasKingMoved[color] && !this.isInCheck(color)) {
      // Kingside castling
      if (this.canCastle(color, "kingside")) {
        moves.push({ row, col: col + 2, isCastle: "kingside" });
      }

      // Queenside castling
      if (this.canCastle(color, "queenside")) {
        moves.push({ row, col: col - 2, isCastle: "queenside" });
      }
    }

    return moves;
  }

  canCastle(color, side) {
    const row = color === "white" ? 7 : 0;
    const kingCol = 4;

    // Check if rook has moved
    if (this.hasRookMoved[color][side]) {
      return false;
    }

    if (side === "kingside") {
      // Check if squares between king and rook are empty
      if (this.board[row][5] || this.board[row][6]) {
        return false;
      }

      // Check if king would pass through or end up in check
      if (
        this.wouldBeInCheckAfterMove(row, kingCol, row, 5, color) ||
        this.wouldBeInCheckAfterMove(row, kingCol, row, 6, color)
      ) {
        return false;
      }

      // Check if rook is still there
      const rookPiece = this.board[row][7];
      return (
        rookPiece &&
        this.getPieceType(rookPiece) === "rook" &&
        this.getPieceColor(rookPiece) === color
      );
    } else {
      // queenside
      // Check if squares between king and rook are empty
      if (this.board[row][3] || this.board[row][2] || this.board[row][1]) {
        return false;
      }

      // Check if king would pass through or end up in check
      if (
        this.wouldBeInCheckAfterMove(row, kingCol, row, 3, color) ||
        this.wouldBeInCheckAfterMove(row, kingCol, row, 2, color)
      ) {
        return false;
      }

      // Check if rook is still there
      const rookPiece = this.board[row][0];
      return (
        rookPiece &&
        this.getPieceType(rookPiece) === "rook" &&
        this.getPieceColor(rookPiece) === color
      );
    }
  }

  findKing(color) {
    const kingPiece = color === "white" ? "♔" : "♚";
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (this.board[row][col] === kingPiece) {
          return { row, col };
        }
      }
    }
    return null;
  }

  isInCheck(color) {
    const king = this.findKing(color);
    if (!king) return false;

    // Check if any opponent piece can attack the king
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && this.getPieceColor(piece) !== color) {
          const attackMoves = this.getRawMoves(row, col);
          if (
            attackMoves.some(
              (move) => move.row === king.row && move.col === king.col
            )
          ) {
            return true;
          }
        }
      }
    }
    return false;
  }

  getRawPawnMoves(row, col, color) {
    const moves = [];
    const direction = color === "white" ? -1 : 1;
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

    // En passant
    if (this.enPassantTarget) {
      [-1, 1].forEach((colOffset) => {
        const newCol = col + colOffset;
        if (
          newCol === this.enPassantTarget.col &&
          row === this.enPassantTarget.row &&
          this.isValidSquare(row + direction, newCol)
        ) {
          moves.push({
            row: row + direction,
            col: newCol,
            isEnPassant: true,
          });
        }
      });
    }

    return moves;
  }

  getRawKingMoves(row, col, color) {
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

    // NOTE: No castling in raw moves to avoid recursion
    return moves;
  }

  getRawMoves(row, col) {
    // Get moves without checking if they put own king in check
    const piece = this.board[row][col];
    const moves = [];

    if (!piece) return moves;

    const pieceType = this.getPieceType(piece);
    const pieceColor = this.getPieceColor(piece);

    switch (pieceType) {
      case "pawn":
        moves.push(...this.getRawPawnMoves(row, col, pieceColor));
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
        moves.push(...this.getRawKingMoves(row, col, pieceColor));
        break;
    }

    return moves;
  }

  wouldBeInCheckAfterMove(fromRow, fromCol, toRow, toCol, color) {
    // Simulate the move
    const originalPiece = this.board[toRow][toCol];
    const movingPiece = this.board[fromRow][fromCol];

    this.board[toRow][toCol] = movingPiece;
    this.board[fromRow][fromCol] = null;

    const inCheck = this.isInCheck(color);

    // Restore the board
    this.board[fromRow][fromCol] = movingPiece;
    this.board[toRow][toCol] = originalPiece;

    return inCheck;
  }

  hasValidMoves(color) {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = this.board[row][col];
        if (piece && this.getPieceColor(piece) === color) {
          const validMoves = this.getValidMoves(row, col);
          if (validMoves.length > 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  checkGameOver() {
    const currentPlayerInCheck = this.isInCheck(this.currentPlayer);
    const hasValidMoves = this.hasValidMoves(this.currentPlayer);

    if (!hasValidMoves) {
      this.gameOver = true;
      if (currentPlayerInCheck) {
        // Checkmate
        const winner = this.currentPlayer === "white" ? "black" : "white";
        this.gameResult = `Checkmate! ${
          winner.charAt(0).toUpperCase() + winner.slice(1)
        } wins!`;
      } else {
        // Stalemate
        this.gameResult = "Stalemate! It's a draw.";
      }
      this.displayGameResult();
    } else if (currentPlayerInCheck) {
      this.gameResult = `${
        this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)
      } is in check!`;
      this.displayGameResult();
    } else {
      // Clear check message if no longer in check
      this.gameResult = null;
    }
  }

  displayGameResult() {
    if (this.gameResult) {
      this.turnIndicator.textContent = this.gameResult;
      if (this.gameOver) {
        this.turnIndicator.style.color = "red";
        this.turnIndicator.style.fontWeight = "bold";
      }
    }
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
    if (this.gameOver) return;

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
    const move = this.validMoves.find(
      (m) => m.row === toRow && m.col === toCol
    );

    // Handle special moves
    if (move && move.isEnPassant) {
      // En passant capture - remove the captured pawn
      this.board[this.enPassantTarget.row][this.enPassantTarget.col] = null;
    } else if (move && move.isCastle) {
      // Castling
      const row = fromRow;
      if (move.isCastle === "kingside") {
        // Move rook from h-file to f-file
        this.board[row][5] = this.board[row][7];
        this.board[row][7] = null;
      } else {
        // queenside
        // Move rook from a-file to d-file
        this.board[row][3] = this.board[row][0];
        this.board[row][0] = null;
      }
    }

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

    // Set en passant target if pawn moved two squares
    this.enPassantTarget = null;
    if (
      this.getPieceType(piece) === "pawn" &&
      Math.abs(toRow - fromRow) === 2
    ) {
      // Store the position of the pawn that can be captured en passant
      this.enPassantTarget = {
        row: toRow,
        col: toCol,
      };
    }

    // Record move in history
    this.moveHistory.push({
      from: { row: fromRow, col: fromCol },
      to: { row: toRow, col: toCol },
      piece: piece,
      captured: capturedPiece,
      player: this.currentPlayer,
      isEnPassant: move && move.isEnPassant,
      isCastle: move && move.isCastle,
    });

    // Execute the move
    this.board[toRow][toCol] = piece;
    this.board[fromRow][fromCol] = null;

    this.renderBoard();

    // Check for game over conditions after the move
    this.checkGameOver();
  }

  switchPlayer() {
    this.currentPlayer = this.currentPlayer === "white" ? "black" : "white";
    if (!this.gameOver && !this.gameResult) {
      this.turnIndicator.textContent = `${
        this.currentPlayer.charAt(0).toUpperCase() + this.currentPlayer.slice(1)
      }'s Turn`;
    }
  }

  resetGame() {
    this.board = this.initializeBoard();
    this.currentPlayer = "white";
    this.gameOver = false;
    this.gameResult = null;
    this.enPassantTarget = null;
    this.clearSelection();
    this.turnIndicator.textContent = "White's Turn";
    this.turnIndicator.style.color = "";
    this.turnIndicator.style.fontWeight = "";
    this.moveHistory = [];
    this.hasKingMoved = { white: false, black: false };
    this.hasRookMoved = {
      white: { kingside: false, queenside: false },
      black: { kingside: false, queenside: false },
    };
    this.renderBoard();
  }
}

// Initialize the game when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new ChessGame();
});
