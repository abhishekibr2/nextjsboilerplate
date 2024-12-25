import { z } from 'zod';
import { FormFieldConfig } from './form.types';

export type ZodValidationSchema = z.ZodType<any, any, any>;

export interface TableStyles {
  table?: string;
  header?: string;
  headerRow?: string;
  headerCell?: string;
  body?: string;
  bodyRow?: string;
  bodyCell?: string;
  noResults?: string;
  wrapper?: string;
  title?: string;
  description?: string;
}

export type ColumnType = 'text' | 'number' | 'date' | 'select' | 'email' | 'address' | 'phone' | 'gender' | 'array';

export interface TableColumn {
  id: string;
  header: string;
  accessorKey: string;
  className?: string;
  sortable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  editConfig?: FormFieldConfig;
  defaultVisible?: boolean;
  type?: string;
  options?: Array<{ label: string; value: string | boolean }>;
  arrayType?: string;
  arrayFields?: {
    [key: string]: {
      type: string;
      label: string;
      placeholder?: string;
    };
  };
}

export interface SortingState {
  column: string | null;
  direction: 'asc' | 'desc' | null;
}

export interface SearchConfig {
  enabled: boolean;
  placeholder?: string;
  searchableColumns: string[];
}

export interface Kanban {
  enabled: boolean,
  identification: string,
  columnIdName: string,
  columnContent: string,
  columnOptions: string[]
}

export interface PaginationConfig {
  enabled: boolean;
  pageSize: number;
  pageSizeOptions: number[];
}

export type FilterOperator =
  // Text operators
  | 'equals' | 'notEquals' | 'contains' | 'notContains' | 'startsWith' | 'endsWith'
  // Number operators
  | 'greaterThan' | 'lessThan' | 'greaterThanEqual' | 'lessThanEqual' | 'between'
  // Date operators
  | 'before' | 'after' | 'onDate' | 'dateRange'
  // Array operators
  | 'in' | 'notIn' | 'hasAll' | 'hasAny'
  // Select operators
  | 'is' | 'isNot'
  // Boolean operators
  | 'isTrue' | 'isFalse';

export interface FilterValue {
  column: string;
  operator: FilterOperator;
  value: any;
  secondValue?: any; // For range/between operations
}

export interface FilterConfig {
  enabled: boolean;
  operators: FilterOperator[];
}

export interface ColumnToggleConfig {
  enabled: boolean;
  defaultVisible?: boolean;
}

export interface ExportConfig {
  enabled: boolean;
  formats: Array<'csv' | 'excel' | 'pdf'>;
  filename?: string;
  fields?: string[];
}

export interface ImportConfig {
  enabled: boolean;
  formats: Array<'csv'>;
  template?: string;
}

export interface SelectConfig {
  enabled: boolean;
  type: 'single' | 'multiple';
  onSelect?: (selectedRows: any[]) => void;
}

export interface EditConfig {
  enabled: boolean;
  allowAdd?: boolean;
  allowDelete?: boolean;
  allowUpdate?: boolean;
  confirmDelete?: boolean;
  style?: {
    column?: string;
    editButton?: string;
    deleteButton?: string;
  };
  messages?: {
    deleteConfirm?: {
      title?: string;
      description?: string;
      confirm?: string;
      cancel?: string;
    };
    success?: {
      update?: string;
      delete?: string;
    };
    error?: {
      update?: string;
      delete?: string;
    };
    loading?: {
      update?: string;
      delete?: string;
    };
  };
}

export interface BulkEditConfig {
  enabled: boolean;
  fields?: FormFieldConfig[];
  allowDelete?: boolean;
}

export interface TableConfig<T = any> {
  id: string;
  title?: string;
  description?: string;
  columns: TableColumn[];
  styles?: TableStyles;
  search?: SearchConfig;
  kanban?: Kanban;
  pagination?: PaginationConfig;
  filter?: FilterConfig;
  columnToggle?: ColumnToggleConfig;
  export?: ExportConfig;
  import?: ImportConfig;
  select?: SelectConfig;
  edit?: EditConfig;
  bulkEdit?: BulkEditConfig;
  validationSchema?: ZodValidationSchema;
}

export interface TableProps {
  config: TableConfig;
  endpoint: string;
  populate?: {
    fieldName: string;
    source: string;
  };
}

export interface ApiResponse<T> {
  data: {
    items: T[];
    pagination: {
      totalItems: number;
      totalPages: number;
      currentPage: number;
      pageSize: number;
    }
    populatedData?: any;
  };
  status: number;
  message?: string;
}

export interface ApiFilterResponse<T> {
  data: any[];
  message: string;
  status: number;
}

export interface AddRowResponse {
  data: any;
  status: number;
  message?: string;
}

export interface DeleteRowResponse {
  status: number;
  message?: string;
}

export interface PaginationState {
  pageIndex: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

export interface ApiKanbanResponse {
  status: number;
  data: {
    columns: any[];
    tasks: any[];
  };
  message?: string;
}

export interface ApiUpdateKanbanResponse {
  status: number;
  message?: string;
}