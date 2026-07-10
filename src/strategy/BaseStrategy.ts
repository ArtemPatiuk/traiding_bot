import { MarketState } from "../market/MarketState";
import { RoundManager } from "../market/RoundManager";
import { StrategyAction } from "./StrategyAction";
import { StrategyConfig } from "./StrategyConfig";
import { MarketEvent } from "../types/market";

export abstract class BaseStrategy {

    constructor(
        protected readonly config: StrategyConfig,
        protected readonly market: MarketState,
        protected readonly rounds: RoundManager
    ) {}

    abstract onMarketEvent(
        event: MarketEvent
    ): StrategyAction | null;

}