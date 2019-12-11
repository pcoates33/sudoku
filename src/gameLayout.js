
// layout the game on a 9x9 grid. Keeping track of rows, columns, and the 3x3 boxes
export default class GameLayout {

    constructor(gridSize) {
      this.gridSize = gridSize;
      this.rows = [];
      this.cols = [];
      this.boxes = [];

      // the rows
      for (let row = 0; row < this.gridSize; row++) {
        let rowLayout = [];
        for (let col = 0; col < this.gridSize; col++) {
          rowLayout.push((row*this.gridSize)+col);
        }
        this.rows.push(rowLayout);
      }
      // The columns
      for (let col = 0; col < this.gridSize; col++) {
        let colLayout = [];
        for (let row = 0; row < this.gridSize; row++) {
          colLayout.push((row*this.gridSize)+col);
        }
        this.cols.push(colLayout);
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
          this.boxes.push(boxLayout);  
        }  
      }
    }

    checkForConflicts(squares) {

      return [].concat(
        this.checkForLayoutConflicts(this.rows, squares),
        this.checkForLayoutConflicts(this.cols, squares),
        this.checkForLayoutConflicts(this.boxes, squares)
      );
        
    }

    checkForLayoutConflicts(layouts, squares) {
      let conflicts = [];
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
              conflicts.push(pos);
            });
          }
        };
      });
      return conflicts;
    }

    checkForBadTotals(squares, groups) {

      let badTotals = { indexes: [], count: 0};

      groups.totals.forEach((total) => {
        let sumValues = 0;
        let groupComplete = true;
        for (let index of total.indexes) {
          // see if it has a value.
          if (squares[index].value === '') {
            groupComplete = false;
          } else {
            sumValues += parseInt(squares[index].value, 10);
          }
        }
        if (groupComplete && total.total !== sumValues) {
          badTotals.count++;
          badTotals.indexes = badTotals.indexes.concat(total.indexes);
        }
      });
     
      return badTotals;
    }

    findSelectedGroup(groups, selectedIndex) {
      let selectedGroup = [];

      groups.totals.forEach((total) => {
        for (let index of total.indexes) {
          // see if it is the index we're looking for.
          if (selectedIndex === index) {
            selectedGroup = selectedGroup.concat(total.indexes);
          }
        }
      });
     
      return selectedGroup;
    }

}