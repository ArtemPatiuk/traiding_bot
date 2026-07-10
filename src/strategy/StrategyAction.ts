export enum ActionType {
    ROUND_STARTED = "ROUND_STARTED",
    ENTER = "ENTER",
    LOCK = "LOCK",
    ROUND_TIMEOUT = "ROUND_TIMEOUT"
}
export interface StrategyAction {
    strategy: string;
    type: ActionType;
    ts: number;
    round: string;

    firstSide?: "UP" | "DOWN";
    firstPrice?: number;

    secondSide?: "UP" | "DOWN";
    secondPrice?: number;

    sum?: number;
}