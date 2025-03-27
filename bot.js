const exchange = new ccxt.bybit();
const symbol = "BTC/USDT";

let inPosition = false;
let buyPrice = 0;
let sellPrice = 0;
let userCapital = 1000;
let totalBalance = 1000;
const feeRate = 0.0005; // reduced fees

document.getElementById("totalBalance").innerText = totalBalance.toFixed(2);

function logToConsole(msg) {
  console.log(`[${new Date().toLocaleTimeString()}] ${msg}`);
}

function updateTotalBalance() {
  document.getElementById("totalBalance").innerText = totalBalance.toFixed(2);
}

function logTrade(buy, sell, buyStatus, sellStatus, profit) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${new Date().toLocaleTimeString()}</td>
    <td>${buy.toFixed(2)}</td>
    <td>${sell.toFixed(2)}</td>
    <td><span class="status-buy">${buyStatus}</span></td>
    <td><span class="status-sell">${sellStatus}</span></td>
    <td class="${profit >= 0 ? 'profit-positive' : 'profit-negative'}">${profit.toFixed(2)}</td>
    <td>${totalBalance.toFixed(2)} USDT</td>
  `;
  document.getElementById('tradeLog').prepend(row);
}

let lastTrade = {
  buyPrice: 0,
  sellPrice: 0,
  buyStatus: "Pending",
  sellStatus: "Pending",
  profit: 0
};

async function placeOrders() {
  try {
    const ticker = await exchange.fetchTicker(symbol);
    const midPrice = (ticker.bid + ticker.ask) / 2;

    document.getElementById('priceInfo').innerHTML = `
      <strong>Current Price:</strong> ${midPrice.toFixed(2)} USDT
    `;

    if (!inPosition && buyPrice === 0 && sellPrice === 0) {
      const spread = ticker.ask - ticker.bid;
      buyPrice = midPrice - spread * 2; // Buy lower
      sellPrice = buyPrice + 30; // Fixed profit target $30
      lastTrade = {
        buyPrice,
        sellPrice,
        buyStatus: "Pending",
        sellStatus: "Pending",
        profit: 0
      };
      logToConsole(`Waiting to Buy at ${buyPrice.toFixed(2)}`);
      document.getElementById('tradeAction').innerText = `Waiting to Buy at ${buyPrice.toFixed(2)}`;
    }

    if (!inPosition && midPrice <= buyPrice) {
      const tradeSize = userCapital > 0 ? userCapital * 0.2 : 10; // 20%
      const buyFee = tradeSize * feeRate;
      inPosition = true;
      lastTrade.buyStatus = "Executed";
      logToConsole(`Bought at ${buyPrice.toFixed(2)}, Waiting to Sell at ${sellPrice.toFixed(2)}`);
      document.getElementById('tradeAction').innerText = `Bought at ${buyPrice.toFixed(2)}, Waiting to Sell at ${sellPrice.toFixed(2)}`;
    }

    if (inPosition && midPrice >= sellPrice) {
      const tradeSize = userCapital * 0.2;
      const sellReturn = tradeSize + 30; // Fixed $30 profit
      const sellFee = sellReturn * feeRate;
      const finalReturn = sellReturn - sellFee;
      const buyCost = tradeSize + (tradeSize * feeRate);
      const profit = finalReturn - buyCost;

      totalBalance += profit;
      updateTotalBalance();

      lastTrade.sellStatus = "Executed";
      lastTrade.profit = profit;

      logTrade(
        lastTrade.buyPrice,
        lastTrade.sellPrice,
        lastTrade.buyStatus,
        lastTrade.sellStatus,
        lastTrade.profit
      );

      logToConsole(`Sold at ${sellPrice.toFixed(2)} | Profit: ${profit.toFixed(2)} USDT`);
      document.getElementById('tradeAction').innerText = `Trade Completed at ${new Date().toLocaleTimeString()}`;

      inPosition = false;
      buyPrice = 0;
      sellPrice = 0;
    }
  } catch (err) {
    logToConsole(`Error: ${err.message}`);
    document.getElementById('tradeAction').innerText = `❗ Error fetching data`;
  }
}

setInterval(placeOrders, 3000);
