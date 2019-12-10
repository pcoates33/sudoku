import React from 'react';
import ReactDOM from 'react-dom';
import * as Utils from './utils';
import Shape from './shape';
import './index.css';
import GameLayout from './gameLayout';

class Square extends React.Component {
  constructor(props) {
    super(props);
    this.myRef = React.createRef();
  }

  render() {
    const square = this.props.square;
    
    let className = "square";
    for (let addClassName of square.classNames) {
      className += ' ' + addClassName;
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

class GroupForm extends React.Component {
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

  draw(ctx) {
    console.log('draw it');
    console.log(this.props.groups);
    const totals = this.props.groups.totals;
    for(let groupTotal of totals) {
      let shape = new Shape(Utils.indexesToCoords(groupTotal.indexes));
      let perimiter = shape.calculatePerimiter();

      ctx.beginPath();
      let start = perimiter[0];
      ctx.moveTo(start.x, start.y);
      for (let i = 1; i < perimiter.length; i++) {
        let nextPoint = perimiter[i];
        ctx.lineTo(nextPoint.x, nextPoint.y);
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#444422';
      ctx.setLineDash([2,3]);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.clearRect(start.x-1, start.y-1, 14, 11);
      ctx.fillText(groupTotal.total, start.x, start.y+8);
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
    this.gameLayout = new GameLayout(this.gridSize);
    
    //
    const number_squares=this.gridSize*this.gridSize;
    let squares = [];
    while (squares.length < number_squares) {
      squares.push({value: '', classNames: []});
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
      },
      mode: 'play'
    };

    this.handleCellClickDuringSetup = this.handleCellClickDuringSetup.bind(this);
    this.handleCellClickDuringPlay = this.handleCellClickDuringPlay.bind(this);
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

    if (this.state.mode === 'play') {
      this.setCursor(row, col);
    }
    else {
      this.toggleCellSelection(row, col);
    }
  }

  setSelectedSquareValue(key) {
    if (!this.state.cursor || ("123456789".indexOf(key) < 0 && key !== '')) {
      return;
    }

    const i = Utils.coordToIndex(this.state.cursor, this.gridSize);
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
    
    let conflicts = this.gameLayout.checkForConflicts(squares);
    this.clearClassName(squares, 'conflict')
    this.addClassName(squares, conflicts, 'conflict');

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
    this.setState({
      cursor: {
        row: row,
        col: col
      }
    });
  }

  toggleCellSelection(row, col) {
    
    const index = Utils.coordToIndex({row: row, col: col});
    let selected = [...this.state.selected];
    const aleadySelected = selected.indexOf(index);
    if (aleadySelected >= 0) {
      selected.splice(aleadySelected, 1)
    }
    else {
      selected.push(index);
    }
    this.setState({
      selected: selected
    });
  }

  handleCellClickDuringSetup(row, col, e) {
    this.toggleCellSelection(row, col);
  }

  handleCellClickDuringPlay(row, col, e) {
    this.setCursor(row, col);
  }

  contiguous(indexes) {
    // check all the indexes are contiguous
    return true;
  }

  clearClassName(squares, className) {
    for (let square of squares) {
      const classIndex = square.classNames.indexOf(className);
      if (classIndex >= 0) {
        square.classNames.splice(classIndex, 1)
      }
    }
  }

  addClassName(squares, indexes, newClass) {
    for (let i of indexes) {
      if (!squares[i].classNames.includes(newClass)) {
        squares[i].classNames.push(newClass);
      }
    }
  }

  markSquaresAndSetState(indexes, newClass) {
    const history = [...this.state.history];
    const current = history[history.length - 1];
    const squares = [...current.squares];
    // if (calculateWinner(squares) || squares[i]) {
    //   return;
    // }
    this.addClassName(squares, indexes, newClass);
    
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
      // TODO show error
      return;
    }

    // mark all squares as grouped
    this.markSquaresAndSetState(indexes, 'grouped');

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
    const handleClick = (this.state.mode === 'play') ? this.handleCellClickDuringPlay : this.handleCellClickDuringSetup;

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
              onClick={handleClick}
              gridSize={this.gridSize}
            />
          </div>
          <div className="game-info">
            <div>{status}</div>
            <ol>{moves}</ol>
            <div>button to allow start position to be saved</div>
            <GroupForm
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
    // load a game
    this.setState({
      groups: {
        used: [],
        totals: [
          {total: 13, indexes:[0,1]},
          {total: 8, indexes:[2,3]},
          {total: 12, indexes:[4,5,14,15]},
          {total: 17, indexes:[6,7]},
          {total: 7, indexes:[8,17]},
          {total: 7, indexes:[9,10]},
          {total: 17, indexes:[11,12]},
          {total: 12, indexes:[13,22]},
          {total: 5, indexes:[16,25]},
          {total: 3, indexes:[18,19]},
          {total: 15, indexes:[20,21]},
          {total: 15, indexes:[23,24]},
          {total: 20, indexes:[26,34,35]},
          {total: 8, indexes:[27,28]},
          {total: 3, indexes:[29,30]},
          {total: 8, indexes:[31,40]},
          {total: 12, indexes:[32,33]},
          {total: 16, indexes:[36,37]},
          {total: 14, indexes:[38,39]},
          {total: 8, indexes:[41,50]},
          {total: 10, indexes:[42,51]},
          {total: 4, indexes:[43,44]},
          {total: 23, indexes:[45,54,63,64]},
          {total: 14, indexes:[46,55]},
          {total: 11, indexes:[47,56]},
          {total: 16, indexes:[48,49]},
          {total: 7, indexes:[52,53]},
          {total: 6, indexes:[57,66]},
          {total: 4, indexes:[58,67]},
          {total: 16, indexes:[59,68]},
          {total: 3, indexes:[60,69]},
          {total: 9, indexes:[61,62]},
          {total: 9, indexes:[65,74,75]},
          {total: 13, indexes:[70,79]},
          {total: 17, indexes:[71,80]},
          {total: 6, indexes:[72,73]},
          {total: 17, indexes:[76,77,78]}
        ]
      }
    });
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
  
