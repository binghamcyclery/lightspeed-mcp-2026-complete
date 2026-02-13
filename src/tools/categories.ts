import { LightspeedClient } from '../clients/lightspeed.js';
import type { Category } from '../types/index.js';

export function createCategoryTools(client: LightspeedClient) {
  return [
    {
      name: 'lightspeed_list_categories',
      description: 'List all product categories with hierarchy',
      inputSchema: {
        type: 'object',
        properties: {
          parentID: { type: 'number', description: 'Filter by parent category ID (0 for root)' },
        },
      },
      handler: async (args: any) => {
        const params: any = {};
        if (args.parentID !== undefined) params.parentID = args.parentID;
        const categories = await client.getPaginated<Category>('/Category', params);
        return { categories, count: categories.length };
      },
    },
    {
      name: 'lightspeed_get_category',
      description: 'Get a specific category by ID',
      inputSchema: {
        type: 'object',
        properties: {
          categoryID: { type: 'number', description: 'Category ID' },
        },
        required: ['categoryID'],
      },
      handler: async (args: any) => {
        const category = await client.get<{ Category: Category }>(`/Category/${args.categoryID}`);
        return category.Category;
      },
    },
    {
      name: 'lightspeed_create_category',
      description: 'Create a new product category',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Category name' },
          parentID: { type: 'number', description: 'Parent category ID (omit for root level)' },
        },
        required: ['name'],
      },
      handler: async (args: any) => {
        const category = await client.post<{ Category: Category }>('/Category', { Category: args });
        return category.Category;
      },
    },
    {
      name: 'lightspeed_update_category',
      description: 'Update an existing category',
      inputSchema: {
        type: 'object',
        properties: {
          categoryID: { type: 'number', description: 'Category ID' },
          name: { type: 'string', description: 'New category name' },
          parentID: { type: 'number', description: 'New parent category ID' },
        },
        required: ['categoryID'],
      },
      handler: async (args: any) => {
        const { categoryID, ...updates } = args;
        const category = await client.put<{ Category: Category }>(`/Category/${categoryID}`, { Category: updates });
        return category.Category;
      },
    },
    {
      name: 'lightspeed_delete_category',
      description: 'Delete a category',
      inputSchema: {
        type: 'object',
        properties: {
          categoryID: { type: 'number', description: 'Category ID to delete' },
        },
        required: ['categoryID'],
      },
      handler: async (args: any) => {
        await client.delete(`/Category/${args.categoryID}`);
        return { success: true, message: `Category ${args.categoryID} deleted` };
      },
    },
    {
      name: 'lightspeed_get_category_tree',
      description: 'Get complete category hierarchy as a tree structure',
      inputSchema: {
        type: 'object',
        properties: {},
      },
      handler: async () => {
        const categories = await client.getPaginated<Category>('/Category');
        
        // Build tree structure
        const categoryMap = new Map<number, Category & { children: any[] }>();
        const rootCategories: any[] = [];
        
        categories.forEach(cat => {
          categoryMap.set(cat.categoryID, { ...cat, children: [] });
        });
        
        categories.forEach(cat => {
          const category = categoryMap.get(cat.categoryID)!;
          if (cat.parentID && categoryMap.has(cat.parentID)) {
            categoryMap.get(cat.parentID)!.children.push(category);
          } else {
            rootCategories.push(category);
          }
        });
        
        return { tree: rootCategories, totalCategories: categories.length };
      },
    },
  ];
}
