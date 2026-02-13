import { LightspeedClient } from '../clients/lightspeed.js';
import type { Employee } from '../types/index.js';

export function createEmployeeTools(client: LightspeedClient) {
  return [
    {
      name: 'lightspeed_list_employees',
      description: 'List all employees',
      inputSchema: {
        type: 'object',
        properties: {
          archived: { type: 'boolean' },
          shopID: { type: 'number' },
        },
      },
      handler: async (args: any) => {
        const params: any = {};
        if (args.archived !== undefined) params.archived = args.archived;
        if (args.shopID) params.limitToShopID = args.shopID;
        const employees = await client.getPaginated<Employee>('/Employee', params);
        return { employees, count: employees.length };
      },
    },
    {
      name: 'lightspeed_get_employee',
      description: 'Get a specific employee by ID',
      inputSchema: {
        type: 'object',
        properties: {
          employeeID: { type: 'number' },
        },
        required: ['employeeID'],
      },
      handler: async (args: any) => {
        const employee = await client.get<{ Employee: Employee }>(`/Employee/${args.employeeID}`);
        return employee.Employee;
      },
    },
    {
      name: 'lightspeed_create_employee',
      description: 'Create a new employee',
      inputSchema: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          employeeRoleID: { type: 'number' },
          limitToShopID: { type: 'number' },
        },
        required: ['firstName', 'lastName'],
      },
      handler: async (args: any) => {
        const employee = await client.post<{ Employee: Employee }>('/Employee', { Employee: args });
        return employee.Employee;
      },
    },
    {
      name: 'lightspeed_update_employee',
      description: 'Update an employee',
      inputSchema: {
        type: 'object',
        properties: {
          employeeID: { type: 'number' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          lockOut: { type: 'boolean' },
          archived: { type: 'boolean' },
        },
        required: ['employeeID'],
      },
      handler: async (args: any) => {
        const { employeeID, ...updates } = args;
        const employee = await client.put<{ Employee: Employee }>(`/Employee/${employeeID}`, { Employee: updates });
        return employee.Employee;
      },
    },
    {
      name: 'lightspeed_delete_employee',
      description: 'Archive an employee',
      inputSchema: {
        type: 'object',
        properties: {
          employeeID: { type: 'number' },
        },
        required: ['employeeID'],
      },
      handler: async (args: any) => {
        await client.delete(`/Employee/${args.employeeID}`);
        return { success: true, message: `Employee ${args.employeeID} archived` };
      },
    },
    {
      name: 'lightspeed_get_employee_hours',
      description: 'Get time tracking hours for an employee',
      inputSchema: {
        type: 'object',
        properties: {
          employeeID: { type: 'number' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
        },
        required: ['employeeID'],
      },
      handler: async (args: any) => {
        const params: any = { employeeID: args.employeeID };
        if (args.startDate) params.checkIn = `>,${args.startDate}`;
        const hours = await client.getPaginated('/EmployeeHours', params);
        return { hours, count: hours.length };
      },
    },
  ];
}
