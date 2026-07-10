import { startCollector } from "./collector/polymarket";
import { MarketContext } from "./market/MarketContext";
import { MarketState } from "./market/MarketState";
import { RoundManager } from "./market/RoundManager";
import { RawBuffer } from "./storage/RawBuffer";
import { RawBufferWriter } from "./storage/RawBufferWriter";
import { bindBuffer } from "./storage/bindBuffer";
import { bindMarketState } from "./storage/bindMarketState";
import { StrategyFactory } from "./strategy/StrategyFactory";
import { StrategyRunner } from "./strategy/StrategyRunner";
import { StrategyLogger } from "./strategy/StrategyLogger";

import { eventBus } from "./core/EventBus";
import { Events } from "./types/events";

const context = new MarketContext();

const buffer = new RawBuffer();
const writer = new RawBufferWriter("market.jsonl");

const marketState = new MarketState(context);
const rounds = new RoundManager();

/*
|--------------------------------------------------------------------------
| Создаем все стратегии
|--------------------------------------------------------------------------
*/

const strategies = StrategyFactory.createAll(
    marketState,
    rounds
);

/*
|--------------------------------------------------------------------------
| Создаем Runner
|--------------------------------------------------------------------------
*/

const runner = new StrategyRunner(
    marketState,
    rounds
);
const logger = new StrategyLogger();

for (const strategy of strategies) {
    runner.add(strategy);
}

/*
|--------------------------------------------------------------------------
| Привязки
|--------------------------------------------------------------------------
*/

bindBuffer(buffer);
bindMarketState(
    marketState,
    runner,
    logger
);

/*
|--------------------------------------------------------------------------
| Обработка обновления рынка
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Запуск
|--------------------------------------------------------------------------
*/

startCollector(context).catch(console.error);

setInterval(() => {
    writer.flush(buffer);
}, 100);