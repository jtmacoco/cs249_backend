export default class Lamport{
    constructor(node_id){
        this.vec = {}
        this.node_id = node_id
        this.vec[node_id] = 0 
    }
    get_vector(){
        return {...this.vec}
    }
    event(){
        if (!(this.node_id in this.vec))
            this.vec[this.node_id] = 0
        this.vec[this.node_id]++
    }
    receive(received_vec){
        for (const[node,time] of Object.entries(received_vec)){
            console.log(`node: ${node}`)
            if(!(node in this.vec))
            {
                console.log("hi")
                this.vec[node] = 0
            }
            this.vec[node] = Math.max(this.vec[node],time)
        }
        this.vec[this.node_id]++
        console.log(JSON.stringify(this.vec))
    }
    send(){
        this.vec[this.node_id]++
        return {...this.vec}
    }
}