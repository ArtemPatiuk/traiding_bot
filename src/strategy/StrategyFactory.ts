import { MarketState } from "../market/MarketState";
import { RoundManager } from "../market/RoundManager";

import { BaseStrategy } from "./BaseStrategy";
import { LockStrategy } from "./LockStrategy";
import { strategyConfigs } from "./strategy-list";



export class StrategyFactory {

    static createAll(
        market: MarketState,
        rounds: RoundManager
    ): BaseStrategy[] {

       return strategyConfigs.map(config =>
            new LockStrategy(
            config,
            market,
            rounds
            )
        );
    }
}