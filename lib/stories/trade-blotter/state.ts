import { type Trade, type TradeUpdateType } from './types';

export type TradeState = {
  byId: Record<string, Trade>;
  ids: string[];
};

export type StreamState = {
  isRunning: boolean;
  cadenceMs: number;
  batchSize: number;
};

export type ConfigState = {
  totalTrades: number;
  totalPages: number;
};

export type GridState = {
  enableFilter: boolean;
  enableSort: boolean;
  enablePagination: boolean;
  enableQuickFilter: boolean;
  quickFilterText: string;
};

export type SowState = {
  totalPages: number;
  receivedPages: number;
  complete: boolean;
};

export type LastUpdate = {
  type: TradeUpdateType | 'none';
  tradeId: string | null;
  timestamp: string | null;
};

export type TradeBlotterState = {
  trades: TradeState;
  sow: SowState;
  stream: StreamState;
  grid: GridState;
  lastUpdate: LastUpdate;
  config: ConfigState;
};

export const DEFAULT_TOTAL_TRADES = 100_000;
export const DEFAULT_TOTAL_PAGES = 10;

export const createInitialState = (
  overrides?: Partial<ConfigState>,
): TradeBlotterState => {
  const totalTrades = overrides?.totalTrades ?? DEFAULT_TOTAL_TRADES;
  const totalPages = overrides?.totalPages ?? DEFAULT_TOTAL_PAGES;

  return {
    trades: { byId: {}, ids: [] },
    sow: { totalPages, receivedPages: 0, complete: false },
    stream: { isRunning: true, cadenceMs: 500, batchSize: 25 },
    grid: {
      enableFilter: true,
      enableSort: true,
      enablePagination: false,
      enableQuickFilter: true,
      quickFilterText: '',
    },
    lastUpdate: { type: 'none', tradeId: null, timestamp: null },
    config: { totalTrades, totalPages },
  };
};
