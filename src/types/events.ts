export enum Events {
    MARKET_EVENT = "market:event",
    MARKET_UPDATED = "market:updated",
    CONNECTED = "socket:connected",
    DISCONNECTED = "socket:disconnected",
    ERROR = "socket:error"
}
export type RawEvent = {
    ts: number;
    payload: unknown;
};
