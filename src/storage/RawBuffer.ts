import { RawEvent } from "../types/events";


export class RawBuffer {
    private buffer: RawEvent[] = [];

    push(events:RawEvent){
        this.buffer.push(events);
    }

    drain():RawEvent[] {
        const copy = this.buffer;
        this.buffer = [];
        return copy
    }

    size(){
        return this.buffer.length;
    }
}