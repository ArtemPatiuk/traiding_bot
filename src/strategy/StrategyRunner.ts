import { BaseStrategy } from "./BaseStrategy";
import { StrategyAction } from "./StrategyAction";
import { RoundManager } from "../market/RoundManager";
import { MarketState } from "../market/MarketState";
import { MarketEvent } from "../types/market";

export class StrategyRunner {

    private readonly strategies: BaseStrategy[] = [];

    constructor(
        private readonly market: MarketState,
        private readonly rounds: RoundManager
    ) {}

    add(strategy: BaseStrategy): void {
        this.strategies.push(strategy);
    }

    update(
        event: MarketEvent
    ): StrategyAction[] {

        const actions: StrategyAction[] = [];

        const changed = this.rounds.update(event.ts);

        if (changed) {

            console.log(
                "===== NEW ROUND =====",
                this.rounds.getRoundLabel()
            );

        }

        for (const strategy of this.strategies) {

            try {

                const action =
                    strategy.onMarketEvent(event);

                if (action) {
                    actions.push(action);
                }

            } catch (err) {

                console.error(
                    "STRATEGY ERROR",
                    err
                );

            }

        }

        return actions;

    }

}