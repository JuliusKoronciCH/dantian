import { describe, expect, it } from 'vitest';
import { createEventStore } from '../event-store';
import { wuji } from '../dao';
import { createEventStore as createFromIndex, wuji as wujiFromIndex } from '..';

describe('exports', () => {
  it('re-exports createEventStore and wuji aliases', () => {
    expect(createFromIndex).toBe(createEventStore);
    expect(wuji).toBe(createEventStore);
    expect(wujiFromIndex).toBe(createEventStore);
  });
});
