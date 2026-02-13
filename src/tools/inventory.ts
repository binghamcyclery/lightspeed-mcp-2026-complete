import { LightspeedClient } from '../clients/lightspeed.js';
import type { InventoryCount, InventoryTransfer, InventoryLog } from '../types/index.js';

export function createInventoryTools(client: LightspeedClient) {
  return [
    {
      name: 'lightspeed_list_inventory_counts',
      description: 'List all inventory count sessions',
      inputSchema: {
        type: 'object',
        properties: {
          shopID: { type: 'number' },
          archived: { type: 'boolean' },
        },
      },
      handler: async (args: any) => {
        const params: any = {};
        if (args.shopID) params.shopID = args.shopID;
        if (args.archived !== undefined) params.archived = args.archived;
        const counts = await client.getPaginated<InventoryCount>('/InventoryCount', params);
        return { counts, total: counts.length };
      },
    },
    {
      name: 'lightspeed_create_inventory_count',
      description: 'Create a new inventory count session',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          shopID: { type: 'number' },
        },
        required: ['name', 'shopID'],
      },
      handler: async (args: any) => {
        const count = await client.post<{ InventoryCount: InventoryCount }>('/InventoryCount', {
          InventoryCount: args,
        });
        return count.InventoryCount;
      },
    },
    {
      name: 'lightspeed_add_count_items',
      description: 'Add items to an inventory count',
      inputSchema: {
        type: 'object',
        properties: {
          inventoryCountID: { type: 'number' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                itemID: { type: 'number' },
                qty: { type: 'number' },
              },
            },
          },
        },
        required: ['inventoryCountID', 'items'],
      },
      handler: async (args: any) => {
        const results = [];
        for (const item of args.items) {
          const countItem = await client.post('/InventoryCountItem', {
            InventoryCountItem: {
              inventoryCountID: args.inventoryCountID,
              itemID: item.itemID,
              qty: item.qty,
            },
          });
          results.push(countItem);
        }
        return { added: results.length, items: results };
      },
    },
    {
      name: 'lightspeed_list_inventory_transfers',
      description: 'List inventory transfers between locations',
      inputSchema: {
        type: 'object',
        properties: {
          sendingShopID: { type: 'number' },
          receivingShopID: { type: 'number' },
          status: { type: 'string', enum: ['pending', 'sent', 'received', 'cancelled'] },
        },
      },
      handler: async (args: any) => {
        const params: any = {};
        if (args.sendingShopID) params.sendingShopID = args.sendingShopID;
        if (args.receivingShopID) params.receivingShopID = args.receivingShopID;
        if (args.status) params.status = args.status;
        const transfers = await client.getPaginated<InventoryTransfer>('/Transfer', params);
        return { transfers, count: transfers.length };
      },
    },
    {
      name: 'lightspeed_create_inventory_transfer',
      description: 'Create an inventory transfer between locations',
      inputSchema: {
        type: 'object',
        properties: {
          sendingShopID: { type: 'number' },
          receivingShopID: { type: 'number' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                itemID: { type: 'number' },
                toSend: { type: 'number' },
              },
            },
          },
          note: { type: 'string' },
        },
        required: ['sendingShopID', 'receivingShopID', 'items'],
      },
      handler: async (args: any) => {
        const transfer = await client.post<{ Transfer: InventoryTransfer }>('/Transfer', {
          Transfer: {
            sendingShopID: args.sendingShopID,
            receivingShopID: args.receivingShopID,
            note: args.note,
            status: 'pending',
          },
        });
        
        const transferID = transfer.Transfer.transferID;
        
        for (const item of args.items) {
          await client.post('/TransferItem', {
            TransferItem: {
              transferID,
              itemID: item.itemID,
              toSend: item.toSend,
            },
          });
        }
        
        return transfer.Transfer;
      },
    },
    {
      name: 'lightspeed_send_inventory_transfer',
      description: 'Mark an inventory transfer as sent',
      inputSchema: {
        type: 'object',
        properties: {
          transferID: { type: 'number' },
        },
        required: ['transferID'],
      },
      handler: async (args: any) => {
        const transfer = await client.put<{ Transfer: InventoryTransfer }>(`/Transfer/${args.transferID}`, {
          Transfer: {
            status: 'sent',
            sentOn: new Date().toISOString(),
          },
        });
        return transfer.Transfer;
      },
    },
    {
      name: 'lightspeed_receive_inventory_transfer',
      description: 'Receive an inventory transfer at destination',
      inputSchema: {
        type: 'object',
        properties: {
          transferID: { type: 'number' },
        },
        required: ['transferID'],
      },
      handler: async (args: any) => {
        const transfer = await client.put<{ Transfer: InventoryTransfer }>(`/Transfer/${args.transferID}`, {
          Transfer: { status: 'received' },
        });
        return transfer.Transfer;
      },
    },
    {
      name: 'lightspeed_get_inventory_logs',
      description: 'Get inventory change history for an item',
      inputSchema: {
        type: 'object',
        properties: {
          itemID: { type: 'number' },
          shopID: { type: 'number' },
          limit: { type: 'number', default: 50 },
        },
        required: ['itemID'],
      },
      handler: async (args: any) => {
        const params: any = { itemID: args.itemID };
        if (args.shopID) params.shopID = args.shopID;
        const logs = await client.getPaginated<InventoryLog>('/InventoryLog', params, args.limit || 50);
        return { logs, count: logs.length };
      },
    },
  ];
}
