"use client"

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TableColumn, TableConfig } from "@/types/table.types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AddRow } from "@/utils/utils";

interface TableAddProps {
    config: TableConfig;
    endpoint: string;
    onSuccess?: () => void;
}

type FormDataType = {
    [key: string]: any;
};


interface ValidationRules {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    zodSchema?: any;
}

export function TableAdd({ config, onSuccess, endpoint }: TableAddProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    // Initialize form with default values
    const form = useForm({
        resolver: config.validationSchema ? zodResolver(config.validationSchema) : undefined,
        defaultValues: (() => {
            const initialData: FormDataType = {};

            config.columns.forEach((column) => {
                if (column.accessorKey.includes('.')) {
                    const parts = column.accessorKey.split('.');
                    let current = initialData;
                    for (let i = 0; i < parts.length - 1; i++) {
                        if (!current[parts[i]]) {
                            current[parts[i]] = {};
                        }
                        current = current[parts[i]];
                    }
                    current[parts[parts.length - 1]] = '';
                } else {
                    switch (column.type) {
                        case 'number':
                            initialData[column.accessorKey] = 0;
                            break;
                        case 'date':
                            initialData[column.accessorKey] = new Date();
                            break;
                        case 'select':
                            initialData[column.accessorKey] = column.options?.[0]?.value || '';
                            break;
                        default:
                            initialData[column.accessorKey] = '';
                    }
                }
            });

            return initialData;
        })(),
        mode: "onSubmit",
        reValidateMode: "onChange"
    });

    const { register, handleSubmit, reset, setValue, formState: { errors } } = form;

    // Add this helper function to get nested errors
    const getNestedError = (path: string) => {
        const parts = path.split('.');
        let current: any = errors;
        for (const part of parts) {
            if (!current?.[part]) return undefined;
            current = current[part];
        }
        return current;
    };

    const onSubmit = async (data: any) => {
        if (!data) {
            console.error("No data provided to onSubmit");
            return;
        }

        try {
            setIsLoading(true);

            // Transform nested field values into proper structure
            const transformedData = Object.entries(data).reduce((acc: any, [key, value]) => {
                if (key.includes('.')) {
                    const parts = key.split('.');
                    let current = acc;
                    for (let i = 0; i < parts.length - 1; i++) {
                        current[parts[i]] = current[parts[i]] || {};
                        current = current[parts[i]];
                    }
                    current[parts[parts.length - 1]] = value;
                } else {
                    acc[key] = value;
                }
                return acc;
            }, {});

            // Add createdAt and updatedAt if they're required by the schema
            if (config.validationSchema) {
                transformedData.created_at = new Date();
                transformedData.updated_at = new Date();
            }


            const response = await AddRow(endpoint, transformedData);

            if (!response) {
                throw new Error(`Failed to add ${config.title || "item"}`);
            }

            setIsOpen(false);
            reset();
            toast({
                title: "Success",
                description: `${config.title || "Item"} has been added successfully.`,
                variant: "default",
            });
            onSuccess?.();
        } catch (error) {
            console.error("Submission error:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to add item",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Modify renderField to use react-hook-form register
    const renderField = (column: TableColumn) => {
        if (column.accessorKey === 'client') return null;

        // Get validation rules from editConfig if available
        const validationRules = (column.editConfig?.validation || {}) as ValidationRules;
        const error = getNestedError(column.accessorKey);

        // Check field type first, regardless of nesting
        if (column.type === "select") {
            return (
                <div className="space-y-1" key={column.id}>
                    <Label htmlFor={column.accessorKey} className="text-sm font-medium">
                        {column.header}
                        {validationRules.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Select
                        onValueChange={(value) => {
                            // Find the corresponding label for the selected value
                            const selectedOption = column.options?.find(opt => opt.value === value);
                            setValue(column.accessorKey, selectedOption?.label || value);
                        }}
                        defaultValue={column.options?.[0]?.value as string}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={`Select ${column.header.toLowerCase()}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {column.options?.map((option) => (
                                <SelectItem key={String(option.value)} value={String(option.value)}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {error && (
                        <p className="text-sm text-red-500">
                            {error.message as string}
                        </p>
                    )}
                </div>
            );
        }

        // Handle nested fields for non-select types
        if (column.accessorKey.includes('.')) {
            return (
                <div className="space-y-1" key={column.id}>
                    <Label htmlFor={column.accessorKey} className="text-sm font-medium">
                        {column.header}
                        {validationRules.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>
                    <Input
                        id={column.accessorKey}
                        type={column.type === "email" ? "email" : "text"}
                        {...register(column.accessorKey, {
                            required: validationRules.required && `${column.header} is required`,
                            minLength: validationRules.minLength && {
                                value: validationRules.minLength,
                                message: `${column.header} must be at least ${validationRules.minLength} characters`
                            },
                            maxLength: validationRules.maxLength && {
                                value: validationRules.maxLength,
                                message: `${column.header} must not exceed ${validationRules.maxLength} characters`
                            }
                        })}
                    />
                    {error && (
                        <p className="text-sm text-red-500">
                            {error.message as string}
                        </p>
                    )}
                </div>
            );
        }

        // Handle remaining non-nested fields
        switch (column.type) {
            case "text":
            case "email":
            case "phone":
                return (
                    <div className="space-y-1" key={column.id}>
                        <Label htmlFor={column.accessorKey} className="text-sm font-medium">
                            {column.header}
                            {validationRules.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                            id={column.accessorKey}
                            type={column.type === "email" ? "email" : "text"}
                            {...register(column.accessorKey, {
                                required: validationRules.required && `${column.header} is required`,
                                minLength: validationRules.minLength && {
                                    value: validationRules.minLength,
                                    message: `${column.header} must be at least ${validationRules.minLength} characters`
                                },
                                maxLength: validationRules.maxLength && {
                                    value: validationRules.maxLength,
                                    message: `${column.header} must not exceed ${validationRules.maxLength} characters`
                                }
                            })}
                        />
                        {error && (
                            <p className="text-sm text-red-500">
                                {error.message as string}
                            </p>
                        )}
                    </div>
                );

            case "select":
                return (
                    <div className="space-y-1" key={column.id}>
                        <Label htmlFor={column.accessorKey} className="text-sm font-medium">
                            {column.header}
                            {validationRules.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Select
                            onValueChange={(value) => setValue(column.accessorKey, value)}
                            defaultValue={column.options?.[0]?.value as string}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={`Select ${column.header.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {column.options?.map((option) => (
                                    <SelectItem key={String(option.value)} value={String(option.value)}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {error && (
                            <p className="text-sm text-red-500">
                                {error.message as string}
                            </p>
                        )}
                    </div>
                );

            case "number":
                return (
                    <div className="space-y-1" key={column.id}>
                        <Label htmlFor={column.accessorKey} className="text-sm font-medium">
                            {column.header}
                            {validationRules.required && <span className="text-red-500 ml-1">*</span>}
                        </Label>
                        <Input
                            id={column.accessorKey}
                            type="number"
                            {...register(column.accessorKey, {
                                required: validationRules.required && `${column.header} is required`,
                                valueAsNumber: true,
                                min: validationRules.min && {
                                    value: validationRules.min,
                                    message: `${column.header} must be at least ${validationRules.min}`
                                },
                                max: validationRules.max && {
                                    value: validationRules.max,
                                    message: `${column.header} must not exceed ${validationRules.max}`
                                }
                            })}
                        />
                        {error && (
                            <p className="text-sm text-red-500">
                                {error.message as string}
                            </p>
                        )}
                    </div>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
                reset();
            }
        }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2" onClick={() => setIsOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add {config.title || "Data"}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[800px]" onPointerDownOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">
                        Add New {config.title || "Data"}
                    </DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={handleSubmit((data) => {
                        return onSubmit(data);
                    }, (errors) => {
                        toast({
                            title: "Validation Error",
                            description: "Please check the form for errors",
                            variant: "destructive"
                        });
                    })}
                >
                    <ScrollArea className="h-[450px] pr-4">
                        <div className="grid grid-cols-2 gap-4 py-4">
                            {config.columns.map(renderField)}
                        </div>
                    </ScrollArea>
                    <DialogFooter>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent mr-2" />
                                    Adding...
                                </>
                            ) : (
                                `Add ${config.title || "Data"}`
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
