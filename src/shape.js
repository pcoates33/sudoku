import * as Utils from './utils';

const directions = {
    right: {
      previous: 'up',
      next: 'down'
    },
    down: {
      previous: 'right',
      next: 'left'
    },
    left: {
      previous: 'down',
      next: 'up'
    },
    up: {
      previous: 'left',
      next: 'right'
    }
}

export default class Shape {

  constructor(rowcols) {
    this.rowcols = rowcols;
    this.current = null;
    this.groupCoords = [];
    this.lastCoord = {
      x: -1,
      y: -1
    }
  }

  findNextOnPerimiter() {
    if (this.current === null) {
      if (this.rowcols[0].done === undefined) {
        this.rowcols[0].done = ['right'];
      } 
      this.current =  {
        direction: 'right',
        rowcol: this.rowcols[0]
      };
      return this.current;
    }

    // try in the previous direction.
    let previousDirection = directions[this.current.direction].previous;
    
    let nextRowcol = Utils.findRowCol(this.rowcols, Utils.moveRowCol(this.current.rowcol, previousDirection));
    if (nextRowcol) {
      if (nextRowcol.done === undefined) {
        nextRowcol.done = [];
      }  
      if (!nextRowcol.done.includes(previousDirection)) {
        nextRowcol.done.push(previousDirection);
        this.current =  {
          direction: previousDirection,
          rowcol: nextRowcol
        };
        return this.current;
      }
    }

    // try in current direction
    nextRowcol = Utils.findRowCol(this.rowcols, Utils.moveRowCol(this.current.rowcol, this.current.direction));

    if (nextRowcol) {
      if (nextRowcol.done === undefined) {
        nextRowcol.done = [];
      }  
      if (!nextRowcol.done.includes(this.current.direction)) {
        nextRowcol.done.push(this.current.direction);
        // a better option would be one in the previous direction if there is one.
        let betterRowcol = Utils.findRowCol(this.rowcols, Utils.moveRowCol(nextRowcol, previousDirection));
        if (betterRowcol) {
          if (betterRowcol.done === undefined) {
            betterRowcol.done = [];
          }  
          if (!betterRowcol.done.includes(previousDirection)) {
            betterRowcol.done.push(previousDirection);
            this.current = {
              direction: previousDirection,
              rowcol: betterRowcol
            };
            return this.current;
          }
        }
        this.current = {
          direction: this.current.direction,
          rowcol: nextRowcol
        };
        return this.current;
      }
    }

    // return self in next direction.

    let nextDirection = directions[this.current.direction].next;
    nextRowcol = this.current.rowcol;

    if (nextRowcol.done === undefined) {
      nextRowcol.done = [];
    }  
    if (!nextRowcol.done.includes(nextDirection)) {
      nextRowcol.done.push(nextDirection);
      this.current = {
        direction: nextDirection,
        rowcol: nextRowcol
      };
      return this.current;
    
    }

    // can't find a next
    return null;

  }

  calculateCoord(rowcol, corner) {
    let x = (rowcol.col * 41) + 4;
    x = x + Math.floor(rowcol.col/3) * 1;
    if (corner.endsWith('right')) {
      x = x + 37;
    }
    let y = (rowcol.row * 41) + 5;
    y = y + Math.floor(rowcol.row/3) * 2;
    if (corner.startsWith('bottom')) {
      y = y + 37;
    }
    return {x: x, y: y};
  }

  addCoord(coord) {
    if (this.lastCoord.x === coord.x && this.lastCoord.y === coord.y) {
      return;
    }
    this.groupCoords.push(coord);
    this.lastCoord = coord;
  }

  calculatePerimiter() {
    let nextOnPerimiter = this.findNextOnPerimiter();

    while (nextOnPerimiter) {
      let rowcol = nextOnPerimiter.rowcol;
      
      if (nextOnPerimiter.direction === 'right') {
        this.addCoord(this.calculateCoord(rowcol, 'top-left'));
        this.addCoord(this.calculateCoord(rowcol, 'top-right'));
      } 
      if (nextOnPerimiter.direction === 'down') {
        this.addCoord(this.calculateCoord(rowcol, 'top-right'));
        this.addCoord(this.calculateCoord(rowcol, 'bottom-right'));
      } 
      if (nextOnPerimiter.direction === 'left') {
        this.addCoord(this.calculateCoord(rowcol, 'bottom-right'));
        this.addCoord(this.calculateCoord(rowcol, 'bottom-left'));
      } 
      if (nextOnPerimiter.direction === 'up') {
        this.addCoord(this.calculateCoord(rowcol, 'bottom-left'));
        this.addCoord(this.calculateCoord(rowcol, 'top-left'));
      } 

      nextOnPerimiter = this.findNextOnPerimiter();
    }
    
    return this.groupCoords;
  }

}