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
    if (this.props.selected) {
      className += " selected"
    }
    if ((this.props.row % 3) === 0) {
      className += ' box-row-start';
    } 
    if ((this.props.col % 3) === 0) {
      className += ' box-col-start';
    } 

    let row_col = this.props.row + "-" + this.props.col;
    
    return (
      // <input ref={this.myRef} data-row-col={row_col} data-row={this.props.row} data-col={this.props.col} className={className} value={square.value} 
      // onChange={this.props.onChange} onFocus={(e) => e.target.select()} onMouseUp={() => false}/>
      <div ref={this.myRef} data-row-col={row_col} data-row={this.props.row} data-col={this.props.col} className={className}
      onClick={this.props.onClick}
//      onKeyUp={(e) => console.log('keyUp')} 
//      onMouseUp={(e) => {console.log('mouseUp');;e.target.focus();}}>1{square.value}
      >{square.value}</div>
    );
  }

}
  
class Grid extends React.Component {

  renderSquare(row, col) {
    const i = (row*this.props.gridSize) + col;
    const selected = ((this.props.selected.row === row) && (this.props.selected.col === col));
    
    return (
      <Square 
        key={i}
        row={row}
        col={col}
        square={this.props.squares[i]}
        selected={selected}
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
      selected: {
        row: 0,
        col: 0
      }
    };

    this.handleCellClick = this.handleCellClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    
  }

  moveSelected(code) {
    if (!this.state.selected) {
      return;
    }
    let row = this.state.selected.row;
    let col = this.state.selected.col;
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

    this.setState({
      selected: {
        row: row,
        col: col
      }
    });
  }

  coordToIndex(coord) {
    return (coord.row * this.gridSize) + coord.col;
  }

  setSelectedSquareValue(key) {
    if ("123456789".indexOf(key) < 0 && key !== '') {
      return;
    }

    const i = this.coordToIndex(this.state.selected);
    const history = [...this.state.history];
    const current = history[history.length - 1];
    const squares = [...current.squares];
    // if (calculateWinner(squares) || squares[i]) {
    //   return;
    // }

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
      this.moveSelected(code);
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

  handleCellClick(row, col, e) {
    console.log(row + ", " + col);
    console.log(e.target);
    this.setState({
      selected: {
        row: row,
        col: col
      }
    });
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
      <div className="game">
        <div className="game-board">
          <Grid 
            squares={current.squares}
            selected={this.state.selected}
            onClick={this.handleCellClick}
            gridSize={this.gridSize}
          />
        </div>
        <div className="game-info">
          <div>{status}</div>
          <ol>{moves}</ol>
          <div>button to allow start position to be saved</div>
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
      for (let value in has) {
        let positions = has[value];
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