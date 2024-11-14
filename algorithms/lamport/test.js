import Lamport from './lamport.js';

let l0 = new Lamport(0)
let l1 = new Lamport(1)
let l2 = new Lamport(2)
console.log(l0)
console.log(`before l1: ${JSON.stringify(l1.get_vector())}`)
console.log(l1.receive(l0.send()))
console.log(`after l1: ${JSON.stringify(l1.get_vector())}`)