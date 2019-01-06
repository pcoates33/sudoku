import * as Utils from './utils';

test("indexes to coords, default size is 9", () => {
    const coords = Utils.indexesToCoords([45,15, 2, 24]);
    expect(coords[0]).toEqual({row: 0,col: 2});
    expect(coords[1]).toEqual({row: 1,col: 6});
    expect(coords[2]).toEqual({row: 2,col: 6});
    expect(coords[3]).toEqual({row: 5,col: 0});
});

test("indexes to coords with size", () => {
    const coords = Utils.indexesToCoords([45,15, 2, 24], 5);
    expect(coords[0]).toEqual({row: 0,col: 2});
    expect(coords[1]).toEqual({row: 3,col: 0});
    expect(coords[2]).toEqual({row: 4,col: 4});
    expect(coords[3]).toEqual({row: 9,col: 0});
});

test("coord to index, default size is 9", () => {
    const index = Utils.coordToIndex({row: 1,col: 6});
    expect(index).toEqual(15);
});

test("coord to index with size", () => {
    const index = Utils.coordToIndex({row: 1,col: 3}, 5);
    expect(index).toEqual(8);
});

test("find rowcol", () => {
    const index = Utils.coordToIndex({row: 1,col: 3}, 5);
    expect(Utils.findRowCol([{row:1, col:1}, {row:1,col:2}], {row:1,col:1})).toEqual({row:1,col:1});
});

test("can't find rowcol", () => {
    const index = Utils.coordToIndex({row: 1,col: 3}, 5);
    expect(Utils.findRowCol([{row:1, col:1}, {row:1,col:2}], {row:4,col:2})).toBe(null);
});

test("noRowcol should be false", () => {
    const index = Utils.coordToIndex({row: 1,col: 3}, 5);
    expect(Utils.noRowCol([{row:1, col:1}, {row:1,col:2}], {row:1,col:1})).toBe(false);
});

test("noRowcol should be true", () => {
    const index = Utils.coordToIndex({row: 1,col: 3}, 5);
    expect(Utils.noRowCol([{row:1, col:1}, {row:1,col:2}], {row:4,col:2})).toBe(true);
});

test("move rowcol", () => {
    expect(Utils.moveRowCol({row:1, col:1}, 'up')).toEqual({row:0, col:1});
    expect(Utils.moveRowCol({row:1, col:1}, 'right')).toEqual({row:1, col:2});
    expect(Utils.moveRowCol({row:1, col:1}, 'down')).toEqual({row:2, col:1});
    expect(Utils.moveRowCol({row:1, col:1}, 'left')).toEqual({row:1, col:0});
});

