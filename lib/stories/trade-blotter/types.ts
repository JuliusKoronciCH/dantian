export type TradeSide = 'Buy' | 'Sell';
export type TradeStatus = 'New' | 'Updated' | 'Cancelled';

export type TradeUpdateType = 'insert' | 'update' | 'cancel' | 'delete';

export type Trade = {
  tradeId: string;
  symbol: string;
  side: TradeSide;
  price: number;
  qty: number;
  venue: string;
  trader: string;
  timestamp: string;
  status: TradeStatus;
};

export type TradeUpdate = {
  type: TradeUpdateType;
  trade: Trade;
};
