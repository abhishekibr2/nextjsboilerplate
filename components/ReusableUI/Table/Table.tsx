"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { TableProps, SortingState, PaginationState, FilterValue } from "@/types/table.types"
import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { ChevronUp, ChevronDown, Kanban } from "lucide-react"
import { cn } from "@/lib/utils"
import { TableSearch } from "./sub-components/functional/TableSearch"
import { TablePagination } from "./sub-components/functional/TablePagination"
import { TableFilter } from "./sub-components/functional/TableFilter"
import { TableColumnToggle } from "./sub-components/functional/TableColumnToggle"
import { TableExport } from "./sub-components/operational/TableExport"
import { TableImport } from "./sub-components/operational/TableImport"
import { statusStyles } from './data/status'
import { useToast } from "@/hooks/use-toast"
import { TableSelect } from "./sub-components/functional/TableSelect"
import { TableAdd } from "./sub-components/operational/TableAdd"
import { TableBulkEdit } from "./sub-components/operational/TableBulkEdit"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { TableDelete } from "./sub-components/operational/TableDelete"
import { FetchPopulatedData, FetchTableData, UpdateRow } from "./utils/utils"
import TableKanban from "./sub-components/operational/TableKanban"
import { Button } from "@/components/ui/button"

// Interfaces
interface EditingCell {
    rowIndex: number;
    columnKey: string;
    value: any;
}

interface PendingEdit {
    rowIndex: number;
    columnKey: string;
    value: any;
    originalData: any;
}

// Utility Functions
const truncateText = (text: string, maxLength: number = 15): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
};

const formatObjectValue = (value: any): string => {
    if (!value || typeof value !== 'object') {
        return truncateText(String(value || ''));
    }

    if (Array.isArray(value)) {
        return truncateText(value.map(item => {
            if (typeof item === 'object') {
                const { description, quantity, price } = item;
                if (description && quantity && price) {
                    return `${description} (${quantity} × ${price})`;
                }
            }
            return String(item);
        }).join(', '));
    }

    if ('name' in value && 'email' in value) {
        return truncateText(`${value.name} (${value.email})`);
    }

    if (Object.keys(value).length === 1) {
        const firstValue = Object.values(value)[0];
        return typeof firstValue === 'string' || typeof firstValue === 'number'
            ? String(firstValue)
            : truncateText(String(firstValue));
    }

    return truncateText(Object.entries(value)
        .map(([key, val]) => `${key}: ${formatObjectValue(val)}`)
        .join(' | '));
};

const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => {
        return acc && acc[part] !== undefined ? acc[part] : null;
    }, obj);
};

const formatDateForInput = (date: string | Date) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
};


const formatFilterParams = (filters: FilterValue[]) => {
    return filters.map(filter => ({
        field: filter.column,
        operator: filter.operator,
        value: filter.value,
        secondValue: filter.secondValue,
        type: filter.type
    }));
};

// Custom Hooks
const useTableData = (config: TableProps['config'], endpoint: string, sorting: SortingState, searchTerm: string, pagination: PaginationState, filters: FilterValue[]) => {
    const [data, setData] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [operationLoading, setOperationLoading] = useState(false);
    const [paginationState, setPaginationState] = useState(pagination);

    const loadTableData = useCallback(async () => {
        if (loading) {
            setLoading(true);
        } else {
            setOperationLoading(true);
        }

        try {
            // Format pagination parameters
            const paginationParams = JSON.stringify({
                page: pagination.pageIndex + 1,
                pageSize: pagination.pageSize
            });

            // Format filter parameters
            const filterParams = JSON.stringify(
                filters.length > 0 ? formatFilterParams(filters) : []
            );

            // Format sort parameters
            const sortParams = JSON.stringify({
                column: sorting.column || 'id',
                ascending: sorting.direction === 'asc'
            });

            // Format search parameters
            const searchParams = JSON.stringify({
                searchColumn: config.search?.searchableColumns?.[0] || 'name',
                searchQuery: searchTerm
            });

            const response = await FetchTableData(
                endpoint,
                paginationParams,
                filterParams,
                sortParams,
                searchParams
            );

            setData(response.data.items);

            // Update pagination state with the response data
            if (response.data.pagination) {
                setPaginationState({
                    pageIndex: response.data.pagination.currentPage - 1,
                    pageSize: response.data.pagination.pageSize,
                    totalPages: response.data.pagination.totalPages,
                    totalItems: response.data.pagination.totalItems
                });
            }

            return response.data.pagination;
        } catch (error) {
            setError('Failed to fetch data from ' + endpoint);
            setData([]);
        } finally {
            setLoading(false);
            setOperationLoading(false);
        }
    }, [endpoint, pagination, filters, sorting, searchTerm, config.search?.searchableColumns]);

    return {
        data,
        setData,
        error,
        loading,
        operationLoading,
        setOperationLoading,
        loadTableData,
        paginationState,
        setPaginationState
    };
};

