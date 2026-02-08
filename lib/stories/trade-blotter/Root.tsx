import { useEffect, useMemo, useRef } from 'react';
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type GridApi,
  type GridReadyEvent,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import './trade-blotter.css';

import { createSowPageGenerator, createStreamUpdateGenerator } from './data';
import { createInitialState, type LastUpdate } from './state';
import { publish, reset, state$, useStoreValue } from './store';
import { type Trade, type TradeUpdate } from './types';

ModuleRegistry.registerModules([AllCommunityModule]);

const PAGE_INTERVAL_MS = 120;
const SOW_SEED = 42;
const STREAM_SEED = 1337;
const MAX_TRADES = 2_000_000;

const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export type RootProps = {
  initialStreaming?: boolean;
  streamCadenceMs?: number;
  streamBatchSize?: number;
  totalTrades?: number;
  enableFilter?: boolean;
  enableSort?: boolean;
  enablePagination?: boolean;
  enableQuickFilter?: boolean;
};

export const Root = ({
  initialStreaming,
  streamCadenceMs,
  streamBatchSize,
  totalTrades: totalTradesProp,
  enableFilter,
  enableSort,
  enablePagination,
  enableQuickFilter,
}: RootProps) => {
  const [isRunning, setIsRunning] = useStoreValue('stream.isRunning');
  const [cadenceMs, setCadenceMs] = useStoreValue('stream.cadenceMs');
  const [batchSize, setBatchSize] = useStoreValue('stream.batchSize');
  const [totalTrades, setTotalTrades] = useStoreValue('config.totalTrades');
  const [totalPages] = useStoreValue('config.totalPages');
  const [filterEnabled, setFilterEnabled] = useStoreValue('grid.enableFilter');
  const [sortEnabled, setSortEnabled] = useStoreValue('grid.enableSort');
  const [paginationEnabled, setPaginationEnabled] = useStoreValue(
    'grid.enablePagination',
  );
  const [quickFilterEnabled, setQuickFilterEnabled] = useStoreValue(
    'grid.enableQuickFilter',
  );
  const [quickFilterText, setQuickFilterText] = useStoreValue(
    'grid.quickFilterText',
  );
  const [lastUpdate, setLastUpdate] = useStoreValue('lastUpdate');

  const emptyRowData = useMemo<Trade[]>(() => [], []);

  const gridApiRef = useRef<GridApi | null>(null);
  const sowCompleteRef = useRef(false);
  const bufferedUpdatesRef = useRef<Map<string, TradeUpdate>>(new Map());
  const pendingTransactionsRef = useRef<{
    add: Trade[];
    update: Trade[];
    remove: Trade[];
  }>({
    add: [],
    update: [],
    remove: [],
  });
  const pendingFlashIdsRef = useRef<string[]>([]);

  const sowGeneratorRef = useRef(
    createSowPageGenerator({
      seed: SOW_SEED,
      totalTrades,
      totalPages,
    }),
  );
  const streamGeneratorRef = useRef(
    createStreamUpdateGenerator({
      seed: STREAM_SEED,
      baseSeed: SOW_SEED,
      totalTrades,
      insertStartId: totalTrades + 1,
    }),
  );

  useEffect(() => {
    if (typeof initialStreaming === 'boolean') {
      setIsRunning(initialStreaming);
    }
  }, [initialStreaming, setIsRunning]);

  useEffect(() => {
    if (
      typeof streamCadenceMs === 'number' &&
      Number.isFinite(streamCadenceMs)
    ) {
      setCadenceMs(clampNumber(streamCadenceMs, 100, 5000));
    }
  }, [setCadenceMs, streamCadenceMs]);

  useEffect(() => {
    if (
      typeof streamBatchSize === 'number' &&
      Number.isFinite(streamBatchSize)
    ) {
      setBatchSize(clampNumber(streamBatchSize, 1, 500));
    }
  }, [setBatchSize, streamBatchSize]);

  useEffect(() => {
    if (
      typeof totalTradesProp === 'number' &&
      Number.isFinite(totalTradesProp)
    ) {
      setTotalTrades(clampNumber(totalTradesProp, 1_000, MAX_TRADES));
    }
  }, [setTotalTrades, totalTradesProp]);

  useEffect(() => {
    if (typeof enableFilter === 'boolean') {
      setFilterEnabled(enableFilter);
    }
  }, [enableFilter, setFilterEnabled]);

  useEffect(() => {
    if (typeof enableSort === 'boolean') {
      setSortEnabled(enableSort);
    }
  }, [enableSort, setSortEnabled]);

  useEffect(() => {
    if (typeof enablePagination === 'boolean') {
      setPaginationEnabled(enablePagination);
    }
  }, [enablePagination, setPaginationEnabled]);

  useEffect(() => {
    if (typeof enableQuickFilter === 'boolean') {
      setQuickFilterEnabled(enableQuickFilter);
    }
  }, [enableQuickFilter, setQuickFilterEnabled]);

  useEffect(() => {
    sowGeneratorRef.current = createSowPageGenerator({
      seed: SOW_SEED,
      totalTrades,
      totalPages,
    });
    streamGeneratorRef.current = createStreamUpdateGenerator({
      seed: STREAM_SEED,
      baseSeed: SOW_SEED,
      totalTrades,
      insertStartId: totalTrades + 1,
    });

    sowCompleteRef.current = false;
    bufferedUpdatesRef.current.clear();
    pendingTransactionsRef.current = { add: [], update: [], remove: [] };
    pendingFlashIdsRef.current = [];

    if (gridApiRef.current) {
      gridApiRef.current.setGridOption('rowData', []);
    }

    const currentState = state$.getValue();
    reset({
      ...currentState,
      trades: { byId: {}, ids: [] },
      sow: { totalPages, receivedPages: 0, complete: false },
      lastUpdate: emptyLastUpdate(),
      config: { totalTrades, totalPages },
    });
  }, [reset, totalPages, totalTrades]);

  useEffect(() => {
    const timeouts: number[] = [];
    let cancelled = false;

    const deliverNextPage = () => {
      if (cancelled) return;
      const page = sowGeneratorRef.current.nextPage();
      if (!page) return;

      const tradesState = state$.getValue().trades;
      page.trades.forEach((trade) => {
        tradesState.byId[trade.tradeId] = trade;
        tradesState.ids.push(trade.tradeId);
      });

      publish('trades', tradesState);
      queueTransaction('add', page.trades);

      const nextReceived = page.pageIndex + 1;
      const complete = nextReceived >= totalPages;
      publish('sow', {
        totalPages,
        receivedPages: nextReceived,
        complete,
      });

      if (complete) {
        sowCompleteRef.current = true;
        flushBufferedUpdates();
        return;
      }

      timeouts.push(window.setTimeout(deliverNextPage, PAGE_INTERVAL_MS));
    };

    deliverNextPage();

    return () => {
      cancelled = true;
      timeouts.forEach((timeoutId) => window.clearTimeout(timeoutId));
    };
  }, [totalPages, totalTrades]);

  useEffect(() => {
    if (!isRunning) return;
    const intervalId = window.setInterval(() => {
      const updates = streamGeneratorRef.current.nextBatch(
        state$.getValue().trades,
        batchSize,
      );

      if (!sowCompleteRef.current) {
        bufferUpdates(updates);
        return;
      }

      applyTradeUpdates(updates);
    }, cadenceMs);

    return () => window.clearInterval(intervalId);
  }, [batchSize, cadenceMs, isRunning]);

  useEffect(() => {
    return () => {
      reset(createInitialState({ totalTrades, totalPages }));
      sowCompleteRef.current = false;
      bufferedUpdatesRef.current.clear();
      pendingTransactionsRef.current.add = [];
      pendingTransactionsRef.current.update = [];
      pendingTransactionsRef.current.remove = [];
      gridApiRef.current = null;
    };
  }, []);

  const queueTransaction = (
    type: 'add' | 'update' | 'remove',
    rows: Trade[],
  ) => {
    if (rows.length === 0) return;
    const gridApi = gridApiRef.current;
    if (gridApi) {
      gridApi.applyTransaction({ [type]: rows });
      return;
    }
    pendingTransactionsRef.current[type].push(...rows);
  };

  const flushPendingTransactions = () => {
    const gridApi = gridApiRef.current;
    if (!gridApi) return;
    const pending = pendingTransactionsRef.current;
    if (pending.add.length > 0) {
      gridApi.applyTransaction({ add: pending.add });
    }
    if (pending.update.length > 0) {
      gridApi.applyTransaction({ update: pending.update });
    }
    if (pending.remove.length > 0) {
      gridApi.applyTransaction({ remove: pending.remove });
    }
    pending.add = [];
    pending.update = [];
    pending.remove = [];

    if (pendingFlashIdsRef.current.length > 0) {
      scheduleFlash(pendingFlashIdsRef.current);
      pendingFlashIdsRef.current = [];
    }
  };

  const bufferUpdates = (updates: TradeUpdate[]) => {
    const buffer = bufferedUpdatesRef.current;
    updates.forEach((update) => {
      buffer.set(update.trade.tradeId, update);
    });
  };

  const flushBufferedUpdates = () => {
    if (bufferedUpdatesRef.current.size === 0) return;
    const updates = Array.from(bufferedUpdatesRef.current.values());
    bufferedUpdatesRef.current.clear();
    applyTradeUpdates(updates);
  };

  const applyTradeUpdates = (updates: TradeUpdate[]) => {
    if (updates.length === 0) return;
    const tradesState = state$.getValue().trades;
    const added: Trade[] = [];
    const updated: Trade[] = [];
    const removed: Trade[] = [];
    const flashIds = new Set<string>();

    updates.forEach((update) => {
      const tradeId = update.trade.tradeId;
      const existing = tradesState.byId[tradeId];

      if (update.type === 'delete') {
        if (!existing) return;
        removed.push(existing);
        delete tradesState.byId[tradeId];
        const index = tradesState.ids.indexOf(tradeId);
        if (index >= 0) {
          tradesState.ids.splice(index, 1);
        }
        return;
      }

      if (!existing) {
        tradesState.ids.push(tradeId);
        added.push(update.trade);
        flashIds.add(tradeId);
      } else if (update.type !== 'insert') {
        updated.push(update.trade);
        flashIds.add(tradeId);
      } else {
        updated.push(update.trade);
        flashIds.add(tradeId);
      }

      tradesState.byId[tradeId] = update.trade;
    });

    publish('trades', tradesState);

    queueTransaction('add', added);
    queueTransaction('update', updated);
    queueTransaction('remove', removed);

    scheduleFlash(Array.from(flashIds));

    const last = updates[updates.length - 1];
    setLastUpdate({
      type: last.type,
      tradeId: last.trade.tradeId,
      timestamp: last.trade.timestamp,
    });
  };

  const scheduleFlash = (tradeIds: string[]) => {
    if (tradeIds.length === 0) return;
    if (!gridApiRef.current) {
      pendingFlashIdsRef.current.push(...tradeIds);
      return;
    }

    const uniqueIds = Array.from(new Set(tradeIds));
    requestAnimationFrame(() => {
      if (!gridApiRef.current) return;
      const rowNodes = uniqueIds
        .map((tradeId) => gridApiRef.current?.getRowNode(tradeId) ?? null)
        .filter(
          (rowNode): rowNode is NonNullable<typeof rowNode> => rowNode !== null,
        );
      if (rowNodes.length > 0) {
        gridApiRef.current.flashCells({
          rowNodes,
          flashDuration: 800,
          fadeDuration: 1200,
        });
      }
    });
  };

  const onGridReady = (event: GridReadyEvent) => {
    gridApiRef.current = event.api;
    flushPendingTransactions();
  };

  const columnDefs = useMemo<ColDef[]>(
    () => [
      { field: 'tradeId', headerName: 'Trade ID', minWidth: 140 },
      { field: 'symbol', headerName: 'Symbol', minWidth: 110 },
      { field: 'side', headerName: 'Side', minWidth: 90 },
      {
        field: 'price',
        headerName: 'Price',
        minWidth: 120,
        cellRenderer: 'agAnimateShowChangeCellRenderer',
        valueFormatter: (params) =>
          typeof params.value === 'number'
            ? `$${params.value.toFixed(2)}`
            : params.value,
      },
      {
        field: 'qty',
        headerName: 'Qty',
        minWidth: 100,
        cellRenderer: 'agAnimateSlideCellRenderer',
      },
      { field: 'venue', headerName: 'Venue', minWidth: 120 },
      { field: 'trader', headerName: 'Trader', minWidth: 140 },
      { field: 'timestamp', headerName: 'Timestamp', minWidth: 190 },
      { field: 'status', headerName: 'Status', minWidth: 130 },
    ],
    [],
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: sortEnabled,
      filter: filterEnabled,
      resizable: true,
      flex: 1,
      enableCellChangeFlash: true,
    }),
    [filterEnabled, sortEnabled],
  );

  const lastUpdateLabel = formatLastUpdate(lastUpdate);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        padding: '20px 24px',
        gap: '16px',
        boxSizing: 'border-box',
      }}
      data-testid="trade-blotter-root"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Trade Blotter</h1>
          <span style={{ fontSize: '13px', color: '#6b7280' }}>
            100k SOW trades, buffered pre-SOW updates, streaming transactions
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              const next = !isRunning;
              setIsRunning(next);
              if (!next) {
                setLastUpdate(emptyLastUpdate());
              }
            }}
            data-testid="trade-blotter-stream-toggle"
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              background: isRunning ? '#111827' : '#ffffff',
              color: isRunning ? '#ffffff' : '#111827',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {isRunning ? 'Stop Streaming' : 'Start Streaming'}
          </button>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Cadence (ms)
            <input
              type="number"
              min={100}
              max={5000}
              value={cadenceMs}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isFinite(next)) return;
                setCadenceMs(clampNumber(next, 100, 5000));
              }}
              data-testid="trade-blotter-cadence"
              style={{ width: '100px' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Batch size
            <input
              type="number"
              min={1}
              max={500}
              value={batchSize}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isFinite(next)) return;
                setBatchSize(clampNumber(next, 1, 500));
              }}
              data-testid="trade-blotter-batch"
              style={{ width: '80px' }}
            />
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            Total trades
            <input
              type="number"
              min={1_000}
              max={MAX_TRADES}
              step={1_000}
              value={totalTrades}
              onChange={(event) => {
                const next = Number(event.target.value);
                if (!Number.isFinite(next)) return;
                setTotalTrades(clampNumber(next, 1_000, MAX_TRADES));
              }}
              data-testid="trade-blotter-total-trades"
              style={{ width: '120px' }}
            />
          </label>
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
            fontSize: '13px',
          }}
        >
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={filterEnabled}
              onChange={(event) => setFilterEnabled(event.target.checked)}
            />
            Filters
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={sortEnabled}
              onChange={(event) => setSortEnabled(event.target.checked)}
            />
            Sort
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={paginationEnabled}
              onChange={(event) => setPaginationEnabled(event.target.checked)}
            />
            Pagination
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="checkbox"
              checked={quickFilterEnabled}
              onChange={(event) => {
                const next = event.target.checked;
                setQuickFilterEnabled(next);
                if (!next) {
                  setQuickFilterText('');
                }
              }}
            />
            Search
          </label>
          {quickFilterEnabled ? (
            <input
              type="text"
              placeholder="Quick filter..."
              value={quickFilterText}
              onChange={(event) => setQuickFilterText(event.target.value)}
              data-testid="trade-blotter-search"
              style={{ minWidth: '220px' }}
            />
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            minHeight: '22px',
            fontSize: '12px',
            color: '#6b7280',
            maxWidth: '100%',
          }}
        >
          <span
            data-testid="trade-blotter-last-update"
            style={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {lastUpdateLabel}
          </span>
        </div>
      </div>

      <div
        className="ag-theme-quartz-dark ag-theme-trade-blotter"
        style={{
          flex: 1,
          width: '100%',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
        }}
      >
        <AgGridReact
          rowData={emptyRowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onGridReady={onGridReady}
          getRowId={(params) => params.data.tradeId}
          pagination={paginationEnabled}
          paginationPageSize={100}
          animateRows
          cellFlashDuration={700}
          cellFadeDuration={1400}
          quickFilterText={quickFilterEnabled ? quickFilterText : ''}
          rowBuffer={50}
          theme="legacy"
        />
      </div>
    </div>
  );
};

const formatLastUpdate = (lastUpdate: LastUpdate) => {
  if (!lastUpdate.tradeId) {
    return 'Last update: none';
  }
  return `Last update: ${lastUpdate.type.toUpperCase()} ${lastUpdate.tradeId} at ${lastUpdate.timestamp}`;
};

const emptyLastUpdate = (): LastUpdate => ({
  type: 'none',
  tradeId: null,
  timestamp: null,
});
