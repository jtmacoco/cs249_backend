export default class CrdtRga {
    constructor(initialDoc = "") {
        this.curDoc = initialDoc
        this.lines = initialDoc.split('\n');
    }
    getDoc(){
        return this.curDoc
    }
    applyChanges(changes) {
        let changesLog = [];

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
                        range: { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec + 1 },
                        text: '\n'
                    });
                } else {
                    // Inserting text on the same line
                    this.lines[sln - 1] = this.lines[sln - 1].slice(0, sc - 1) + text + this.lines[sln - 1].slice(ec);
                    changesLog.push({
                        type: 'insert',
                        range: { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec + 1 },
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
                    this.lines[sln - 1] = this.lines[sln - 1].slice(0, sc - 1) + this.lines[sln - 1].slice(ec - 1);

                    changesLog.push({
                        type: 'delete',
                        range: { startLineNumber: sln, startColumn: sc, endLineNumber: eln, endColumn: ec },
                        text: deletedText
                    });
                }
            }
        }
        this.curDoc=this.lines.join('\n')
        //console.log("curDoc:",this.curDoc,"changesLog:",changesLog)
        return {curDoc:this.curDoc,changesLog:changesLog}
    }
}
