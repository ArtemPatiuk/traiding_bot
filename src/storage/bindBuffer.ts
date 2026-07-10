import { eventBus } from "../core/EventBus";
import { Events } from "../types/events";
import { RawBuffer } from "./RawBuffer";

export function bindBuffer(buffer: RawBuffer) {

    eventBus.on(Events.MARKET_EVENT, (event) => {

        buffer.push({   
            ts: Date.now(),
            payload: event,
        }
    );

    });

}