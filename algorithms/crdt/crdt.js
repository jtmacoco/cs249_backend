import VectorClock from "../vectorClock/vectorClock.js";
export default class CrdtRga {
    constructor(initialDoc = "", DocId) {
        this.curDoc = initialDoc
        this.lines = initialDoc.split('\n');
        this.vc = new VectorClock(DocId)
    }
    getDoc() {
        return this.curDoc
    }
    applyChanges(changes, newVc) {
        let changesLog = [];
        this.vc.receive(newVc)
        for (let { range, text, type } of changes) {
            const { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec } = range;
            if (type === 'insert') {
                if (text === '\n' || text === '\r\n') {
                    // Inserting a new line at the start position
                    if(this.lines[sln-1] == undefined){
                        for (let i = 0;  i<sln;i++){
                            if(this.lines[i]==undefined){
                                this.lines.push("")
                            }
                        }
                    }
                    const lineBefore = this.lines[sln - 1].slice(0, sc - 1);
                    const lineAfter = this.lines[sln - 1].slice(sc - 1);

                    this.lines.splice(sln - 1, 1, lineBefore, lineAfter);
                    changesLog.push({
                        type: 'insert',
                        range: { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec },
                        text: '\n'
                    });
                } //this else if will pas
                else if (text.split('\n').length > 1){//copy and paste multiple lines works wth pasting inbetween multiple words/sentences
                    const multiLine=text.split('\n')
                    const start = sln-1
                    let end = 0
                    if(this.lines[start] === undefined){
                        this.lines.push("")
                    }
                    if (this.lines[start + 0][ec - 1] !== undefined && this.lines[start + 0][ec - 1] !== '') {
                        end = (start+multiLine.length+this.lines.length)-1
                    }
                    else{
                        end = (start+multiLine.length)-1
                    }
                    const newStart = this.lines.length
                    const tmp = this.lines.slice(sln,this.lines.length)
                    for(let i = start; i < end;i++){
                        if(this.lines[start+i]===undefined)
                        {
                            this.lines.push("")
                        }
                    }
                    let prevEnd = ""
                    for (let i = 0; i < multiLine.length; i++) {
                        if(i === 0){
                            prevEnd=this.lines[start + i].slice(ec - 1);
                            this.lines[start + i] = this.lines[start + i].slice(0, sc - 1) + multiLine[i]
                        }
                        else{
                            this.lines[start+i]=multiLine[i]
                        }
                        if(i+1 >= multiLine.length){
                            multiLine[i]+=prevEnd
                            this.lines[i]+=prevEnd
                            changesLog.push({
                            type:'insert',
                            range: { startLineNumber: sln+i, startColumn: 0, endLineNumber: eln+i, endColumn: ec+multiLine[i].length },
                            text:multiLine[i]
                        })
                        }
                        else{
                        changesLog.push({
                            type:'insert',
                            range: { startLineNumber: sln+i, startColumn: 0, endLineNumber: eln+i, endColumn: ec+multiLine[i].length },
                            text:this.lines[start+i]
                        })
                    }
                    }
                    let j = newStart
                    for(let i = 0; i < tmp.length;i++){
                        this.lines[j]=tmp[i]
                        changesLog.push({
                            type:'insert',
                            range: { startLineNumber: sln+j, startColumn: 0, endLineNumber: eln+j, endColumn:eln+this.lines[j].length },
                            text:this.lines[j]
                        })
                        j+=1
                    }
                }
                else {
                    // Inserting text on the same line
                    /*
                    for(let i = 0; i < sln; i++){
                    if(this.lines[i] == undefined){
                        this.lines.push("")
                    }
                }
                        */
                    this.lines[sln - 1] = this.lines[sln - 1].slice(0, sc - 1) + text + this.lines[sln - 1].slice(ec - 1);
                    changesLog.push({
                        type: 'insert',
                        range: { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec },
                        text: text
                    });
                }
            } else if (type === 'delete') {
                if (sc === 1 && sln > 1) {
                    // Deleting a whole line and merging with the previous line
                    const curLine = this.lines[sln - 1];
                    const prevLine = this.lines[sln - 2];
                    this.lines[sln - 2] = prevLine + curLine;
                    this.lines.splice(sln - 1, 1);
                    changesLog.push({
                        type: 'delete',
                        range: { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec },
                        text: '\n'
                    });
                } else {
                    // Deleting text on the same line
                    const deletedText = this.lines[sln - 1].slice(sc - 1, ec - 1);
                    if (sln != eln) {//if select multiple lines using ctrl a or something handle
                        this.lines[sln - 1] = this.lines[sln - 1].slice(0, sc - 1)
                        let tmp = (this.lines[eln - 1] && this.lines[eln - 1].slice(ec - 1)) || this.lines[sln - 1];
                        this.lines = [
                            ...this.lines.slice(0, sln - 1),  // lines before sln
                            tmp,
                            ...this.lines.slice(eln)  // lines after eln
                        ];
                    }
                    else {
                        this.lines[sln - 1] = this.lines[sln - 1].slice(0, sc - 1) + this.lines[sln - 1].slice(ec - 1);
                    }

                    changesLog.push({
                        type: 'delete',
                        range: { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec },
                        text: deletedText
                    });
                }
            }
        }
        this.curDoc = this.lines.join('\n')
        return { curDoc: this.curDoc, changesLog: changesLog }
    }
    convert(changes) {
        let newChanges = []
        let update = null
        for (let { range, text, type } of changes) {
            const { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec } = range;
            if (update && update.type === type &&
                update.range.endLineNumber === sln &&
                update.range.endColumn+1 === sc) {
                update.text += text
                update.range.endColumn = ec;
            }
            else {
                if (update) { newChanges.push(update) }
                update = {
                    type: 'insert', text: text, range: {
                        startLineNumber: sln,
                        startColumn: sc,
                        endLineNumber: eln,
                        endColumn: ec,
                    }
                }
            }
        }
        if (update) { newChanges.push(update) }
        return newChanges
    }
    resolveConflict(existingText, newText, uid, conflictingNodes) {
        let mergedText = ""
        if(newText==existingText){
            return {
            text:newText,conflict:false}}
        if(existingText.length === 0){return {text:newText,conflict:false}}
        const conflictTime = this.vc.getTime(uid);
        let flag = false
        const conflicts = conflictingNodes.map(node => ({
            node,
            time: this.vc.getTime(node),
        }));

        conflicts.push({ node: uid, time: conflictTime });
        conflicts.sort((a, b) => b.time - a.time);


        conflicts.forEach(conflict => {
            if (conflict.node === uid) {
                mergedText = mergedText + newText;
            } else {
                mergedText = mergedText + existingText;
                flag = true
            }
        });
        if (!flag) { mergedText += existingText }
        return {text:mergedText,conflict:true};
    }