const useTableSelection = (data: any[]) => {
    const [selectedRows, setSelectedRows] = useState<Record<number, boolean>>({});

    const isAllSelected = useMemo(() =>
        data.length > 0 && data.every((_, index) => selectedRows[index]),
        [data.length, selectedRows]
    );

    const isSomeSelected = useMemo(() =>
        data.some((_, index) => selectedRows[index]),
        [selectedRows]
    );

    const selectedCount = useMemo(() =>
        Object.values(selectedRows).filter(Boolean).length,
        [selectedRows]
    );

    const selectedData = useMemo(() =>
        data.filter((_, index) => selectedRows[index]),
        [data, selectedRows]
    );

    return {
        selectedRows,
        setSelectedRows,
        isAllSelected,
        isSomeSelected,
        selectedCount,
        selectedData
    };
};

// Main Component
export function TableComponent({ config, endpoint, populate }: TableProps) {
    // State
    const [sorting, setSorting] = useState<SortingState>({
        column: null,
        direction: null
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: config.pagination?.pageSize || 10,
        totalPages: 0,
        totalItems: 0
    });
    const [filters, setFilters] = useState<FilterValue[]>([]);
    const [visibleColumns, setVisibleColumns] = useState<string[]>(
        config.columns
            .filter(col => col.defaultVisible !== false)
            .map(col => col.accessorKey)
    );
    const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
    const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
    const [pendingEdits, setPendingEdits] = useState<PendingEdit[]>([]);
    const [kanbanView, setKanbanView] = useState(false);

    // Refs
    const searchDebounce = useRef<NodeJS.Timeout | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Hooks
    const { toast } = useToast();
    const {
        data,
        setData,
        error,
        loading,
        operationLoading,
        setOperationLoading,
        loadTableData,
        paginationState,
        setPaginationState
    } = useTableData(config, endpoint, sorting, searchTerm, pagination, filters);

    const {
        selectedRows,
        setSelectedRows,
        isAllSelected,
        isSomeSelected,
        selectedCount,
        selectedData
    } = useTableSelection(data);


    // Event Handlers
    const handleSort = useCallback((column: string) => {
        setSorting(prev => ({
            column,
            direction:
                prev.column === column && prev.direction === 'asc'
                    ? 'desc'
                    : prev.column === column && prev.direction === 'desc'
                        ? null
                        : 'asc'
        }));
    }, []);

    const handleSelectAll = useCallback((checked: boolean) => {
        setSelectedRows(prev => {
            const newSelected = { ...prev };
            data.forEach((_, index) => {
                newSelected[index] = checked;
            });
            return newSelected;
        });
        config.select?.onSelect?.(checked ? data : []);
    }, [data, config.select]);

    const handleSelectRow = useCallback((rowIndex: number, checked: boolean) => {
        setSelectedRows(prev => ({
            ...prev,
            [rowIndex]: checked
        }));
    }, []);


    const handleCellDoubleClick = useCallback((e: React.MouseEvent, column: any, row: any, rowIndex: number) => {
        if (!column.editable) return;

        e.preventDefault();
        const value = getNestedValue(row, column.accessorKey);

        // Don't set editing state if the cell is already being edited
        if (editingCell?.rowIndex === rowIndex && editingCell?.columnKey === column.accessorKey) return;

        setEditingCell({
            rowIndex,
            columnKey: column.accessorKey,
            value: value
        });

        // Focus the input after a brief delay to ensure the input is rendered
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 0);
    }, [editingCell]);

    const handleCellEdit = useCallback(async (newValue: string | number) => {
        if (!editingCell) return;

        const column = config.columns.find(col => col.accessorKey === editingCell.columnKey);
        if (!column) return;

        try {
            let processedValue = newValue;

            // Handle number type fields
            if (column.type === 'number' || column.editConfig?.type === 'number') {
                const numberValue = Number(newValue);
                if (isNaN(numberValue)) {
                    throw new Error('Invalid number');
                }
                processedValue = numberValue;

                // Apply validation if exists
                if (column.editConfig?.validation?.zodSchema) {
                    column.editConfig.validation.zodSchema.parse(numberValue);
                }
            } else if (column.editConfig?.validation?.zodSchema) {
                // For Other types, apply validation as before
                column.editConfig.validation.zodSchema.parse(newValue);
            }

            const originalValue = getNestedValue(data[editingCell.rowIndex], editingCell.columnKey);

            // Check if the value has actually changed
            if (processedValue === originalValue) {
                setEditingCell(null);
                return;
            }

            const rowData = data[editingCell.rowIndex];
            setPendingEdits(prev => {
                const filtered = prev.filter(
                    edit => !(edit.rowIndex === editingCell.rowIndex &&
                        edit.columnKey === editingCell.columnKey)
                );
                return [...filtered, {
                    rowIndex: editingCell.rowIndex,
                    columnKey: editingCell.columnKey,
                    value: processedValue,
                    originalData: rowData
                }];
            });

        } catch (error) {
            toast({
                title: "Validation Error",
                description: error instanceof Error ? error.message : "Invalid input value",
                variant: "destructive"
            });
        } finally {
            setEditingCell(null);
        }
    }, [editingCell, data, config.columns, toast]);


    const handleBatchUpdate = useCallback(async () => {
        setOperationLoading(true);
        try {
            const changesByRow = pendingEdits.reduce((acc, edit) => {
                const key = edit.rowIndex;
                if (!acc[key]) {
                    acc[key] = { ...edit.originalData };
                }

                const keys = edit.columnKey.split('.');
                let current = acc[key];
                for (let i = 0; i < keys.length - 1; i++) {
                    if (!current[keys[i]]) {
                        current[keys[i]] = {};
                    }
                    current = current[keys[i]];
                }
                current[keys[keys.length - 1]] = edit.value;

                return acc;
            }, {} as Record<number, any>);

            const updatePromises = Object.entries(changesByRow).map(async ([rowIndex, rowData]) => {
                if (!rowData.id) throw new Error('Missing ID for update');

                const response = await UpdateRow(endpoint, rowData);
                if (response.status !== 200) throw new Error(`Failed to update row ${rowData.id}`);

                // Extract the first item from the response data array
                const updatedData = response.data[0];

                return {
                    rowIndex: Number(rowIndex),
                    data: updatedData
                };
            });

            const results = await Promise.all(updatePromises);
            const newData = [...data];

            results.forEach(({ rowIndex, data: updatedData }) => {
                if (rowIndex >= 0 && rowIndex < newData.length) {
                    // Completely replace the old data with the new data
                    newData[rowIndex] = updatedData;
                }
            });

            // Update the state with the new data
            setData(newData);
            setPendingEdits([]);

            toast({
                title: "Success",
                description: "Changes saved successfully",
            });

        } catch (error) {
            console.error('Update error:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save changes",
                variant: "destructive",
            });
        } finally {
            setOperationLoading(false);
        }
    }, [pendingEdits, data, endpoint, toast, setOperationLoading]);

    // Effects
    useEffect(() => {
        if (populate && populate.fieldName && populate.source) {
            const populateData = async () => {
                const response = await FetchPopulatedData(endpoint, populate.fieldName, populate.source);
                if (response.status === 200) {
                    config.columns.forEach(column => {
                        if (column.accessorKey === populate.fieldName) {
                            column.options = response.data.populatedData;
                            if (column.editConfig) {
                                column.editConfig.options = response.data.populatedData;
                            }
                        }
                    });
                }
            };
            populateData();
        }
    }, [populate, config]);

    useEffect(() => {

        if (searchDebounce.current) {
            clearTimeout(searchDebounce.current);
        }

        searchDebounce.current = setTimeout(() => {
            loadTableData();
        }, 300);

        return () => {
            if (searchDebounce.current) {
                clearTimeout(searchDebounce.current);
            }
        };
    }, [loadTableData, sorting, searchTerm, config.search?.searchableColumns]);

    // Render Methods
    const renderCell = (row: any, column: any, rowIndex: number) => {
        const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.columnKey === column.accessorKey;
        const value = getNestedValue(row, column.accessorKey);
        const pendingValue = pendingEdits.find(
            edit => edit.rowIndex === rowIndex && edit.columnKey === column.accessorKey
        )?.value;

        if (isEditing) {
            const cellStyle = "p-0"; // Remove padding when editing

            if (column.type === 'number' || column.editConfig?.type === 'number') {
                return (
                    <div className={cellStyle}>
                        <Input
                            ref={inputRef}
                            className="h-8 w-full border-0 focus:ring-0 bg-transparent text-right"
                            type="number"
                            defaultValue={value}
                            onBlur={(e) => handleCellEdit(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCellEdit(e.currentTarget.value);
                                if (e.key === 'Escape') setEditingCell(null);
                            }}
                        />
                    </div>
                )
            }
            if (column.editConfig?.type === 'select') {
                return (
                    <div className={cellStyle}>
                        <Select
                            defaultValue={String(value)}
                            onValueChange={(newValue) => {
                                const selectedOption = column.editConfig.options?.find(
                                    (opt: any) => opt.value === newValue
                                );
                                handleCellEdit(selectedOption?.label || newValue);
                            }}
                        >
                            <SelectTrigger className="h-8 border-0 bg-transparent focus:ring-0">
                                <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                                {column.editConfig.options?.map((option: any) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );
            }
            if (column.type === 'number') {
                return pendingValue ?? value ?? '-';
            }

            const isDateField = column.type === 'date' ||
                column.accessorKey.toLowerCase().includes('date') ||
                column.accessorKey === 'createdAt' ||
                column.accessorKey === 'updatedAt';

            return (
                <div className={cellStyle}>
                    <Input
                        ref={inputRef}
                        className="h-8 w-full border-0 focus:ring-0 bg-transparent"
                        type={isDateField ? 'date' : column.editConfig?.type || 'text'}
                        defaultValue={isDateField ? formatDateForInput(value) : value}
                        onBlur={(e) => handleCellEdit(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCellEdit(e.currentTarget.value);
                            if (e.key === 'Escape') setEditingCell(null);
                        }}
                    />
                </div>
            );
        }

        if (column.accessorKey === 'status') {
            const status = String(pendingValue || value).toLowerCase();
            return (
                <span className={statusStyles[status] || "text-gray-500"}>
                    {pendingValue || value}
                </span>
            );
        }

        return formatValue(row, column.accessorKey, rowIndex, pendingValue);
    };

    const formatValue = useCallback((row: any, accessorKey: string, rowIndex: number, pendingValue?: any) => {
        const value = pendingValue ?? getNestedValue(row, accessorKey);

        if (value === null || value === undefined) {
            return '-';
        }

        const column = config.columns.find(col => col.accessorKey === accessorKey);

        if (column?.type === 'select') {
            return value;
        }

        if (value instanceof Date ||
            accessorKey.toLowerCase().includes('date') ||
            typeof value === 'string' && !isNaN(Date.parse(value))) {
            try {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    return new Intl.DateTimeFormat('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    }).format(date);
                }
            } catch (error) {
                console.error('Error formatting date:', error);
            }
        }

        if (typeof value === 'number') {
            if (accessorKey === 'total' || accessorKey.includes('price')) {
                return new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(value);
            }
            return value.toLocaleString();
        }

        if (typeof value === 'object') {
            return formatObjectValue(value);
        }

        return truncateText(String(value));
    }, [config.columns]);

    if (error) {
        return (
            <div className="m-4 p-4 border border-red-200 rounded-lg bg-red-50 text-red-600">
                {error}
            </div>
        );
    }

    if (kanbanView) {
        return (
            <div>
                <TableKanban
                    config={config.kanban}
                    onToogle={() => { setKanbanView(false); loadTableData() }}
                    endpoint={endpoint}
                />
            </div>
        )
    }

    return (
        <div className={cn("rounded-lg", config.styles?.wrapper)}>
            {/* Header Section */}
            <div className="mb-4">
                {config.title && (
                    <h1 className={cn(
                        "text-4xl font-bold text-left pt-4",
                        config.styles?.title
                    )}>
                        {config.title}
                    </h1>
                )}
                {config.description && (
                    <p className={cn(
                        "text-left text-sm text-gray-500 pb-4",
                        config.styles?.description
                    )}>
                        {config.description}
                    </p>
                )}
            </div>

            {/* Controls Section */}
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                    {config.search?.enabled && (
                        <TableSearch
                            config={config.search}
                            value={searchTerm}
                            onChange={setSearchTerm}
                        />
                    )}
                    <TableAdd
                        config={config}
                        endpoint={endpoint}
                        onSuccess={() => loadTableData()}
                    />
                    {config.filter?.enabled && (
                        <TableFilter
                            tableName={config.id || ''}
                            config={config.filter}
                            columns={config.columns}
                            sorting={sorting}
                            onFilterChange={setFilters}
                        />
                    )}
                    {config.kanban?.enabled && (
                        <Button variant={"outline"} onClick={() => { setKanbanView(!kanbanView) }}><Kanban />Toogle Kanban View</Button>
                    )}
                    {config.select?.enabled && selectedCount > 0 && (
                        <>
                            <span className="text-sm text-muted-foreground">
                                {selectedCount} row{selectedCount > 1 ? 's' : ''} selected
                            </span>
                            {config.bulkEdit?.enabled && (
                                <TableBulkEdit
                                    config={config}
                                    endpoint={endpoint}
                                    selectedData={selectedData}
                                    onSuccess={() => loadTableData()}
                                    onClearSelection={() => setSelectedRows({})}
                                    isOpen={isBulkEditOpen}
                                    onOpenChange={setIsBulkEditOpen}
                                />
                            )}
                        </>
                    )}
                    {pendingEdits.length > 0 && (
                        <button
                            onClick={handleBatchUpdate}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                            disabled={operationLoading}
                        >
                            {operationLoading ? 'Saving...' : `Save ${pendingEdits.length} Changes`}
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {config.import?.enabled && (
                        <TableImport
                            config={config.import}
                            endpoint={endpoint}
                            onSuccess={() => loadTableData()}
                        />
                    )}
                    {config.export?.enabled && (
                        <TableExport
                            config={config.export}
                            endpoint={endpoint}
                            filters={filters.length > 0 ? JSON.stringify(filters) : undefined}
                            search={searchTerm}
                            data={data}
                        />
                    )}
                    {config.columnToggle?.enabled && (
                        <TableColumnToggle
                            tableId={config.id}
                            columns={config.columns}
                            visibleColumns={visibleColumns}
                            onColumnToggle={setVisibleColumns}
                        />
                    )}
                </div>
            </div>

            {/* Table Section */}
            <div className="relative border rounded-lg overflow-hidden shadow-sm">
                {operationLoading && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center">
                        <div className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                            <span className="text-muted-foreground">Loading...</span>
                        </div>
                    </div>
                )}

                <Table className={config.styles?.table}>
                    <TableHeader className={config.styles?.header}>
                        <TableRow className={config.styles?.headerRow}>
                            {config.select?.enabled && (
                                <TableHead className="w-[50px] px-4">
                                    {config.select.type === 'multiple' && (
                                        <TableSelect
                                            checked={isAllSelected}
                                            indeterminate={!isAllSelected && isSomeSelected}
                                            onChange={handleSelectAll}
                                        />
                                    )}
                                </TableHead>
                            )}
                            {config.columns
                                .filter(column => visibleColumns.includes(column.accessorKey))
                                .map((column) => (
                                    <TableHead
                                        key={column.id}
                                        className={cn(
                                            config.styles?.headerCell,
                                            column.className,
                                            column.sortable && "cursor-pointer select-none"
                                        )}
                                        onClick={() => column.sortable && handleSort(column.accessorKey)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {column.header}
                                            {column.sortable && (
                                                <div className="flex flex-col">
                                                    <ChevronUp
                                                        className={cn(
                                                            "h-3 w-3 -mb-1",
                                                            sorting.column === column.accessorKey &&
                                                                sorting.direction === 'asc'
                                                                ? "text-foreground"
                                                                : "text-muted-foreground opacity-50"
                                                        )}
                                                    />
                                                    <ChevronDown
                                                        className={cn(
                                                            "h-3 w-3",
                                                            sorting.column === column.accessorKey &&
                                                                sorting.direction === 'desc'
                                                                ? "text-foreground"
                                                                : "text-muted-foreground opacity-50"
                                                        )}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </TableHead>
                                ))}
                            <TableHead className="w-[50px] px-4">Actions</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody className={config.styles?.body}>
                        {loading ? (
                            <TableRow>
                                <TableCell
                                    colSpan={visibleColumns.length + (config.select?.enabled ? 2 : 1)}
                                    className="h-24 text-center"
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                                        <span className="text-muted-foreground">Loading data...</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={visibleColumns.length + (config.select?.enabled ? 2 : 1)}
                                    className={cn(
                                        "h-24 text-center text-muted-foreground",
                                        config.styles?.noResults
                                    )}
                                >
                                    No results found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, rowIndex) => (
                                <TableRow
                                    key={rowIndex}
                                    className={cn(
                                        config.styles?.bodyRow,
                                        "hover:bg-muted/50"
                                    )}
                                >
                                    {config.select?.enabled && (
                                        <TableCell className="w-[50px] px-4">
                                            <TableSelect
                                                checked={!!selectedRows[rowIndex]}
                                                onChange={(checked) => {
                                                    if (config.select?.type === 'single') {
                                                        setSelectedRows({ [rowIndex]: checked });
                                                        config.select?.onSelect?.(checked ? [row] : []);
                                                    } else {
                                                        handleSelectRow(rowIndex, checked);
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                    )}
                                    {config.columns
                                        .filter(column => visibleColumns.includes(column.accessorKey))
                                        .map((column) => (
                                            <TableCell
                                                key={`${rowIndex}-${column.id}`}
                                                className={cn(
                                                    config.styles?.bodyCell,
                                                    column.className,
                                                    column.editable && "cursor-text",
                                                    pendingEdits.some(edit =>
                                                        edit.rowIndex === rowIndex &&
                                                        edit.columnKey === column.accessorKey
                                                    ) && "bg-muted/50",
                                                    editingCell?.rowIndex === rowIndex &&
                                                    editingCell?.columnKey === column.accessorKey &&
                                                    "p-0" // Remove padding when editing
                                                )}
                                                onDoubleClick={(e) => handleCellDoubleClick(e, column, row, rowIndex)}
                                            >
                                                {renderCell(row, column, rowIndex)}
                                            </TableCell>
                                        ))}
                                    <TableCell className="w-[50px] px-4">
                                        <TableDelete
                                            config={config}
                                            endpoint={endpoint}
                                            rowId={row.id}
                                            onSuccess={() => loadTableData()}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Section */}
            {config.pagination?.enabled && (
                <TablePagination
                    config={config.pagination}
                    state={paginationState}  // Use paginationState instead of pagination
                    onChange={(newState) => {
                        setPagination(prev => ({
                            ...prev,
                            ...newState
                        }));
                    }}
                />
            )}
        </div>
    );
}
