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
            //console.log(`node: ${node} time: ${time}`)
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
    isConcurrent(otherVc){
        const v1 = this.vec
        const v2 = otherVc
        if(!v1 || !v2){
            return false
        }
        let v1Beforev2 = false
        let v2Beforev1 = false
        for(const[node,time1] of Object.entries(v1)){
            const time2 = v2[node] || 0
            //console.log("node:",node,"time1:",time1,"time2:",time2)
            if(time1<time2){
                v1Beforev2=true
            }
            else if(time1>time2){
                v2Beforev1=true
            }
        }
        for (const [node, time2] of Object.entries(v2)) {
            const time1 = v1[node] || 0;  // Default to 0 if node is not in v1
            //console.log("node:",node,"time1:",time1,"time2:",time2)
            if (time2 < time1) {
                v2Beforev1 = true;  // v2 is behind v1 for this node
            } else if (time2 > time1) {
                v1Beforev2 = true;  // v1 is behind v2 for this node
            }
        }
    
        return v1Beforev2 && v2Beforev1; 
    }
}