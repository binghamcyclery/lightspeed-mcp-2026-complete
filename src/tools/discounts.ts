import { LightspeedClient } from '../clients/lightspeed.js';
import type { Discount } from '../types/index.js';

export function createDiscountTools(client: LightspeedClient) {
  return [
    {
      name: 'lightspeed_list_discounts',
      description: 'List all discounts',
      inputSchema: {
        type: 'object',
        properties: {
          archived: { type: 'boolean' },
        },
      },
      handler: async (args: any) => {
        const params: any = {};
        if (args.archived !== undefined) params.archived = args.archived;
        const discounts = await client.getPaginated<Discount>('/Discount', params);
        return { discounts, count: discounts.length };
      },
    },
    {
      name: 'lightspeed_create_discount',
      description: 'Create a new discount',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          discountPercent: { type: 'number', description: 'Discount percentage (0-100)' },
          discountAmount: { type: 'number', description: 'Fixed discount amount' },
          requireCustomer: { type: 'boolean', default: false },
        },
        required: ['name'],
      },
      handler: async (args: any) => {
        const discount = await client.post<{ Discount: Discount }>('/Discount', { Discount: args });
        return discount.Discount;
      },
    },
    {
      name: 'lightspeed_update_discount',
      description: 'Update a discount',
      inputSchema: {
        type: 'object',
        properties: {
          discountID: { type: 'number' },
          name: { type: 'string' },
          discountPercent: { type: 'number' },
          discountAmount: { type: 'number' },
          archived: { type: 'boolean' },
        },
        required: ['discountID'],
      },
      handler: async (args: any) => {
        const { discountID, ...updates } = args;
        const discount = await client.put<{ Discount: Discount }>(`/Discount/${discountID}`, { Discount: updates });
        return discount.Discount;
      },
    },
  ];
}
