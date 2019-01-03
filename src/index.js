import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class Square extends React.Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }

  render() {
    const square = this.props.square;
    
    let className = "square";
    if (square.classNames.conflict) {
      className += " conflict"
    }
    if (this.props.isSelected) {
      className += " selected"
    }
    if (this.props.isCursor) {
      className += " cursor"
    }
    if ((this.props.row % 3) === 0) {
      className += ' box-top';
    } 
    if ((this.props.col % 3) === 0) {
      className += ' box-left';
    } 

    let row_col = this.props.row + "-" + this.props.col;
    
    return (
      <div ref={this.myRef} data-row-col={row_col} data-row={this.props.row} data-col={this.props.col} className={className}
      onClick={this.props.onClick}>{square.value}</div>
    );
  }

}

class Group extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      total: 0
    };

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  handleKeyDown(event) {
    event.stopPropagation();
  }

  handleSubmit(event) {
    this.props.saveTotal(this.state.total, this.props.selected);

    event.preventDefault();
  }

  handleChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.type === 'number' ? parseInt( target.value,10) : target.value;
    const name = target.name;

    this.setState({
      [name]: value
    });
  }

  render() {
    const opts = {};
    console.log(this.props.selected);
    if (this.props.selected.length === 0) {
      opts['disabled'] = 'disabled';
    };
    
    return (
      <form onSubmit={this.handleSubmit} onKeyDown={this.handleKeyDown}>
          <div className="form-row"><label>total : </label><input type="number" name="total" className="required" value={this.state.total} onChange={this.handleChange}/></div>
          <div className="form-row"><button type="submit" {...opts}>Save</button></div>
      </form>
    );
  }

}

class DrawGroups extends React.Component {

  indexesToCoords(indexes) {
    let coords = [];
    indexes.sort((a, b) => a - b);
    for (let index of indexes) {
      coords.push({row: Math.floor(index/9), col: (index%9)});
    }
    return coords;
  }

  componentDidMount() {
    window.addEventListener('resize', this._resizeHandler);

    /* Allows CSS to determine size of canvas */
    this.canvas.width = this.canvas.clientWidth;
    this.canvas.height = this.canvas.clientHeight;

    this.clearAndDraw();
  }

