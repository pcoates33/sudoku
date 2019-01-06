
export function indexesToCoords(indexes, size=9) {
    let coords = [];
    indexes.sort((a, b) => a - b);
    for (let index of indexes) {
        coords.push({row: Math.floor(index/size), col: (index%size)});
    }
    return coords;
}

export function coordToIndex(coord, size=9) {
    return (coord.row * size) + coord.col;
}

export function findRowCol(rowcols, rowcolToFind) {
    for (let rowcol of rowcols) {
      if (rowcol.col === rowcolToFind.col && rowcol.row === rowcolToFind.row) {
        return rowcol;
      }
    }
    return null;
  }

export function noRowCol(rowcols, rowcolToFind) {
    return this.findRowCol(rowcols, rowcolToFind) === null;
}

export function moveRowCol(rowcol, direction) {
    let row = rowcol.row;
    let col = rowcol.col;
    if  (direction === 'up') {
      row = row - 1;
    } else if (direction === 'down') {
      row = row + 1;
    } else if (direction === 'left') {
      col = col - 1;
    } else if (direction === 'right') {
      col = col + 1;
    }
    return {
      row: row,
      col: col
    };
  }
