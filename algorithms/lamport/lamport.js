export default class VectorClock{
    constructor(doc_id){
        this.vec = {}
        this.doc_id = doc_id
    }
    get_vector(){
        return {...this.vec}
    }
    get_docId(){
        return this.doc_id
    }
    add(node_id){
            this.vec[node_id] = 0
    }
    checkInVec(node_id){
        if (!(node_id in this.vec))
            this.add(node_id)
    }
    event(node_id){
        this.vec[node_id]++
    }
    receive(received_vec){
        for (const[node,time] of Object.entries(received_vec)){
            console.log(`node: ${node} time: ${time}`)
            if(!(node in this.vec))
            {
                this.vec[node] = 0
            }
            this.vec[node] = Math.max(this.vec[node],time)
        }
        
    }
    send(node_id){
        this.vec[node_id]++
        return {...this.vec}
    }
}