  clearAndDraw() {
    const ctx = this.canvas.getContext('2d');
    if (ctx) {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.draw(ctx);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.groups !== prevProps.groups) {
        this.clearAndDraw();
    }
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

  findRowCol(rowcols, rowcolToFind) {
    for (let rowcol of rowcols) {
      if (rowcol.col === rowcolToFind.col && rowcol.row === rowcolToFind.row) {
        return rowcol;
      }
    }
    return null;
  }

  noRowCol(rowcols, rowcolToFind) {
    return this.findRowCol(rowcols, rowcolToFind) === null;
  }

  moveRowCol(rowcol, direction) {
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

  findNextOnPerimiter(rowcols, current) {
    let directions = {
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

    // try in the previous direction.
    let previousDirection = directions[current.direction].previous;
    let nextRowcol = this.findRowCol(rowcols, this.moveRowCol(current.rowcol, previousDirection));
    if (nextRowcol) {
      if (nextRowcol.done === undefined) {
        nextRowcol.done = [];
      }  
      if (!nextRowcol.done.includes(previousDirection)) {
        nextRowcol.done.push(previousDirection);
        return {
          direction: previousDirection,
          rowcol: nextRowcol
        };
      }
    }

    // try in current direction
    nextRowcol = this.findRowCol(rowcols, this.moveRowCol(current.rowcol, current.direction));

    if (nextRowcol) {
      if (nextRowcol.done === undefined) {
        nextRowcol.done = [];
      }  
      if (!nextRowcol.done.includes(current.direction)) {
        nextRowcol.done.push(current.direction);
        // a better option would be one in the previous direction if there is one.
        let betterRowcol = this.findRowCol(rowcols, this.moveRowCol(nextRowcol, previousDirection));
        if (betterRowcol) {
          if (betterRowcol.done === undefined) {
            betterRowcol.done = [];
          }  
          if (!betterRowcol.done.includes(previousDirection)) {
            betterRowcol.done.push(previousDirection);
            return {
              direction: previousDirection,
              rowcol: betterRowcol
            };
          }
        }
        return {
          direction: current.direction,
          rowcol: nextRowcol
        };
      }
    }

    // return self in next direction.

    let nextDirection = directions[current.direction].next;
    nextRowcol = current.rowcol;

    if (nextRowcol.done === undefined) {
      nextRowcol.done = [];
    }  
    if (!nextRowcol.done.includes(nextDirection)) {
      nextRowcol.done.push(nextDirection);
      return {
        direction: nextDirection,
        rowcol: nextRowcol
      };
    
    }

    // can't find a next
    return null;

  }

  calculateGroupCoords(rowcols) {
    let groupCoords = [];
    let start = rowcols[0];
    if (start.done === undefined) {
      start.done = [];
    }
    start.done.push('right');
    let nextOnPerimiter = {
      direction: 'right',
      rowcol: start
    };
    while (nextOnPerimiter) {
      console.log(nextOnPerimiter.direction + ", " + nextOnPerimiter.rowcol.row + ", " + nextOnPerimiter.rowcol.col);
      let rowcol = nextOnPerimiter.rowcol;
      
      // let noUp = this.noRowCol(rowcols, this.moveRowCol(rowcol,'up'));
      // let noRight = this.noRowCol(rowcols, this.moveRowCol(rowcol,'right'));
      // let noDown = this.noRowCol(rowcols, this.moveRowCol(rowcol,'down'));
      // let noLeft = this.noRowCol(rowcols, this.moveRowCol(rowcol,'left'));
      
      if (nextOnPerimiter.direction === 'right') {
        groupCoords.push(this.calculateCoord(rowcol, 'top-left'));
        groupCoords.push(this.calculateCoord(rowcol, 'top-right'));
      } 
      if (nextOnPerimiter.direction === 'down') {
        groupCoords.push(this.calculateCoord(rowcol, 'top-right'));
        groupCoords.push(this.calculateCoord(rowcol, 'bottom-right'));
      } 
      if (nextOnPerimiter.direction === 'left') {
        groupCoords.push(this.calculateCoord(rowcol, 'bottom-right'));
        groupCoords.push(this.calculateCoord(rowcol, 'bottom-left'));
      } 
      if (nextOnPerimiter.direction === 'up') {
        groupCoords.push(this.calculateCoord(rowcol, 'bottom-left'));
        groupCoords.push(this.calculateCoord(rowcol, 'top-left'));
      } 
      // if (noRight || noUp) {
      //   groupCoords.push(this.calculateCoord(rowcol, 'top-right'));
      // } 

      // TODO work out how to walk the perimiter.

      // if (noRight || noDown) {
      //   groupCoords.push(this.calculateCoord(rowcol, 'bottom-right'));
      // } 
      // if (noLeft || noDown) {
      //   groupCoords.push(this.calculateCoord(rowcol, 'bottom-left'));
      // } 
      nextOnPerimiter = rowcol = this.findNextOnPerimiter(rowcols, nextOnPerimiter);
    }
    // go back to the start.
    groupCoords.push(this.calculateCoord(start, 'top-left'));
    return groupCoords;
  }

  draw(ctx) {
    console.log('draw it');
    console.log(this.props.groups);
    const totals = this.props.groups.totals;
    for(let groupTotal of totals) {
      let rowcols = this.indexesToCoords(groupTotal.indexes);
      let groupCoords = this.calculateGroupCoords(rowcols);

      ctx.beginPath();
      let start = groupCoords[0];
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < groupCoords.length; i++) {
        let nextPoint = groupCoords[i];
        ctx.lineTo(nextPoint.x, nextPoint.y);
      }
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffcc88';
      ctx.stroke();
    }
    
  }

  render() {
    return (
      <canvas className="group-canvas"  ref={canvas => this.canvas = canvas}/>
    );
  }

}
  
class Grid extends React.Component {

  renderSquare(row, col) {
    const i = (row*this.props.gridSize) + col;
    const isSelected = (this.props.selected.indexOf(i) >= 0);
    const isCursor = (this.props.cursor && this.props.cursor.row === row && this.props.cursor.col === col);
    
    return (
      <Square 
        key={i}
        row={row}
        col={col}
        square={this.props.squares[i]}
        isSelected={isSelected}
        isCursor={isCursor}
        onChange={(e) => this.props.onChange(row, col, e)}
        onClick={(e) => this.props.onClick(row, col, e)}
      />
    );
  }

  renderGridRow(row) {
    var cells = [];
    for (var col = 0; col < this.props.gridSize; col++) {
      cells.push(this.renderSquare(row, col));
    }
    
    return (
      <div key={row} className="grid-row">
        {cells}
      </div>
    )
  }

  render() {
    var rows = [];
    for (var row = 0; row < this.props.gridSize; row++) {
      rows.push(this.renderGridRow(row));
    }
    
    return (
      <div className="board-grid">
        {rows}
      </div>
    );
  }
}
  
class Game extends React.Component {

  constructor(props) {
    super(props);
    // Construct positions of rows, columns and boxes
    this.boxSize = (this.props.boxSize) ? parseInt(this.props.boxSize, 10) : 3;
    this.numBoxes = (this.props.numBoxes) ? parseInt(this.props.numBoxes, 10) : 3;
    this.gridSize = this.boxSize * this.numBoxes;
    this.gridLayout = {
      rows: [],
      cols: [],
      boxes: []
    };
    // The rows
    for (let row = 0; row < this.gridSize; row++) {
      let rowLayout = [];
      for (let col = 0; col < this.gridSize; col++) {
        rowLayout.push((row*this.gridSize)+col);
      }
      this.gridLayout.rows.push(rowLayout);
    }
    // The columns
    for (let col = 0; col < this.gridSize; col++) {
      let colLayout = [];
      for (let row = 0; row < this.gridSize; row++) {
        colLayout.push((row*this.gridSize)+col);
      }
      this.gridLayout.cols.push(colLayout);
    }
    // The boxes
    for (let x = 0; x < this.numBoxes; x++) {
      for (let y = 0; y < this.numBoxes; y++) {
        let boxLayout = [];
        for (let row = 0; row < this.boxSize; row++) {
          for (let col = 0; col < this.boxSize; col++) {
            let pos = (x * this.gridSize * this.boxSize) + (y * this.boxSize) + (row * this.gridSize) + col;
            boxLayout.push(pos);
          }  
        }
        this.gridLayout.boxes.push(boxLayout);  
      }  
    }
    

    //
    const number_squares=this.gridSize*this.gridSize;
    let squares = [];
    while (squares.length < number_squares) {
      squares.push({value: '', classNames: {}});
    }
    this.state = {
      history: [{
        squares: squares
      }],
      stepNumber: 0,
      selected: [],
      groups: {
        used: [],
        totals: []
      }
    };

    this.handleCellClick = this.handleCellClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.saveTotal = this.saveTotal.bind(this);
    
  }

  moveCursor(code) {
    if (!this.state.cursor) {
      return;
    }
    let row = this.state.cursor.row;
    let col = this.state.cursor.col;
    switch (code) {
      case 'ArrowLeft' : 
        col = (col === 0) ? col : col - 1;
        break;
      case 'ArrowUp' :  
        row = (row === 0) ? row : row - 1;
        break;
      case 'ArrowRight' : 
        col = (col === 8) ? col : col + 1;
        break;
      case 'ArrowDown' :  
        row = (row === 8) ? row : row + 1;
        break;
      default :
        break;
    }

    this.addSelectedCell(row, col);
  }

  coordToIndex(coord) {
    return (coord.row * this.gridSize) + coord.col;
  }

  setSelectedSquareValue(key) {
    if (!this.state.cursor || ("123456789".indexOf(key) < 0 && key !== '')) {
      return;
    }

    const i = this.coordToIndex(this.state.cursor);
    const history = [...this.state.history];
    const current = history[history.length - 1];
    const squares = [...current.squares];
    // if (calculateWinner(squares) || squares[i]) {
    //   return;
    // }
    console.log(i + " : " + key);
    squares[i] = {
      value: key,
      classNames: squares[i].classNames
    };
    
    checkForConflicts(this.gridLayout, squares);

    this.setState({
      history: history.concat([{
        squares: squares,
      }]),
      stepNumber: history.length
    });
  }

  handleKeyDown(e) {
    console.log(e);
    let code = e.code;
    if (code.startsWith('Arrow')) {
      this.moveCursor(code);
      e.preventDefault();
    }
    if (code.startsWith('Digit') || code.startsWith('Numpad')) {
      this.setSelectedSquareValue(e.key);
      e.preventDefault();
    }
    if (code === 'Delete') {
      this.setSelectedSquareValue('');
      e.preventDefault();
    }
    
  }

  setCursor(row, col) {
    console.log('set cursor ' + row + ',' + col);
    this.setState({
      cursor: {
        row: row,
        col: col
      }
    });
  }

  addSelectedCell(row, col) {
    this.setCursor(row, col);
    const index = this.coordToIndex({row: row, col: col});
    let selected = [...this.state.selected];
    const aleadySelected = selected.indexOf(index);
    if (aleadySelected >= 0) {
      selected.splice(aleadySelected, 1)
    }
    else {
      selected.push(index);
    }
    console.log(selected);
    this.setState({
      selected: selected
    });
  }

  handleCellClick(row, col, e) {
    console.log(row + ", " + col);
    // todo want a flag to indicate if we can select multiple
    // assume we can for now
    console.log(e.target);
    this.addSelectedCell(row, col);
  }

  contiguous(indexes) {
    // check all the indexes are contiguous
    return true;
  }

  markSquares(indexes, newClass) {
    const history = [...this.state.history];
    const current = history[history.length - 1];
    const squares = [...current.squares];
    // if (calculateWinner(squares) || squares[i]) {
    //   return;
    // }
    for (let i of indexes) {
      squares[i] = {
        value: squares[i].value,
        classNames: [newClass].concat(squares[i].classNames)
      };
    }
    
    this.setState({
      history: history.concat([{
        squares: squares,
      }]),
      stepNumber: history.length
    });
  }

  saveTotal(total, indexes) {
    console.log('save ' + total + ' for ' + indexes);

    if (!this.contiguous(indexes)) {
      return;
    }

    // mark all squares as grouped
    this.markSquares(indexes, 'grouped');

    let used = [...this.state.groups.used].concat(indexes);
    let totals = [...this.state.groups.totals];
    totals.push({
      total: total,
      indexes: indexes
    });
    this.setState( {
      groups: {
        used: used,
        totals: totals
      },
      selected: []
    });
    console.log(this.state.groups);
  }

  jumpTo(step) {
    this.setState({
      stepNumber: step
    });
  }

  render() {
    const history = this.state.history;
    const current = history[this.state.stepNumber];
    // const winner = calculateWinner(current.squares);

    let moves = '/* TODO */';
    // const moves = history.map((step, move) => {
    //   const desc = (move > 0) ?
    //     'Go to move #' + move :
    //     'Go to game start';
    //   return (
    //     <li key={move}>
    //       <button onClick={() => this.jumpTo(move)}>{desc}</button>
    //     </li>
    //   );
    // });

    let status = '/* TODO */';
    console.log('gridSize in Game is ' + this.gridSize);
    return (
      <div className="container">
        <DrawGroups
            groups={this.state.groups}
        />
        <div className="game">
          <div className="game-board">
            <Grid 
              squares={current.squares}
              selected={this.state.selected}
              cursor={this.state.cursor}
              onClick={this.handleCellClick}
              gridSize={this.gridSize}
            />
          </div>
          <div className="game-info">
            <div>{status}</div>
            <ol>{moves}</ol>
            <div>button to allow start position to be saved</div>
            <Group
              saveTotal={this.saveTotal}
              selected={this.state.selected}
            />
          </div>
        </div>
      </div>
    );
  }

  componentDidMount() {
    window.onkeydown = this.handleKeyDown;
    window.focus();
  }
}
  
  // ========================================
  
  ReactDOM.render(
    <Game 
      boxSize="3" 
      numBoxes="3" 
    />,
    document.getElementById('root')
  );
  
  function checkForLayoutConflicts(layouts, squares, conflicts) {
    layouts.forEach((layout) => {
      let has = {};
      layout.forEach((pos) => {
        let value = squares[pos].value;
        if (value !== '') {
          if (!has[value]) {
            has[value] = [];
          }
          has[value].push(pos);
        }
      });
      for (let positions of has) {
        if (positions.length >= 2) {
          positions.forEach((pos) => {
            conflicts[pos] = true;
          });
        }
      };
    });
    
  }

  function checkForConflicts(gridLayout, squares) {

    let conflicts = [];
    while (conflicts.length < squares.length) {
      conflicts.push(false);
    }

    //checkForRowConflicts(squares, conflicts);
    //checkForColumnConflicts(squares, conflicts)
    //checkForBoxConflicts(squares, conflicts)
    checkForLayoutConflicts(gridLayout.rows, squares, conflicts)
    checkForLayoutConflicts(gridLayout.cols, squares, conflicts)
    checkForLayoutConflicts(gridLayout.boxes, squares, conflicts)
    
    for (let pos = 0; pos < squares.length; pos++) {
      squares[pos].classNames.conflict = conflicts[pos];
    };

  }

  // function calculateWinner(squares) {
  //   const lines = [
  //     [0, 1, 2],
  //     [3, 4, 5],
  //     [6, 7, 8],
  //     [0, 3, 6],
  //     [1, 4, 7],
  //     [2, 5, 8],
  //     [0, 4, 8],
  //     [2, 4, 6],
  //   ];
  //   for (let i = 0; i < lines.length; i++) {
  //     const [a, b, c] = lines[i];
  //     if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
  //       return squares[a];
  //     }
  //   }
  //   return null;
  // }