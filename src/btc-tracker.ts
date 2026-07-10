import * as fs from 'fs';
import * as path from 'path';



let targetTokenIdUp = "";
let targetTokenIdDown = "";
let currentSlug = "";

let isUpTriggered = false;
let isDownTriggered = false;

let upExecutedPrice = 0.0;
let downExecutedPrice = 0.0;

let firstTriggerSide: 'UP' | 'DOWN' | null = null;
let firstTriggerTime: number = 0; 
const PANIC_TIMEOUT_SECONDS = 90; 

// ==========================================
// НАСТРОЙКИ ДЛЯ БЭКТЕСТА ФИКСИРОВАННЫХ ДОЛЕЙ
// ==========================================
let currentBalance = 100.0;   // Стартовый баланс
const targetShares = 10.0;    // ВСЕГДА ПОКУПАЕМ СТРОГО 10 ДОЛЕЙ (АКЦИЙ)
const entryPrice = 0.45;      // Стартовый триггер для первой лимитки

let lastBidUp = 0.0;
let lastBidDown = 0.0;

const liveLogPath = path.join(process.cwd(), 'trading2_log.txt');       
const statsLogPath = path.join(process.cwd(), 'rounds2_stats.txt');     

function liveLogger(message: string) {
    console.log(message);
    fs.appendFileSync(liveLogPath, message + '\n', 'utf-8');
}

function statsLogger(message: string) {
    fs.appendFileSync(statsLogPath, message + '\n', 'utf-8');
}

function getActiveRoundSlug(): string {
    const now = new Date();
    const nowSeconds = Math.floor(now.getTime() / 1000);
    const currentRoundStart = nowSeconds - (nowSeconds % 300);
    return `btc-updown-5m-${currentRoundStart}`;
}

function getRoundLabel(slug: string): string {
    const timestamp = parseInt(slug.split('-').pop() || "0");
    if (!timestamp) return "[00:00–00:00]";
    const start = new Date(timestamp * 1000);
    const end = new Date((timestamp + 300) * 1000);
    const format = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `[${format(start)}–${format(end)}]`;
}

async function resolveMarketTokens() {
    const computedSlug = getActiveRoundSlug();
    
    if (currentSlug !== computedSlug) {
        if (currentSlug !== "") {
            const label = getRoundLabel(currentSlug);
            let roundProfit = 0.0;
            let scenarioText = "";

            const upWon = lastBidUp > lastBidDown;

            if (isUpTriggered && isDownTriggered) {
                // Сценарий 1: Собрали динамический замок по 10 акций
                const costUp = targetShares * upExecutedPrice;     
                const costDown = targetShares * downExecutedPrice; 
                const totalCost = costUp + costDown;               

                // Выплата всегда равна количеству долей, так как одна из сторон 100% закроется по $1.00
                const totalPayout = targetShares; 
                
                roundProfit = totalPayout - totalCost; 
                currentBalance += roundProfit;

                const comboPrice = upExecutedPrice + downExecutedPrice;
                scenarioText = `🔒 ДИНАМИЧЕСКИЙ ЗАМОК СФОРМИРОВАН! (Сумма цен: $${comboPrice.toFixed(2)})\n` +
                               `   Затраты: UP (10 шт): $${costUp.toFixed(2)}, DOWN (10 шт): $${costDown.toFixed(2)} (Всего ушло: $${totalCost.toFixed(2)})\n` +
                               `   Результат: ${roundProfit >= 0 ? "+" : ""}$${roundProfit.toFixed(2)}`;
            } 
            else if (isUpTriggered || isDownTriggered) {
                // Сценарий 2: Зацепило только ОДНУ сторону (например, раунд закончился раньше паник-клоуза)
                const execPrice = isUpTriggered ? upExecutedPrice : downExecutedPrice;
                const costSingle = targetShares * execPrice;
                const triggeredSideWon = (isUpTriggered && upWon) || (isDownTriggered && !upWon);

                if (triggeredSideWon) {
                    roundProfit = targetShares - costSingle; // Получили $10, потратили costSingle
                    currentBalance += roundProfit;
                    scenarioText = `🍀 ОДИНОЧНЫЙ ВХОД (ВИН): Купили 10 долей по $${execPrice.toFixed(2)}, они выиграли! Профит: +$${roundProfit.toFixed(2)}`;
                } else {
                    roundProfit = -costSingle; // Потратили деньги, а доли сгорели в 0
                    currentBalance += roundProfit;
                    scenarioText = `❌ ОДИНОЧНЫЙ ВХОД (ЛОСС): Купили 10 долей по $${execPrice.toFixed(2)}, но раунд проигран. Убыток: -$${Math.abs(roundProfit).toFixed(2)}`;
                }
            } 
            else {
                roundProfit = 0.0;
                scenarioText = `💤 МИМО: Ни один ордер не был открыт. Баланс сохранен.`;
            }

            const summaryBlock = [
                `=============================================`,
                `ИТОГ РАУНДА ${label}: Up ${isUpTriggered ? `✓ ($${upExecutedPrice.toFixed(2)})` : "❌"} | Down ${isDownTriggered ? `✓ ($${downExecutedPrice.toFixed(2)})` : "❌"}`,
                `${scenarioText}`,
                `ТЕКУЩИЙ БАЛАНС: $${currentBalance.toFixed(2)}`,
                `=============================================\n`
            ].join('\n');

            liveLogger(`\n${summaryBlock}`);
            statsLogger(summaryBlock);
        }

        currentSlug = computedSlug;
        targetTokenIdUp = ""; 
        targetTokenIdDown = "";
        isUpTriggered = false;
        isDownTriggered = false;
        upExecutedPrice = 0.0;
        downExecutedPrice = 0.0;
        firstTriggerSide = null;
        firstTriggerTime = 0;
        roundSecondsCounter = 0;
    }

    try {
        const response = await fetch(`https://gamma-api.polymarket.com/events?slug=${currentSlug}`, {
            headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
        });
        if (!response.ok) return;
        const data: any = await response.json();
        const market = data?.[0]?.markets?.[0];
        if (!market) return;

        let tokenIds: string[] = [];
        if (typeof market.clobTokenIds === 'string') tokenIds = JSON.parse(market.clobTokenIds);
        else if (Array.isArray(market.clobTokenIds)) tokenIds = market.clobTokenIds;

        if (tokenIds?.[0] && tokenIds?.[1]) {
            targetTokenIdUp = tokenIds[0];
            targetTokenIdDown = tokenIds[1];
        }
    } catch (e) {}
}

