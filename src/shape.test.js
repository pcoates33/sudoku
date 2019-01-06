import Shape from './shape';

test("Single cell", () => {
    let shape = new Shape([{row:1, col:1}]);

    let perimiter = shape.calculatePerimiter();

    expect(perimiter).toEqual([{x:45,y:46},{x:82,y:46},{x:82,y:83},{x:45,y:83},{x:45,y:46}]);
});

test("Two cells left to right", () => {
    let shape = new Shape([{row:1, col:1},{row:1,col:2}]);

    let perimiter = shape.calculatePerimiter();

    expect(perimiter).toEqual([{x:45,y:46},{x:82,y:46},{x:86,y:46},{x:123,y:46},{x:123,y:83},{x:86,y:83},{x:82,y:83},{x:45,y:83},{x:45,y:46}]);
});

test("Four cells 2 offset", () => {
    let shape = new Shape([{row:1, col:1},{row:1,col:2},{row:2,col:2},{row:2,col:3}]);

    let perimiter = shape.calculatePerimiter();

    expect(perimiter).toEqual([{x:45,y:46},{x:82,y:46},{x:86,y:46},{x:123,y:46},{x:123,y:83},{x:128,y:87},{x:165,y:87},{x:165,y:124},{x:128,y:124},{x:123,y:124},{x:86,y:124},{x:86,y:87},{x:82,y:83},{x:45,y:83},{x:45,y:46}]);
});