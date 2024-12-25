import { AddRowResponse, ApiFilterResponse, ApiKanbanResponse, ApiResponse, ApiUpdateKanbanResponse, DeleteRowResponse, Kanban, TableProps } from "@/types/table.types";
import { createClient } from '@/utils/supabase/client'
import { redirect } from "next/navigation";

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: "error" | "success",
  path: string,
  message: string,
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}


export async function GetUser() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser();
  return user && user.id;
}

export async function FetchTableData<T>(
  endpoint: string,
  paginationParams: string,
  filterParams: string,
  sortParams: string,
  searchParams: string
): Promise<ApiResponse<T>> {
  const supabase = createClient();

  try {
    // Parse parameters
    const { page = 1, pageSize = 10 } = JSON.parse(paginationParams);
    const filters = JSON.parse(filterParams);
    const { column = 'id', ascending = true } = JSON.parse(sortParams);
    const { searchColumn, searchQuery } = JSON.parse(searchParams);

    // Calculate pagination range
    const start = (page - 1) * pageSize;
    const end = start + pageSize - 1;

    // Build single query that returns both count and data
    let query = supabase
      .from(endpoint)
      .select('*', { count: 'exact' }); // This will return both data and count

    // Apply filters
    if (filters && Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length === 2) {
          query = query.gte(key, value[0]).lte(key, value[1]);
        } else if (value !== null && value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }

    // Apply search if provided
    if (searchColumn && searchQuery) {
      query = query.ilike(searchColumn, `%${searchQuery}%`);
    }

    // Apply sorting
    query = query.order(column, { ascending });

    // Apply pagination
    query = query.range(start, end);

    // Execute single query
    const { data, error, count } = await query;

    if (error) throw error;
    if (!data) {
      throw new Error('No data returned from Supabase');
    }

    const totalPages = Math.ceil(count! / pageSize);

    return {
      data: {
        items: data,
        pagination: {
          totalItems: count!,
          totalPages,
          currentPage: page,
          pageSize,
        },
      },
      status: 200,
      message: 'Data fetched successfully',
    };
  } catch (error) {
    console.error('Error fetching table data:', error);
    throw error;
  }
}


export async function FetchPopulatedData<T>(endpoint: string, fieldName: string, source: string): Promise<ApiResponse<T>> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from(endpoint).select(`
        id,
        ${fieldName} ( ${source} )
      `);
    if (error) throw error;
    if (!data) {
      throw new Error('No data returned from Supabase');
    }
    return {
      data: {
        items: data as unknown as T[],
        pagination: {
          totalItems: data?.length || 0,
          totalPages: 1,
          currentPage: 1,
          pageSize: data?.length || 0
        }
      },
      status: 200,
      message: 'Data fetched successfully'
    };
  } catch (error) {
    console.error('Error fetching table data:', error);
    throw error;
  }
}

export async function AddRow<T>(endpoint: string, rowData: any): Promise<ApiResponse<T>> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from(endpoint).insert(rowData).select()

    if (error) throw error
    if (!data) {
      throw new Error('No data returned from Supabase after insert');
    }

    return {
      data: {
        items: data as unknown as T[],
        pagination: {
          totalItems: data.length,
          totalPages: 1,
          currentPage: 1,
          pageSize: data.length
        }
      },
      status: 200,
      message: 'Data added successfully'
    };
  } catch (error) {
    console.error('Error adding row:', error);
    throw error;
  }
}

export async function UpdateRow<T>(endpoint: string, rowData: any): Promise<AddRowResponse> {
  try {
    const supabase = createClient();

    // Extract the ID and prepare update data
    const { id, _id, ...updateData } = rowData;
    const idToUse = id || _id;

    if (!idToUse) {
      throw new Error('No ID provided for update');
    }

    // Process nested objects and arrays
    const processedData: { [key: string]: any } = {};

    Object.entries(updateData).forEach(([key, value]) => {
      // Skip null/undefined values
      if (value === null || value === undefined) {
        return;
      }

      // Handle nested paths (e.g., "address.street")
      if (key.includes('.')) {
        const [parentKey, childKey] = key.split('.');
        if (!processedData[parentKey]) {
          processedData[parentKey] = {};
        }
        processedData[parentKey][childKey] = value;
        return;
      }

      // Handle arrays and objects
      if (typeof value === 'object') {
        // If it's an array, keep it as is
        if (Array.isArray(value)) {
          processedData[key] = value;
        } else {
          // For objects, only include if they have properties
          if (Object.keys(value).length > 0) {
            processedData[key] = value;
          }
        }
        return;
      }

      // Handle primitive values
      processedData[key] = value;
    });


    // Verify the record exists before updating
    const { data: existingRecord, error: fetchError } = await supabase
      .from(endpoint)
      .select('id')
      .eq('id', idToUse)
      .single();

    if (fetchError || !existingRecord) {
      throw new Error(`Record with ID ${idToUse} not found`);
    }
    // Perform the update
    const { data, error } = await supabase
      .from(endpoint)
      .update(processedData)
      .eq('id', idToUse)
      .select();

    if (error) {
      console.error('Supabase update error:', error);
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned after update');
    }

    return {
      data: data,
      status: 200,
      message: 'Data updated successfully'
    };
  } catch (error) {
    console.error('Error in updateRow:', error);
    return {
      data: {
        items: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: 0,
          pageSize: 0
        }
      },
      status: 400,
      message: error instanceof Error ? error.message : 'Failed to update record'
    };
  }
}

