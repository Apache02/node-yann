var MDArray		= require('./../MDArray');


// new 4x3x2 array
var arr = MDArray.create(4, 3, 2);

for ( var i=0; i<arr.length; i++ ) {
	arr[i] = i + 1;
}

console.log(arr);
console.log(arr.length);

var coords = MDArray.Coords.from([2,0,1]);
coords.sizes = arr.sizes;
//var coords = [2, 0, 1];
var index = 0;
console.log(coords, '(...) => i', index = arr.coordsToIndex(coords));
console.log(coords, arr.at(... coords));
console.log(index, 'i => (...)', arr.indexToCoords(index));

//arr.fill((x, y, z) => x*5+y*7+z*11);
console.log(arr);


for ( var i = MDArray.Coords.from(arr); true; ) {
	console.log(i, arr.at(...i));
	if ( !i.next() ) {
		break;
	}
}


console.log(arr.fetch(null, 0)); // => (4, 1, 2);

/*
    ____________________
   / 13 / 14 / 15 / 16 /|
  /____/___ /____/___ / |
 /  1 /  2 /  3 /  4 /| /
/____/____/____/____/ |/
|  1 |  2 |  3 |  4 | /
|____|____|____|____|/

*/

console.log(arr.fetch(0).sum());
console.log(arr.fetch(1).sum());
console.log(arr.fetch(2).sum());
console.log(arr.fetch(2).sum(2));


var arr = MDArray.create(2, 2).fill(c => {
	let r = Math.random();
	console.log(c, r);
	return r;
});
console.log(arr);