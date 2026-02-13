import { LightspeedClient } from '../clients/lightspeed.js';
import type { Manufacturer } from '../types/index.js';

export function createManufacturerTools(client: LightspeedClient) {
  return [
    {
      name: 'lightspeed_list_manufacturers',
      description: 'List all manufacturers/brands',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        const manufacturers = await client.getPaginated<Manufacturer>('/Manufacturer');
        return { manufacturers, count: manufacturers.length };
      },
    },
    {
      name: 'lightspeed_create_manufacturer',
      description: 'Create a new manufacturer/brand',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      },
      handler: async (args: any) => {
        const manufacturer = await client.post<{ Manufacturer: Manufacturer }>('/Manufacturer', { Manufacturer: args });
        return manufacturer.Manufacturer;
      },
    },
    {
      name: 'lightspeed_update_manufacturer',
      description: 'Update a manufacturer',
      inputSchema: {
        type: 'object',
        properties: {
          manufacturerID: { type: 'number' },
          name: { type: 'string' },
        },
        required: ['manufacturerID', 'name'],
      },
      handler: async (args: any) => {
        const { manufacturerID, ...updates } = args;
        const manufacturer = await client.put<{ Manufacturer: Manufacturer }>(`/Manufacturer/${manufacturerID}`, { Manufacturer: updates });
        return manufacturer.Manufacturer;
      },
    },
  ];
}
