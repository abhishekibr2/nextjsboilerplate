"use client"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { DeleteRow } from "../../utils/utils"

interface TableDeleteProps {
    config: any;
    endpoint: string;
    rowId: string;
    onSuccess: () => void;
}

export function TableDelete({ endpoint, rowId, onSuccess }: TableDeleteProps) {
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const handleDelete = async () => {
        setIsLoading(true)
        try {
            const response = await DeleteRow(endpoint, rowId)

            if (response.status !== 200) {
                throw new Error(response.message || 'Failed to delete item')
            }

            toast({
                title: "Success",
                description: "Item deleted successfully",
            })

            onSuccess()
        } catch (error) {
            console.error('Delete error:', error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete item",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete this item
                        and remove its data from our servers.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive hover:bg-destructive/90"
                        disabled={isLoading}
                    >
                        {isLoading ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
} 