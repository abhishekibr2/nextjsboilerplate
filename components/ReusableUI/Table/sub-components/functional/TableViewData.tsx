"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TableColumn } from "@/types/table.types"

interface TableViewDataProps {
    isOpen: boolean
    onClose: () => void
    data: any
    columns: any[]
}

export function TableViewData({ isOpen, onClose, data, columns }: TableViewDataProps) {
    const formatValue = (value: any, column: TableColumn): string => {
        if (value === null || value === undefined) {
            return '-';
        }

        // Handle Date fields
        const dateFields = ['createdAt', 'updatedAt', 'dateIssued', 'dueDate', 'date', 'birthDate', 'joinedAt', 'created_at', 'updated_at'];
        if (value instanceof Date ||
            dateFields.some(field => column.accessorKey.toLowerCase().includes(field.toLowerCase())) ||
            (typeof value === 'string' && !isNaN(Date.parse(value)))) {
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

        // Handle select/status fields
        if (column.type === 'select' && column.options) {
            const option = column.options.find(opt => opt.value === value);
            return option ? option.label : value;
        }

        // Handle arrays
        if (Array.isArray(value)) {
            return value.map(item => {
                if (typeof item === 'object') {
                    return Object.entries(item)
                        .map(([key, val]) => `${key}: ${val}`)
                        .join(', ');
                }
                return String(item);
            }).join(' | ');
        }

        // Handle objects (including nested objects)
        if (typeof value === 'object') {
            return Object.entries(value)
                .map(([key, val]) => {
                    if (typeof val === 'object' && val !== null) {
                        return `${key}: ${formatValue(val, column)}`;
                    }
                    return `${key}: ${val}`;
                })
                .join(' | ');
        }

        return String(value);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent onClick={(e) => e.stopPropagation()}>
                <DialogHeader>
                    <DialogTitle>View Details</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-full max-h-[60vh] w-full rounded-md border p-4">
                    <div className="space-y-4">
                        {columns.map((column) => {
                            const value = column.accessorKey.includes('.')
                                ? column.accessorKey.split('.').reduce((obj: any, key: string) => obj?.[key], data)
                                : data[column.accessorKey];

                            return (
                                <div key={column.id} className="grid grid-cols-[200px,1fr] gap-4 items-start">
                                    <label className="text-sm font-medium text-gray-500">
                                        {column.header}
                                    </label>
                                    <div className="text-sm break-words">
                                        {formatValue(value, column)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}