export async function DeleteRow<T>(endpoint: string, rowId: string): Promise<DeleteRowResponse> {
  try {
    const supabase = createClient()
    await supabase.from(endpoint).delete().eq('id', rowId)

    return {
      status: 200,
      message: 'Data deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting row:', error);
    throw error;
  }
}

export async function BulkUpdate<T>(endpoint: string, updatedData: any): Promise<AddRowResponse> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from(endpoint)
      .upsert(updatedData)
      .select()

    if (error) {
      console.error('Supabase update error:', error);
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      throw new Error('No data returned after update');
    }

    return {
      data: data,
      status: 200,
      message: 'Data updated successfully'
    };
  } catch (error) {
    console.error('Error in updateRow:', error);
    return {
      data: {
        items: [],
        pagination: {
          totalItems: 0,
          totalPages: 0,
          currentPage: 0,
          pageSize: 0
        }
      },
      status: 400,
      message: error instanceof Error ? error.message : 'Failed to update record'
    };
  }
}

export async function BulkDelete<T>(endpoint: string, rowId: string): Promise<DeleteRowResponse> {
  try {
    const supabase = createClient()
    await supabase.from(endpoint).delete().eq('id', rowId)

    return {
      status: 200,
      message: 'Data deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting row:', error);
    throw error;
  }
}

export async function AddFilter<T>(rowData: any): Promise<ApiResponse<T>> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("Filters").insert(rowData).select()

    if (error) throw error
    if (!data) {
      throw new Error('No data returned from Supabase after insert');
    }

    return {
      data: {
        items: data as unknown as T[],
        pagination: {
          totalItems: data.length,
          totalPages: 1,
          currentPage: 1,
          pageSize: data.length
        }
      },
      status: 200,
      message: 'Data added successfully'
    };
  } catch (error) {
    console.error('Error adding row:', error);
    throw error;
  }
}

export async function GetFilters<T>(tableName: string, user: string): Promise<ApiFilterResponse<T>> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase.from("Filters").select().eq('tableName', tableName).eq('createdBy', user)

    if (error) throw error
    if (!data) {
      throw new Error('No data returned from Supabase after insert');
    }
    return {
      data: data,
      status: 200,
      message: 'Data added successfully'
    };
  } catch (error) {
    console.error('Error adding row:', error);
    throw error;
  }
}

export async function GetKanbanData(config: Kanban, endpoint: string): Promise<ApiKanbanResponse> {
  try {
    const supabase = createClient()
    const select = `${config?.columnIdName},${config?.columnContent},${config?.identification}`
    const { data, error } = await supabase.from(endpoint).select(select)
    if (error) throw error
    if (!data) {
      throw new Error('No data returned from Supabase after insert');
    }
    //transform data to match the format of the columns
    const tasks = data.map((item: any) => ({ id: item[config.identification], columnId: item[config.columnContent], content: item[config.columnIdName] }))
    const columns = config.columnOptions.map((item: any) => ({ id: item, title: item }))
    return {
      data: {
        columns: columns,
        tasks: tasks
      },
      status: 200,
      message: 'Data added successfully'
    };
  } catch (error) {
    console.error('Error adding row:', error);
    throw error;
  }

}

export async function UpdateKanbanData(
  config: Record<string, any>,
  endpoint: string,
  columnData: {
    enabled: boolean;
    identification: string;
    columnIdName: string;
    columnContent: string;
    columnOptions: string[];
  }
): Promise<ApiUpdateKanbanResponse> {
  console.log('Original config:', config);
  try {
    const supabase = createClient();

    // Transform the config keys based on columnData mapping
    const transformedConfig: Record<string, any> = {};
    if (config.columnId !== undefined) {
      transformedConfig[columnData.columnContent] = config.columnId;
    }

    const { error } = await supabase
      .from(endpoint)
      .update(transformedConfig)
      .eq(columnData.identification, config.id);

    if (error) throw error;
    return {
      status: 200,
      message: 'Data added successfully'
    };
  } catch (error) {
    console.error('Error adding row:', error);
    throw error;
  }
}