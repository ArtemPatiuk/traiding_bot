import { BaseStrategy } from "./BaseStrategy";
import { StrategyState } from "./StrategyState";
import { Position } from "./Position";
import { MarketState } from "../market/MarketState";
import { ActionType, StrategyAction } from "./StrategyAction";
import { MarketEvent } from "../types/market";

export class LockStrategy extends BaseStrategy {

    private state = StrategyState.WAIT_FIRST_ENTRY;

    private position?: Position;

    private currentRound = "";

    onMarketEvent(
        event: MarketEvent
    ): StrategyAction | null {

        const round = this.rounds.getRoundLabel();

        if (round !== this.currentRound) {

            this.currentRound = round;

            this.position = undefined;

            this.state = StrategyState.WAIT_FIRST_ENTRY;

            return {
                strategy: this.config.name,
                type: ActionType.ROUND_STARTED,
                ts: event.ts,
                round: this.currentRound
            };

        }

        switch (this.state) {

            case StrategyState.WAIT_FIRST_ENTRY:
                return this.tryEnter(event);

            case StrategyState.WAIT_SECOND_ENTRY:
                return this.tryLock(event);

            default:
                return null;

        }

    }

    private tryEnter(
        event: MarketEvent
    ): StrategyAction | null {

        if (!this.rounds.canTrade(event.ts)) {

            this.state = StrategyState.ROUND_FINISHED;

            return {
                strategy: this.config.name,
                type: ActionType.ROUND_TIMEOUT,
                ts: event.ts,
                round: this.currentRound
            };

        }

        const up = this.market.getUp();
        const down = this.market.getDown();

        if (!up || !down) {
            return null;
        }

        if (
            event.tokenId === up.tokenId &&
            up.bid <= this.config.entryPrice
        ) {

            this.position = {
                side: "UP",
                tokenId: up.tokenId,
                entryPrice: up.bid,
                targetPrice: this.config.exitPrice,
                shares: this.config.shares,
                entryTime: up.lastUpdate
            };

            this.state = StrategyState.WAIT_SECOND_ENTRY;

            return {
                strategy: this.config.name,
                type: ActionType.ENTER,
                ts: up.lastUpdate,
                round: this.currentRound,
                firstSide: "UP",
                firstPrice: up.bid
            };

        }

        if (
            event.tokenId === down.tokenId &&
            down.bid <= this.config.entryPrice
        ) {

            this.position = {
                side: "DOWN",
                tokenId: down.tokenId,
                entryPrice: down.bid,
                targetPrice: this.config.exitPrice,
                shares: this.config.shares,
                entryTime: down.lastUpdate
            };

            this.state = StrategyState.WAIT_SECOND_ENTRY;

            return {
                strategy: this.config.name,
                type: ActionType.ENTER,
                ts: down.lastUpdate,
                round: this.currentRound,
                firstSide: "DOWN",
                firstPrice: down.bid
            };

        }

        return null;

    }

    private tryLock(
        event: MarketEvent
    ): StrategyAction | null {

        if (!this.position) {
            return null;
        }

        if (!this.rounds.canTrade(event.ts)) {

            this.state = StrategyState.ROUND_FINISHED;

            return {
                strategy: this.config.name,
                type: ActionType.ROUND_TIMEOUT,
                ts: event.ts,
                round: this.currentRound
            };

        }

        const up = this.market.getUp();
        const down = this.market.getDown();

        if (!up || !down) {
            return null;
        }

        if (this.position.side === "UP") {

            if (
                event.tokenId !== down.tokenId
            ) {
                return null;
            }

            if (
                down.bid <= this.position.targetPrice
            ) {

                this.state = StrategyState.LOCK_COMPLETED;

                return {
                    strategy: this.config.name,
                    type: ActionType.LOCK,
                    ts: down.lastUpdate,
                    round: this.currentRound,
                    firstSide: "UP",
                    firstPrice: this.position.entryPrice,
                    secondSide: "DOWN",
                    secondPrice: down.bid,
                    sum: this.position.entryPrice + down.bid
                };

            }

            return null;

        }

        if (
            event.tokenId !== up.tokenId
        ) {
            return null;
        }

        if (
            up.bid <= this.position.targetPrice
        ) {

            this.state = StrategyState.LOCK_COMPLETED;

            return {
                strategy: this.config.name,
                type: ActionType.LOCK,
                ts: up.lastUpdate,
                round: this.currentRound,
                firstSide: "DOWN",
                firstPrice: this.position.entryPrice,
                secondSide: "UP",
                secondPrice: up.bid,
                sum: this.position.entryPrice + up.bid
            };

        }

        return null;

    }

}