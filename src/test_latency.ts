// test_latency.ts
import { createSecureClient } from '@polymarket/client';
import { requireEnv } from './lib/env';
import { privateKey } from '@polymarket/client/viem';


const secureClient = await createSecureClient({
      wallet: requireEnv('POLYMARKET_DEPOSIT_WALLET'),
      signer: privateKey(requireEnv('POLYMARKET_PRIVATE_KEY')),
});

async function checkLatency() {
  console.log("Замеряю время ответа от сервера...");
  
  const startTime = Date.now();
  
  // Делаем минимальный запрос для теста
  await secureClient.listMarkets({
    pageSize: 3, // Запрашиваем только один рынок, чтобы минимизировать нагрузку
  });
  
  const endTime = Date.now();
  
  console.log(`Задержка до биржи: ${endTime - startTime} мс`);
}

checkLatency();