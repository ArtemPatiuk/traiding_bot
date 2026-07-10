import { MarketEvent, TokenState } from "../types/market";
import { MarketContext } from "./MarketContext";

export class MarketState {

    private up?: TokenState;

    private down?: TokenState;

    constructor(
        private context: MarketContext
    ) {}

    update(event: MarketEvent): void {

        const state: TokenState = {

            tokenId: event.tokenId,

            bid: event.bid,

            ask: event.ask,

            price: event.price,

            size: event.size,

            side: event.side,

            lastUpdate: event.ts

        };

        if (event.tokenId === this.context.upTokenId) {

            this.up = state;

            return;

        }

        if (event.tokenId === this.context.downTokenId) {

            this.down = state;

        }

    }

    getUp(): TokenState | undefined {

        if (!this.up) {
            return undefined;
        }

        if (!this.isValid(this.up)) {
            return undefined;
        }

        return this.up;

    }

    getDown(): TokenState | undefined {

        if (!this.down) {
            return undefined;
        }

        if (!this.isValid(this.down)) {
            return undefined;
        }

        return this.down;

    }

    getSpreadUp(): number | null {

        const up = this.getUp();

        if (!up) {
            return null;
        }

        return up.ask - up.bid;

    }

    getSpreadDown(): number | null {

        const down = this.getDown();

        if (!down) {
            return null;
        }

        return down.ask - down.bid;

    }

    private isValid(token: TokenState): boolean {

        return (
            token.bid > 0 &&
            token.ask > 0
        );

    }

}