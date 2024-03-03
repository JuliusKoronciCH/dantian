import { describe, it, expect } from 'vitest';
import * as publicApi from '../index';

describe('Public api', () => {
  it('Should have a test export', () => {
    expect(publicApi.buildStore).toBeDefined();
  });
});
