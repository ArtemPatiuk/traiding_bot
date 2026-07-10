import fs from 'fs';

import {RawBuffer} from './RawBuffer'

export class RawBufferWriter {
    private stream:fs.WriteStream;
    private flushing = false;

    constructor(path:string){
        this.stream = fs.createWriteStream(path,{flags:"a"});
    }

    async flush(buffer:RawBuffer){
        if(this.flushing) return;
        this.flushing = true;

        const data = buffer.drain();

        if(data.length === 0) {
            this.flushing = false;
            return;
        }

        const chunk = data
        .map(e => JSON.stringify(e))
        .join("\n") + "\n";

        if(!this.stream.write(chunk)){
            await new Promise(res => this.stream.once("drain",res));
        }
        this.flushing = false;
    }
    close(){
        this.stream.end();
    }
}