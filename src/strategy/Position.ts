export type PositionSide = "UP" | "DOWN";

export interface Position {
    side: PositionSide;
    tokenId: string;
    entryPrice: number;
    targetPrice: number;
    shares: number;
    entryTime: number;
}