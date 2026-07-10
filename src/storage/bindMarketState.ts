import { eventBus } from "../core/EventBus";
import { Events } from "../types/events";
import { MarketState } from "../market/MarketState";
import { StrategyRunner } from "../strategy/StrategyRunner";
import { StrategyLogger } from "../strategy/StrategyLogger";

export function bindMarketState(
    marketState: MarketState,
    runner: StrategyRunner,
    logger: StrategyLogger
) {

    console.log("bindMarketState registered");

    eventBus.on(
        Events.MARKET_EVENT,
        (event) => {

            marketState.update(event);

            const actions =
                runner.update(event);

            for (const action of actions) {

                logger.log(action);

            }

        }
    );

}