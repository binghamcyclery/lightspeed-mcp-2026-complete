import { LightspeedClient } from '../clients/lightspeed.js';
import type { Shop } from '../types/index.js';

export function createShopTools(client: LightspeedClient) {
  return [
    {
      name: 'lightspeed_list_shops',
      description: 'List all shops/locations',
      inputSchema: {
        type: 'object',
        properties: {
          archived: { type: 'boolean' },
        },
      },
      handler: async (args: any) => {
        const params: any = {};
        if (args.archived !== undefined) params.archived = args.archived;
        const shops = await client.getPaginated<Shop>('/Shop', params);
        return { shops, count: shops.length };
      },
    },
    {
      name: 'lightspeed_get_shop',
      description: 'Get a specific shop/location by ID',
      inputSchema: {
        type: 'object',
        properties: {
          shopID: { type: 'number' },
        },
        required: ['shopID'],
      },
      handler: async (args: any) => {
        const shop = await client.get<{ Shop: Shop }>(`/Shop/${args.shopID}`);
        return shop.Shop;
      },
    },
  ];
}
