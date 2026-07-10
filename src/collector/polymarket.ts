import { createPublicClient } from "@polymarket/client";
import { eventBus } from "../core/EventBus";
import { Events } from "../types/events";
import { MarketEvent } from "../types/market";
import { MarketContext } from "../market/MarketContext";

function sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getCurrentSlug() {

    const now = Math.floor(Date.now() / 1000);
    const round = now - (now % 300);

    return {
        slug: `btc-updown-5m-${round}`,
        round
    };

}

async function runCollector(
    context: MarketContext
) {

    const client = createPublicClient();

    const { slug } = getCurrentSlug();

    console.log("");
    console.log("====================================");
    console.log("CONNECT");
    console.log("TIME :", new Date().toLocaleTimeString());
    console.log("SLUG :", slug);
    console.log("====================================");

    const response = await fetch(
        `https://gamma-api.polymarket.com/events?slug=${slug}`
    );

    const data: any = await response.json();

    const market = data?.[0]?.markets?.[0];

    if (!market) {
        throw new Error(`Market not found: ${slug}`);
    }

    const [tokenUp, tokenDown] =
        JSON.parse(market.clobTokenIds);

    context.setMarket({

        slug,

        marketId: market.id,

        upTokenId: tokenUp,

        downTokenId: tokenDown

    });

    console.log("");
    console.log("SUBSCRIBED");
    console.log("UP   :", tokenUp);
    console.log("DOWN :", tokenDown);

    const stream = await client.subscribe([
        {
            topic: "market",
            tokenIds: [
                tokenUp,
                tokenDown
            ]
        }
    ]);

    console.log("");
    console.log("STREAM OPEN");

    let currentSlug = slug;

    let lastAlive = 0;

    for await (const event of stream) {

        const actualSlug =
            getCurrentSlug().slug;

        if (actualSlug !== currentSlug) {

            console.log("");
            console.log("====================================");
            console.log("ROUND CHANGED");
            console.log("OLD :", currentSlug);
            console.log("NEW :", actualSlug);
            console.log("====================================");

            break;

        }

        if (!event.payload) {
            continue;
        }

        const payload: any = event.payload;

        if (Date.now() - lastAlive > 30000) {

            lastAlive = Date.now();

            console.log(
                "ALIVE",
                new Date().toLocaleTimeString(),
                "payload",
                new Date(
                    payload.timestamp
                ).toLocaleTimeString()
            );

        }

        const changes =
            payload.priceChanges;

        if (!Array.isArray(changes)) {
            continue;
        }

        const ts =
            payload.timestamp ??
            Date.now();

        for (const change of changes) {

            if (!change.tokenId) {
                continue;
            }

            const bid =
                Number(change.bestBid);

            const ask =
                Number(change.bestAsk);

            if (
                Number.isNaN(bid) ||
                Number.isNaN(ask)
            ) {
                continue;
            }

            const marketEvent: MarketEvent = {

                tokenId: change.tokenId,

                bid,

                ask,

                price: (bid + ask) / 2,

                size: Number(
                    change.size ?? 0
                ),

                side:
                    change.side ??
                    "",

                ts

            };

            eventBus.emit(
                Events.MARKET_EVENT,
                marketEvent
            );

        }

    }

    console.log("");
    console.log("STREAM CLOSED");

}

export async function startCollector(
    context: MarketContext
) {

    console.log("");
    console.log("Collector started");

    while (true) {

        try {

            await runCollector(
                context
            );

        } catch (err) {

            console.error("");
            console.error(
                "Collector error"
            );

            console.error(err);

            await sleep(3000);

        }

    }

}