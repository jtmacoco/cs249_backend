class Lamport{
    constructor(num_nodes,node_id){
        this.vec = new Array(num_nodes).fill(0)
        this.node_id = node_id
    }
    event(){
        this.vec[this.node_id]++
    }
    receive(received_vec){
        for(let i = 0; i < this.vec.length; i++){
            this.vec[i] = Math.max(this.vec[i],received_vec[i])
        }
    }
    send(){
        this.vec[node_id]++
        return this.vec
    }
}