    merge(conflictData) {
        let changesLog = []
        let conflict = true
        let { changes, conflictVc, conflictingNodes, uid } = conflictData;
        const prevChanges = changes
        changes = this.convert(changes)
        conflictingNodes = conflictingNodes.filter(node => node !== uid);
        let mergerLine = undefined
        this.vc.receive(conflictVc)
        for (let { range, text, type } of changes) {
            const { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec } = range;
            if (type === 'insert' && text.length > 0) {
                if (text === '\n' || text === '\r\n'||text==="") {
                    // Inserting a new line at the start position
                    //conflict=false
                    if(this.lines[sln-1]==undefined){
                        for(let i = 0; i < sln;i++){
                            if(this.lines[i]==undefined){
                                this.lines.push("")
                            }
                        }
                    }
                    const existingText = this.lines[sln - 1].slice(sc - 1, ec)
                    const resolved= this.resolveConflict(existingText, text, uid, conflictingNodes);
                    conflict=false
                    const resolvedText=resolved.text
                    const lineBefore = this.lines[sln - 1].slice(0, sc - 1);
                    const lineAfter = this.lines[sln - 1].slice(sc - 1);
                    this.lines.splice(sln - 1, 1, lineBefore, lineAfter);
                    
                    changesLog.push({
                        type: 'insert',
                        range: { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec },
                        text: resolvedText
                    });
                } else {
                    if(this.lines[sln-1]==undefined){
                        for(let i = 0; i < sln;i++){
                            if(this.lines[i]==undefined){
                                this.lines.push("")
                            }
                        }
                    }
                const existingText = this.lines[sln - 1].slice(sc - 1, ec)
                if (existingText != text) {
                    mergerLine=sln
                    const resolved= this.resolveConflict(existingText, text, uid, conflictingNodes);
                    const resolvedText=resolved.text
                    conflict=resolved.conflict
                    this.lines[sln - 1] = this.lines[sln - 1].slice(0, sc - 1) + resolvedText + this.lines[sln - 1].slice(ec)
                   
                    changesLog.push({
                        type: 'insert',
                        range: { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec+resolvedText.length},
                        text: resolvedText
                    });
                }
            }
            }
            else {
                conflict=true
                const deletedText = this.lines[sln - 1].slice(sc - 1, ec - 1);
                if (sln != eln) {//if select multiple lines using ctrl a or something handle
                    this.lines[sln - 1] = this.lines[sln - 1].slice(0, sc - 1)
                    let tmp = (this.lines[eln - 1] && this.lines[eln - 1].slice(ec - 1)) || this.lines[sln - 1];
                    this.lines = [
                        ...this.lines.slice(0, sln - 1),  // lines before sln
                        tmp,
                        ...this.lines.slice(eln)  // lines after eln
                    ];
                }
                else {
                    this.lines[sln - 1] = this.lines[sln - 1].slice(0, sc - 1) + this.lines[sln - 1].slice(ec - 1);
                }
                if (deletedText!==undefined) {
                    this.lines[sln - 1] = this.lines[sln - 1].slice(0, sc - 1) + this.lines[sln - 1].slice(ec);
                    changesLog.push({
                        type: 'delete',
                        range: { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec },
                        text: deletedText
                    });
                }
            }
        }
        let mergerLines=changesLog
        if(this.lines[mergerLine-1]!==undefined && mergerLine!==undefined)
        {
        mergerLines=[{
            type:'insert',
            range: { startLineNumber: mergerLine, startColumn: 0, endLineNumber: mergerLine, endColumn: this.lines[mergerLine-1].length+1},
            text:this.lines[mergerLine-1]
        }]
    }
        this.curDoc = this.lines.join('\n');
        return { curDoc: this.curDoc, changesLog: changesLog, vc: this.vc,conflict:conflict,mergedLine:mergerLines}
    }
}
