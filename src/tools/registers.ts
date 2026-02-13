import { LightspeedClient } from '../clients/lightspeed.js';
import type { Register } from '../types/index.js';

export function createRegisterTools(client: LightspeedClient) {
  return [
    {
      name: 'lightspeed_list_registers',
      description: 'List all registers/POS terminals',
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
        const registers = await client.getPaginated<Register>('/Register', params);
        return { registers, count: registers.length };
      },
    },
    {
      name: 'lightspeed_get_register',
      description: 'Get a specific register by ID',
      inputSchema: {
        type: 'object',
        properties: {
          registerID: { type: 'number' },
        },
        required: ['registerID'],
      },
      handler: async (args: any) => {
        const register = await client.get<{ Register: Register }>(`/Register/${args.registerID}`);
        return register.Register;
      },
    },
    {
      name: 'lightspeed_open_register',
      description: 'Open a register for business',
      inputSchema: {
        type: 'object',
        properties: {
          registerID: { type: 'number' },
          employeeID: { type: 'number' },
        },
        required: ['registerID', 'employeeID'],
      },
      handler: async (args: any) => {
        const register = await client.put<{ Register: Register }>(`/Register/${args.registerID}`, {
          Register: {
            open: true,
            openTime: new Date().toISOString(),
            openEmployeeID: args.employeeID,
          },
        });
        return register.Register;
      },
    },
    {
      name: 'lightspeed_close_register',
      description: 'Close a register',
      inputSchema: {
        type: 'object',
        properties: {
          registerID: { type: 'number' },
        },
        required: ['registerID'],
      },
      handler: async (args: any) => {
        const register = await client.put<{ Register: Register }>(`/Register/${args.registerID}`, {
          Register: { open: false },
        });
        return register.Register;
      },
    },
  ];
}
