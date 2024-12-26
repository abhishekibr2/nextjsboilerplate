"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Edit2, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { Form, FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TableConfig } from "@/types/table.types"
import { BulkUpdate } from "../../utils/utils"

interface TableBulkEditProps {
    config: TableConfig
    selectedData: any[]
    onSuccess: () => void
    onClearSelection: () => void
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    endpoint: string
}

export function TableBulkEdit({
    config,
    selectedData,
    onSuccess,
    onClearSelection,
    endpoint,
    isOpen,
    onOpenChange
}: TableBulkEditProps) {
    const [selectedColumn, setSelectedColumn] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [deleteTimer, setDeleteTimer] = useState(5)
    const [canDelete, setCanDelete] = useState(false)
    const { toast } = useToast()
    const form = useForm({
        defaultValues: {
            column: "",
            value: ""
        }
    });

    const selectedField = config.bulkEdit?.fields?.find(
        field => field.name === selectedColumn
    )

    useEffect(() => {
        let timer: NodeJS.Timeout
        if (showDeleteDialog && deleteTimer > 0) {
            timer = setTimeout(() => {
                setDeleteTimer(prev => prev - 1)
            }, 1000)
        } else if (deleteTimer === 0) {
            setCanDelete(true)
        }
        return () => {
            if (timer) clearTimeout(timer)
        }
    }, [deleteTimer, showDeleteDialog])

    const handleSubmit = async (formData: any) => {

        if (!selectedColumn) {
            toast({
                title: "Error",
                description: "Please select a field to edit",
                variant: "destructive"
            })
            return;
        }

        if (!formData.value && formData.value !== 0) { // Check for both undefined and 0
            toast({
                title: "Error",
                description: "Please enter a value",
                variant: "destructive"
            })
            return;
        }

        try {
            setIsLoading(true);

            // For select fields, we want to send the label, not the value
            const selectedField = config.bulkEdit?.fields?.find(field => field.name === selectedColumn);
            let valueToSend = formData.value;

            // If it's a select field, we need to find the label for the selected value
            if (selectedField?.type === 'select') {
                const selectedOption = selectedField.options?.find(opt => opt.value.toString() === formData.value);
                valueToSend = selectedOption?.label || formData.value;
            }
            // console.log({ valueToSend })
            // console.log({ selectedData })
            // console.log(selectedField && selectedField.name)
            const fieldName = selectedField && selectedField.name || "";

            const transformedData = selectedData.map((item) => ({
                id: item.id,
                [fieldName]: valueToSend,
            }));
            const response = await BulkUpdate(endpoint, transformedData);

            if (response.status !== 200) {
                throw new Error('Failed to update items');
            }
            toast({
                title: "Success",
                description: `Successfully updated ${selectedData.length} items`,
            });

            onOpenChange(false);
            onSuccess();
            onClearSelection();
            form.reset();
            setSelectedColumn("");
        } catch (error) {
            console.error("Bulk edit error:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update items",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteDialog(true)
        setDeleteTimer(5)
        setCanDelete(false)
    }

    const handleDeleteCancel = () => {
        setShowDeleteDialog(false)
        setDeleteTimer(5)
        setCanDelete(false)
    }

    const handleDelete = async () => {
        if (!config.bulkEdit?.allowDelete) return
        setIsLoading(true)
        try {
            // const response = await fetch(`/api/${config.endpoints.bulkDelete}`, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify({
            //         ids: selectedData.map(item => item.id)
            //     }),
            // })

            // const result = await response.json()

            // if (!response.ok) {
            //     throw new Error(result.message || 'Failed to delete items')
            // }

            toast({
                title: "Success",
                description: `Successfully deleted ${selectedData.length} items`,
            })

            onSuccess()
            onClearSelection()
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete items",
                variant: "destructive"
            })
        } finally {
            setIsLoading(false)
            setShowDeleteDialog(false)
            setDeleteTimer(5)
            setCanDelete(false)
        }
    }

    return (
        <div>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => onOpenChange(true)}
                    disabled={selectedData.length === 0}
                >
                    <Edit2 className="h-4 w-4" />
                    Bulk Edit ({selectedData.length})
                </Button>

                {config.bulkEdit?.allowDelete && (
                    <Button
                        variant="destructive"
                        className="gap-2"
                        onClick={handleDeleteClick}
                        disabled={selectedData.length === 0 || isLoading}
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete ({selectedData.length})
                    </Button>
                )}
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={handleDeleteCancel}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2">
                                <div>
                                    This action cannot be undone. This will permanently delete{' '}
                                    <span className="font-medium">{selectedData.length}</span> items
                                    and remove their data from our servers.
                                </div>
                                {!canDelete && (
                                    <div className="text-muted-foreground">
                                        Confirm in {deleteTimer} seconds...
                                    </div>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleDeleteCancel}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={!canDelete || isLoading}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm mr-2"></span>
                                    Deleting...
                                </>
                            ) : (
                                'Delete Items'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Bulk Edit {selectedData.length} Items</DialogTitle>
                    </DialogHeader>

                    <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit((data) => {
                                // Create the data object that matches what handleSubmit expects
                                const submitData = {
                                    column: selectedColumn,
                                    value: data.value
                                };

                                return handleSubmit(submitData);
                            })}
                            className="space-y-4"
                        >
                            <FormField
                                control={form.control}
                                name="column"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Select Field</FormLabel>
                                        <FormControl>
                                            <Select
                                                value={selectedColumn}
                                                onValueChange={(value) => {
                                                    setSelectedColumn(value);
                                                    field.onChange(value);
                                                    form.setValue('column', value);
                                                }}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select field to edit" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {config.bulkEdit?.fields?.map(field => (
                                                        <SelectItem
                                                            key={field.name}
                                                            value={field.name}
                                                        >
                                                            {field.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            {selectedField && (
                                <FormField
                                    control={form.control}
                                    name="value"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{selectedField.label} Value</FormLabel>
                                            <FormControl>
                                                {selectedField.type === 'select' ? (
                                                    <Select
                                                        value={field.value?.toString() || ''}
                                                        onValueChange={(value) => {
                                                            // Store the value directly, not the label
                                                            field.onChange(value);
                                                            form.setValue('value', value);
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={selectedField.placeholder || "Select value"} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {selectedField.options?.map((option) => (
                                                                <SelectItem
                                                                    key={option.value.toString()}
                                                                    value={option.value.toString()}
                                                                >
                                                                    {option.label}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <Input
                                                        {...field}
                                                        type={selectedField.type}
                                                        placeholder={selectedField.placeholder || "Enter value"}
                                                        onChange={(e) => {
                                                            field.onChange(e);
                                                            form.setValue('value', e.target.value);
                                                        }}
                                                    />
                                                )}
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            )}

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        onOpenChange(false);
                                        form.reset();
                                        setSelectedColumn("");
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isLoading || !selectedColumn || !form.watch('value')}
                                >
                                    {isLoading ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm mr-2"></span>
                                            Updating...
                                        </>
                                    ) : (
                                        'Update All'
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div >
    )
} 