async function getBestBid(tokenId: string): Promise<number> {
    try {
        const cacheBuster = Date.now();
        const url = `https://clob.polymarket.com/book?token_id=${tokenId}&_cb=${cacheBuster}`;
        const response = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" } });
        if (!response.ok) return 0;
        const orderbook: any = await response.json();
        if (!orderbook.bids || orderbook.bids.length === 0) return 0;
        const bestBidObject = orderbook.bids[orderbook.bids.length - 1];
        return bestBidObject && bestBidObject.price ? parseFloat(bestBidObject.price) : 0;
    } catch (e) { return 0; }
}

let roundSecondsCounter = 0;

async function monitorLivePrices() {
    const computedSlug = getActiveRoundSlug();
    
    if (!targetTokenIdUp || !targetTokenIdDown || currentSlug !== computedSlug) {
        await resolveMarketTokens();
        return;
    }

    roundSecondsCounter++;

    const [bidUp, bidDown] = await Promise.all([
        getBestBid(targetTokenIdUp),
        getBestBid(targetTokenIdDown)
    ]);

    lastBidUp = bidUp;
    lastBidDown = bidDown;

    const timeStr = new Date().toLocaleTimeString();
    liveLogger(`[${timeStr}] Bid UP: $${bidUp.toFixed(2)} | Bid DOWN: $${bidDown.toFixed(2)}`);

    if (roundSecondsCounter <= 2) return; 

    if (firstTriggerSide === null) {
        if (bidUp <= entryPrice && bidUp > 0) {
            firstTriggerSide = 'UP';
            firstTriggerTime = roundSecondsCounter;
            isUpTriggered = true;
            upExecutedPrice = bidUp; 
            liveLogger(`\n🎯 [${timeStr}] [ВХОД UP] 10 долей по $${bidUp.toFixed(2)}  Включаем защиту на ${PANIC_TIMEOUT_SECONDS}с!\n`);
        } 
        else if (bidDown <= entryPrice && bidDown > 0) {
            firstTriggerSide = 'DOWN';
            firstTriggerTime = roundSecondsCounter;
            isDownTriggered = true;
            downExecutedPrice = bidDown;
            liveLogger(`\n🎯 [${timeStr}] [ВХОД DOWN] 10 долей по $${bidDown.toFixed(2)}  Включаем защиту на ${PANIC_TIMEOUT_SECONDS}с!\n`);
        }
    } 
    else {
        const secondsSinceFirstTrigger = roundSecondsCounter - firstTriggerTime;

        if (firstTriggerSide === 'UP' && !isDownTriggered) {
            const dynamicTargetDown = 1.00 - upExecutedPrice; 

            if (bidDown <= dynamicTargetDown && bidDown > 0) {
                isDownTriggered = true;
                downExecutedPrice = bidDown;
                liveLogger(`\n🔒 [${timeStr}] [ЗАМОК] DOWN пойман по $${bidDown.toFixed(2)} (Цель: <= $${dynamicTargetDown.toFixed(2)})\n`);
            } 
            else if (secondsSinceFirstTrigger >= PANIC_TIMEOUT_SECONDS) {
                isDownTriggered = true;
                downExecutedPrice = bidDown; 
                liveLogger(`\n🚨 [${timeStr}] [ТАЙМАУТ ПАНИКИ] Прошло ${PANIC_TIMEOUT_SECONDS}с! Забираем 10 долей DOWN по рынку за $${bidDown.toFixed(2)}\n`);
            }
        } 
        else if (firstTriggerSide === 'DOWN' && !isUpTriggered) {
            const dynamicTargetUp = 0.99 - downExecutedPrice;

            if (bidUp <= dynamicTargetUp && bidUp > 0) {
                isUpTriggered = true;
                upExecutedPrice = bidUp;
                liveLogger(`\n🔒 [${timeStr}] [ЗАМОК] UP пойман по $${bidUp.toFixed(2)} (Цель: <= $${dynamicTargetUp.toFixed(2)})\n`);
            } 
            else if (secondsSinceFirstTrigger >= PANIC_TIMEOUT_SECONDS) {
                isUpTriggered = true;
                upExecutedPrice = bidUp; 
                liveLogger(`\n🚨 [${timeStr}] [ТАЙМАУТ ПАНИКИ] Прошло ${PANIC_TIMEOUT_SECONDS}с! Забираем 10 долей UP по рынку за $${bidUp.toFixed(2)}\n`);
            }
        }
    }
}

console.clear();
const sessionHeader = `\n\n=== ЗАПУСК БЭКТЕСТА : ${new Date().toLocaleString()} ===\n`;
fs.appendFileSync(liveLogPath, sessionHeader, 'utf-8');
fs.appendFileSync(statsLogPath, sessionHeader, 'utf-8');

console.log("=== МОНИТОР ЗАПУЩЕН ===");
setInterval(monitorLivePrices, 1000);
monitorLivePrices();