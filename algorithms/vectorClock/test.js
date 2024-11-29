import VectorClock from "./lamport.js";
let v1 = new VectorClock('d1')
let v2 = new VectorClock('d1')
v1.add('a')
v1.add('b')
v1.add('c')

v2.add('a')
v2.add('b')
v2.add('c')

/*
v1.event('a')
v1.event('a')
v1.event('a')

v2.event('a')
v2.event('a')

v2.event('b')
v2.event('b')

v2.event('c')
*/

v1.event('c')

v2.event('a')
v2.event('a')
v2.event('b')
v2.event('b')
v2.event('b')
v2.event('c')

console.log(v1.get_vector())
console.log(v2.get_vector())

console.log(v1.isConcurrent(v2.get_vector(),'d1'))