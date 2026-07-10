export interface MarketEvent {
    tokenId: string;
    price: number;
    bid: number;
    ask: number;
    size: number;
    side: "BUY" | "SELL" | string;
    ts: number;
}
export interface RawMarketEvent {
    receivedAt: number;
    payload: unknown;
}
export interface TokenState {
    tokenId: string;
    bid: number;
    ask: number;
    price: number;
    size: number;
    side: string;
    lastUpdate: number;
}