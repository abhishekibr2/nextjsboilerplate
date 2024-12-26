import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Plus, Filter, X, Save, FolderOpen, Loader2 } from "lucide-react"
import { FilterConfig, FilterOperator, FilterValue, SortingState, TableColumn } from "@/types/table.types"
import { useState } from "react"
import { filterOptions } from "../../data/filterOptions"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { AddFilter, GetFilters, GetUser } from "../../utils/utils"

interface TableFilterProps {
    config: FilterConfig;
    columns: TableColumn[];
    onFilterChange: (filters: FilterValue[]) => void;
    sorting?: SortingState;
    onLoadFilter?: (filters: FilterValue[], sorting: SortingState) => void;
    tableName: string;
}

interface SavedFilter {
    id: string;
    name: string;
    filters: FilterValue[];
    sorting: SortingState;
    tableName: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

const typeOperators: Record<string, { label: string; value: FilterOperator }[]> = {
    text: [
        { label: 'Equals', value: 'equals' },
        { label: 'Not Equals', value: 'notEquals' },
        { label: 'Contains', value: 'contains' },
        { label: 'Not Contains', value: 'notContains' },
        { label: 'Starts With', value: 'startsWith' },
        { label: 'Ends With', value: 'endsWith' }
    ],
    hidden: [
        { label: 'Equals', value: 'equals' },
        { label: 'Not Equals', value: 'notEquals' },
    ],
    textarea: [
        { label: 'Equals', value: 'equals' },
        { label: 'Not Equals', value: 'notEquals' },
        { label: 'Contains', value: 'contains' },
        { label: 'Not Contains', value: 'notContains' }
    ],
    email: [
        { label: 'Equals', value: 'equals' },
        { label: 'Not Equals', value: 'notEquals' },
        { label: 'Contains', value: 'contains' },
        { label: 'Not Contains', value: 'notContains' }
    ],
    number: [
        { label: 'Equals', value: 'equals' },
        { label: 'Not Equals', value: 'notEquals' },
        { label: 'Greater Than', value: 'greaterThan' },
        { label: 'Less Than', value: 'lessThan' },
        { label: 'Greater Than or Equal', value: 'greaterThanEqual' },
        { label: 'Less Than or Equal', value: 'lessThanEqual' },
        { label: 'Between', value: 'between' }
    ],
    date: [
        { label: 'Before', value: 'before' },
        { label: 'After', value: 'after' },
        { label: 'On Date', value: 'onDate' },
        { label: 'Date Range', value: 'dateRange' }
    ],
    select: [
        { label: 'Is', value: 'is' },
        { label: 'Is Not', value: 'isNot' }
    ],
    array: [
        { label: 'Contains Any', value: 'hasAny' },
        { label: 'Contains All', value: 'hasAll' },
        { label: 'In', value: 'in' },
        { label: 'Not In', value: 'notIn' }
    ]
};

export function TableFilter({ columns, onFilterChange, sorting, onLoadFilter, tableName }: TableFilterProps) {
    const [filters, setFilters] = useState<FilterValue[]>([])
    const [localFilters, setLocalFilters] = useState<FilterValue[]>([])
    const [loading, setLoading] = useState(false)
    const [isOpen, setIsOpen] = useState(false)
    const [isSaveDialogOpen, setSaveDialogOpen] = useState(false)
    const [isLoadDialogOpen, setLoadDialogOpen] = useState(false)
    const [filterName, setFilterName] = useState("")
    const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
    const { toast } = useToast()

    const addNewFilter = () => {
        const newFilter: FilterValue = {
            column: '',
            operator: 'equals' as const,
            value: ''
        }
        setLocalFilters(prev => [...prev, newFilter])
    }

    const removeFilter = (index: number) => {
        const updatedFilters = localFilters.filter((_, i) => i !== index);
        setLocalFilters(updatedFilters);
        setFilters(updatedFilters);
        onFilterChange(updatedFilters);
    }

    const updateFilter = (index: number, field: keyof FilterValue, value: string) => {
        const newFilters = localFilters.map((filter, i) => {
            if (i !== index) return filter;

            // If changing column, reset operator and value
            if (field === 'column') {
                const columnType = columns.find(col => col.accessorKey === value)?.type || 'text';
                return {
                    ...filter,
                    column: value,
                    operator: typeOperators[columnType][0].value, // Set first operator as default
                    value: '',
                    secondValue: undefined
                };
            }

            return { ...filter, [field]: value };
        });
        setLocalFilters(newFilters);
    }


    const handleApplyFilters = () => {
        // Format filters to match the expected structure
        const formattedFilters = localFilters.map(filter => {
            const column = columns.find(col => col.accessorKey === filter.column);
            return {
                column: filter.column,
                operator: filter.operator,
                value: filter.value,
                secondValue: filter.secondValue,
                type: column?.type || 'text'
            };
        }).filter(filter =>
            filter.column &&
            filter.operator &&
            (filter.value !== undefined && filter.value !== '')
        );

        setFilters(formattedFilters);
        onFilterChange(formattedFilters);
        setIsOpen(false);
    };

    const renderValueInput = (filter: FilterValue, index: number) => {
        const selectedColumn = columns.find(col => col.accessorKey === filter.column)
        if (!selectedColumn) return null;

        // For predefined options (like status, gender)
        if (selectedColumn && filterOptions[selectedColumn.type as keyof typeof filterOptions]) {
            return (
                <Select
                    value={filter.value}
                    onValueChange={(value) => updateFilter(index, 'value', value)}
                >
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent>
                        {filterOptions[selectedColumn.type as keyof typeof filterOptions]?.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )
        }

        // Handle different types
        switch (selectedColumn.type) {
            case 'number':
                return (
                    <Input
                        type="number"
                        placeholder="Enter number"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        className="w-[200px]"
                    />
                )

            case 'date':
                return (
                    <div className="flex items-center gap-2">
                        {filter.operator === 'dateRange' ? (
                            <span className="text-sm text-muted-foreground">from</span>
                        ) : null}
                        <Input
                            type="date"
                            value={filter.value ? new Date(filter.value).toISOString().split('T')[0] : ''}
                            onChange={(e) => updateFilter(index, 'value', e.target.value)}
                            className="w-[200px]"
                        />
                    </div>
                )

            case 'email':
                return (
                    <Input
                        type="email"
                        placeholder="Enter email"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        className="w-[200px]"
                    />
                )

            case 'phone':
                return (
                    <Input
                        type="tel"
                        placeholder="Enter phone number"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                        className="w-[200px]"
                    />
                )

            case 'array':
                return (
                    <Input
                        type="text"
                        placeholder="Enter comma-separated values"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        className="w-[200px]"
                    />
                )

            case 'address':
                return (
                    <Input
                        type="text"
                        placeholder="Enter address"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        className="w-[200px]"
                    />
                )

            case 'gender':
                return (
                    <Select
                        value={filter.value}
                        onValueChange={(value) => updateFilter(index, 'value', value)}
                    >
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">FeMale</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                )

            // Default text input for 'text' and any unhandled types
            default:
                return (
                    <Input
                        type="text"
                        placeholder="Enter value"
                        value={filter.value}
                        onChange={(e) => updateFilter(index, 'value', e.target.value)}
                        className="w-[200px]"
                    />
                )
        }
    }

    const renderSecondValueInput = (filter: FilterValue, index: number) => {
        const selectedColumn = columns.find(col => col.accessorKey === filter.column)
        if (!selectedColumn) return null;

        switch (selectedColumn.type) {
            case 'number':
                return (
                    <Input
                        type="number"
                        placeholder="Enter second number"
                        value={filter.secondValue}
                        onChange={(e) => {
                            const newFilters = localFilters.map((f, i) =>
                                i === index ? { ...f, secondValue: e.target.value } : f
                            )
                            setLocalFilters(newFilters)
                        }}
                        className="w-[200px]"
                    />
                )

            case 'date':
                return (
                    <Input
                        type="date"
                        value={filter.secondValue ? new Date(filter.secondValue).toISOString().split('T')[0] : ''}
                        onChange={(e) => {
                            const newFilters = localFilters.map((f, i) =>
                                i === index ? { ...f, secondValue: e.target.value } : f
                            )
                            setLocalFilters(newFilters)
                        }}
                        className="w-[200px]"
                    />
                )

            default:
                return null
        }
    }

    const handleSaveFilter = async () => {
        if (!filterName.trim()) {
            toast({
                title: "Error",
                description: "Please enter a filter name",
                variant: "destructive"
            });
            return;
        }

        try {
            setLoading(true);
            const userId = await GetUser();
            const data = {
                name: filterName,
                filters: filters,
                sorting,
                tableName,
                createdBy: userId
            };

            const response = await AddFilter(data);
            if (response.status === 200) {
                toast({
                    title: "Success",
                    description: "Filter saved successfully"
                });
                setSaveDialogOpen(false);
                setFilterName("");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save filter",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const loadSavedFilters = async () => {
        try {
            setLoading(true);
            const userId = await GetUser() || "";
            if (!userId) {
                toast({
                    title: "Session not found",
                    variant: "destructive"
                })
            }
            const response = await GetFilters(tableName, userId)
            let filters = response.data;
            if (response.data.length !== 0) {
                filters = filters.map((filter) => {
                    if (filter.filters && typeof filter.filters === "string") {
                        filter.filters = JSON.parse(filter.filters);
                    }
                    if (filter.sorting && typeof filter.sorting === "string") {
                        filter.sorting = JSON.parse(filter.sorting);
                    }
                    return filter; // Return the updated filter object
                });
            }
            setSavedFilters(filters)
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to load filters",
                variant: "destructive"
            })
        }
        finally {
            setLoading(false);
        }
    }

    const applyFilter = (savedFilter: SavedFilter) => {
        setFilters(savedFilter.filters)
        onFilterChange(savedFilter.filters)
        if (onLoadFilter) {
            onLoadFilter(savedFilter.filters, savedFilter.sorting)
        }
        setLoadDialogOpen(false)
        setIsOpen(false)
    }

    const clearAllFilters = () => {
        setFilters([])
        setLocalFilters([])
        onFilterChange([])
        setIsOpen(false)
    }

    return (
        <div>
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filters {filters.length > 0 && `(${filters.length})`}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[800px] p-4" align="start">
                    <div className="space-y-4">
                        {localFilters.map((filter, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <Select
                                    value={filter.column}
                                    onValueChange={(value) => updateFilter(index, 'column', value)}
                                >
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue placeholder="Select column" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {columns
                                            .filter(column => column.filterable)
                                            .map((column) => (
                                                <SelectItem key={column.id} value={column.accessorKey}>
                                                    {column.header}
                                                </SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>

                                {filter.column && (
                                    <Select
                                        value={filter.operator}
                                        onValueChange={(value) => updateFilter(index, 'operator', value as FilterOperator)}
                                    >
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue placeholder="Select operator" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {typeOperators[
                                                columns.find(col => col.accessorKey === filter.column)?.type || 'text'
                                            ]?.map((op) => (
                                                <SelectItem key={op.value} value={op.value}>
                                                    {op.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}

                                {renderValueInput(filter, index)}

                                {(filter.operator === 'between' || filter.operator === 'dateRange') && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground">to</span>
                                        {renderSecondValueInput(filter, index)}
                                    </div>
                                )}

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeFilter(index)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={addNewFilter}
                            >
                                <Plus className="h-4 w-4" />
                                Add Filter
                            </Button>

                            {localFilters.length > 0 && (
                                <>
                                    <Button
                                        variant="default"
                                        size="sm"
                                        onClick={handleApplyFilters}
                                    >
                                        Apply Filters
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={clearAllFilters}
                                    >
                                        Clear Filters
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        {filters.length > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => setSaveDialogOpen(true)}
                            >
                                <Save className="h-4 w-4" />
                                Save Filter
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => {
                                loadSavedFilters()
                                setLoadDialogOpen(true)
                            }}
                        >
                            <FolderOpen className="h-4 w-4" />
                            Load Filter
                        </Button>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            {filters.length > 0 && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="ml-2"
                >
                    Clear Filters
                </Button>
            )}

            <Dialog open={isSaveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Save Filter</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            placeholder="Enter filter name"
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" disabled={loading} onClick={() => setSaveDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button disabled={loading} onClick={handleSaveFilter}>{loading && <Loader2 className="animate-spin" />}Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isLoadDialogOpen} onOpenChange={setLoadDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Load Filter</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        {savedFilters.length === 0 ? (<>
                            {loading ? (
                                <Loader2 className="animate-spin" />
                            ) : (

                                <p className="text-center text-muted-foreground">No saved filters found</p>
                            )}
                        </>
                        ) : (
                            <div className="space-y-2">
                                {savedFilters.map((filter) => (
                                    <div
                                        key={filter.id}
                                        className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted"
                                    >
                                        <span>{filter.name}</span>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => applyFilter(filter)}
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
} 