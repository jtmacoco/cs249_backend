import VectorClock from "../lamport/lamport.js";
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
                if (text === '\n') {
                    // Inserting a new line at the start position
                    const lineBefore = this.lines[sln - 1].slice(0, sc - 1);
                    const lineAfter = this.lines[sln - 1].slice(sc - 1);
                    
                    this.lines.splice(sln - 1, 1, lineBefore, lineAfter);
                    changesLog.push({
                        type: 'insert',
                        range: { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec  },
                        text: '\n'
                    });
                } else {
                    // Inserting text on the same line
                    this.lines[sln - 1] = this.lines[sln - 1].slice(0, sc - 1) + text + this.lines[sln - 1].slice(ec-1);
                    changesLog.push({
                        type: 'insert',
                        range: { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec  },
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
        //console.log("curDoc:",this.curDoc,"changesLog:",changesLog)
        return { curDoc: this.curDoc, changesLog: changesLog }
    }
    resolveConflict(existingText, newText, uid, conflictingNodes) {
        let mergedText=""
        const conflictTime = this.vc.getTime(uid);
        const conflicts = conflictingNodes.map(node => ({
            node,
            time: this.vc.getTime(node),
        }));
    
        conflicts.push({ node: uid, time: conflictTime });
    
        conflicts.forEach(conflict => {
            console.log("conflict:",conflict,"newText:",newText,"existingText:",existingText)
            if (conflict.node === uid) {
                mergedText = mergedText + newText;  
            } else {
                mergedText = mergedText + existingText; 
            }
        });
        console.log("merged text:",mergedText)
        return mergedText;
    }
    
    merge(conflictData) {
        console.log("confict")
        let changesLog=[]
        let{ changes, conflictVc,conflictingNodes,uid } = conflictData;
        conflictingNodes = conflictingNodes.filter(node => node !== uid);
        this.vc.receive(conflictVc)
        for (let { range, text, type } of changes) {
            const { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec } = range;
            if (type === 'insert') {
                const existingText = this.lines[sln - 1].slice(sc - 1, ec)
                if (existingText != text) {
                    const resolvedText = this.resolveConflict(existingText, text,uid,conflictingNodes);
                    this.lines[sln - 1] = this.lines[sln - 1].slice(0, sc - 1) + resolvedText + this.lines[sln - 1].slice(sc - 1);
                    changesLog.push({
                        type: 'insert',
                        range: { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec },
                        text: resolvedText
                    });
                }
            }
            else {
                const deletedText = this.lines[sln - 1].slice(sc - 1, ec )
                if (deletedText) {
                    this.lines[sln - 1] = this.lines[sln - 1].slice(0, sc - 1) + this.lines[sln - 1].slice(ec );
                    changesLog.push({
                        type: 'delete',
                        range: { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec },
                        text: deletedText
                    });
                }
            }
        }
        this.curDoc = this.lines.join('\n');
        return { curDoc: this.curDoc, changesLog: changesLog }
    }
}
