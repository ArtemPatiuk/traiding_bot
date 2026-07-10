import { createPublicClient } from '@polymarket/client';
import * as fs from 'fs';
import * as path from 'path';

// --- НАСТРОЙКИ ПОТОКОВ ЗАПИСИ ---
const liveLogStream = fs.createWriteStream(path.join(process.cwd(), 'trading_ws_log.txt'), { flags: 'a' });
const rawDataStream = fs.createWriteStream(path.join(process.cwd(), 'raw_market_data.jsonl'), { flags: 'a' });

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
function logToFile(msg: string) {
    const timestampedMessage = `[${new Date().toLocaleTimeString()}] ${msg}`;
    console.log(timestampedMessage);
    liveLogStream.write(timestampedMessage + '\n');
}

function saveRawData(payload: any) {
    // Пишем в JSONL: каждое событие — новая строка
    rawDataStream.write(JSON.stringify({ ts: Date.now(), ...payload }) + '\n');
}

// --- КОРРЕКТНОЕ ЗАВЕРШЕНИЕ ---
process.on('SIGINT', () => {
    liveLogStream.end();
    rawDataStream.end();
    process.exit();
});

async function runMonitor() {
    const client = createPublicClient();
    
    const now = new Date();
    const nowSeconds = Math.floor(now.getTime() / 1000);
    const slug = `btc-updown-5m-${nowSeconds - (nowSeconds % 300)}`;
    
    logToFile(`Инициализация монитора: ${slug}`);

    const response = await fetch(`https://gamma-api.polymarket.com/events?slug=${slug}`);
    const data: any = await response.json();
    const market = data?.[0]?.markets?.[0];
    
    if (!market) {
        logToFile("Рынок не найден!");
        return;
    }

    const [tokenIdUp, tokenIdDown] = JSON.parse(market.clobTokenIds);
    logToFile(`Подписка: UP=${tokenIdUp}, DOWN=${tokenIdDown}`);

    const stream = await client.subscribe([{ topic: 'market', tokenIds: [tokenIdUp, tokenIdDown] }]);

    let lastPriceUp = 0;
    let lastPriceDown = 0;
    let lastLogTime = 0;

    // --- ОСНОВНОЙ ЦИКЛ (САМЫЙ БЫСТРЫЙ) ---
    for await (const event of stream) {
        if (event.topic === 'market' && event.payload) {
            const payload = event.payload as any;

            // 1. Мгновенная запись сырых данных
            saveRawData(payload);

            // 2. Обновление состояния цены
            if (payload.price) {
                const currentPrice = parseFloat(payload.price);
                if (payload.tokenId === tokenIdUp) lastPriceUp = currentPrice;
                else if (payload.tokenId === tokenIdDown) lastPriceDown = currentPrice;

                // 3. Троттлинг визуального логирования (500мс)
                const now = Date.now();
                if (now - lastLogTime > 500) {
                    logToFile(`UP: $${lastPriceUp.toFixed(2)} | DOWN: $${lastPriceDown.toFixed(2)}`);
                    lastLogTime = now;
                }
            }
        }
    }
}

console.clear();
console.log("=== МОНИТОР ЗАПУЩЕН (СБОР ДАННЫХ) ===");
async function startMonitor() {
    while (true) { // Бесконечный цикл переподключения
        try {
            await runMonitor(); // Ваш текущий код
        } catch (err) {
            console.error("Ошибка в мониторе, перезапуск через 5 сек:", err);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}
startMonitor()
//runMonitor().catch(console.error);