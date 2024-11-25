import Lamport from './lamport.js';

let l0 = new Lamport(1)
let l1 = new Lamport(1)
let l2 = new Lamport(2)
console.log(`l1: ${l1}`)
console.log(l1.receive(l0.send()))