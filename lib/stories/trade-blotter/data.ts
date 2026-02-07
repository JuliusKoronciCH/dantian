import { type Trade, type TradeUpdate } from './types';
import { type TradeState } from './state';

const SYMBOLS = [
  'AAPL',
  'MSFT',
  'AMZN',
  'NVDA',
  'TSLA',
  'META',
  'GOOGL',
  'NFLX',
  'INTC',
  'AMD',
  'JPM',
  'BAC',
  'WMT',
  'COST',
  'V',
  'MA',
];

const VENUES = ['NYSE', 'NASDAQ', 'ARCA', 'BATS', 'IEX', 'CBOE'];
const TRADERS = [
  'Alex Chen',
  'Morgan Diaz',
  'Priya Patel',
  'Sam Rivera',
  'Jordan Lee',
  'Taylor Brooks',
  'Casey Nguyen',
  'Riley Park',
  'Avery Kim',
  'Quinn Morgan',
];

const BASE_TIME_MS = Date.parse('2025-01-02T09:30:00.000Z');

class SeededRng {
  private seed: number;

  constructor(seed: number) {
    const normalized = Math.floor(seed) % 2147483647;
    this.seed = normalized <= 0 ? normalized + 2147483646 : normalized;
  }

  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }

  nextInt(min: number, max: number) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  pick<T>(values: T[]) {
    return values[this.nextInt(0, values.length - 1)];
  }
}

export const formatTradeId = (tradeId: number) =>
  `T${String(tradeId).padStart(6, '0')}`;

export const parseTradeId = (tradeId: string) =>
  Number(tradeId.replace('T', ''));

export const createTradeForId = (seed: number, tradeId: number): Trade => {
  const rng = new SeededRng(seed + tradeId * 97);
  const price = Number((50 + rng.next() * 200).toFixed(2));
  const qty = rng.nextInt(1, 250) * 5;
  const timestamp = new Date(
    BASE_TIME_MS + rng.nextInt(0, 1000 * 60 * 60 * 24 * 10),
  ).toISOString();

  return {
    tradeId: formatTradeId(tradeId),
    symbol: rng.pick(SYMBOLS),
    side: rng.pick(['Buy', 'Sell']),
    price,
    qty,
    venue: rng.pick(VENUES),
    trader: rng.pick(TRADERS),
    timestamp,
    status: 'New',
  };
};

export const createSowPageGenerator = ({
  seed,
  totalTrades,
  totalPages,
}: {
  seed: number;
  totalTrades: number;
  totalPages: number;
}) => {
  const basePageSize = Math.floor(totalTrades / totalPages);
  const remainder = totalTrades % totalPages;
  let pageIndex = 0;

  return {
    nextPage() {
      if (pageIndex >= totalPages) return null;
      const pageSize = basePageSize + (pageIndex < remainder ? 1 : 0);
      const startId =
        basePageSize * pageIndex + Math.min(pageIndex, remainder) + 1;
      const trades: Trade[] = [];
      for (let index = 0; index < pageSize; index += 1) {
        const tradeId = startId + index;
        trades.push(createTradeForId(seed, tradeId));
      }
      const page = { pageIndex, trades };
      pageIndex += 1;
      return page;
    },
  };
};

export const createStreamUpdateGenerator = ({
  seed,
  baseSeed,
  totalTrades,
  insertStartId,
}: {
  seed: number;
  baseSeed: number;
  totalTrades: number;
  insertStartId: number;
}) => {
  const rng = new SeededRng(seed);
  let insertId = insertStartId;
  let updateTick = 0;
  let seededUpdateSent = false;

  const nextTimestamp = () =>
    new Date(BASE_TIME_MS + 1000 * (200_000 + updateTick++)).toISOString();

  return {
    nextBatch(trades: TradeState, batchSize: number): TradeUpdate[] {
      const updates: TradeUpdate[] = [];

      if (!seededUpdateSent) {
        const base =
          trades.byId[formatTradeId(1)] ?? createTradeForId(baseSeed, 1);
        updates.push({
          type: 'update',
          trade: {
            ...base,
            price: Number((base.price + 0.11).toFixed(2)),
            timestamp: nextTimestamp(),
            status: 'Updated',
          },
        });
        seededUpdateSent = true;
      }

      const existingIds = trades.ids;
      const maxAdditional = Math.max(batchSize - updates.length, 0);

      for (let index = 0; index < maxAdditional; index += 1) {
        const roll = rng.next();
        const pickExisting = existingIds.length > 0 && rng.next() > 0.35;
        const targetId = pickExisting
          ? existingIds[rng.nextInt(0, existingIds.length - 1)]
          : formatTradeId(rng.nextInt(1, totalTrades));
        const numericId = parseTradeId(targetId);
        const base =
          trades.byId[targetId] ?? createTradeForId(baseSeed, numericId);

        if (roll < 0.15) {
          const trade = createTradeForId(baseSeed, insertId);
          insertId += 1;
          updates.push({
            type: 'insert',
            trade: {
              ...trade,
              timestamp: nextTimestamp(),
              status: 'New',
            },
          });
          continue;
        }

        if (roll < 0.65) {
          updates.push({
            type: 'update',
            trade: {
              ...base,
              price: Number((base.price + rng.next() * 1.5 - 0.75).toFixed(2)),
              qty: Math.max(5, base.qty + rng.nextInt(-50, 50)),
              timestamp: nextTimestamp(),
              status: 'Updated',
            },
          });
          continue;
        }

        if (roll < 0.85) {
          updates.push({
            type: 'cancel',
            trade: {
              ...base,
              timestamp: nextTimestamp(),
              status: 'Cancelled',
            },
          });
          continue;
        }

        updates.push({
          type: 'delete',
          trade: base,
        });
      }

      return updates;
    },
  };
};
