import type { Meta, StoryObj } from '@storybook/react-vite';
import { Root } from './trade-blotter/Root';

const meta = {
  title: 'Dantian/Trade Blotter',
  component: Root,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  argTypes: {
    initialStreaming: {
      control: 'boolean',
      name: 'Streaming',
      table: { category: 'Stream' },
    },
    streamCadenceMs: {
      control: { type: 'number', min: 100, max: 5000, step: 50 },
      name: 'Cadence (ms)',
      table: { category: 'Stream' },
    },
    streamBatchSize: {
      control: { type: 'number', min: 1, max: 500, step: 1 },
      name: 'Batch Size',
      table: { category: 'Stream' },
    },
    totalTrades: {
      control: { type: 'number', min: 1000, max: 2000000, step: 1000 },
      name: 'Total Trades',
      table: { category: 'Data' },
    },
    enableFilter: {
      control: 'boolean',
      name: 'Filters',
      table: { category: 'Grid' },
    },
    enableSort: {
      control: 'boolean',
      name: 'Sort',
      table: { category: 'Grid' },
    },
    enablePagination: {
      control: 'boolean',
      name: 'Pagination',
      table: { category: 'Grid' },
    },
    enableQuickFilter: {
      control: 'boolean',
      name: 'Search',
      table: { category: 'Grid' },
    },
  },
} satisfies Meta<typeof Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    initialStreaming: true,
    streamCadenceMs: 500,
    streamBatchSize: 25,
    totalTrades: 100000,
    enableFilter: true,
    enableSort: true,
    enablePagination: false,
    enableQuickFilter: true,
  },
};
