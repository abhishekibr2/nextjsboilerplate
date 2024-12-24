import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Upload } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { ImportConfig } from "@/types/table.types"

interface TableImportProps {
    config: ImportConfig;
    endpoint: string;
    onSuccess?: () => void;
}

export function TableImport({ config, endpoint, onSuccess }: TableImportProps) {
    const { toast } = useToast()
    const [isOpen, setIsOpen] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleFileUpload = async (file: File) => {
        try {
            if (!file.name.endsWith('.csv')) {
                const errorMsg = 'Please upload a CSV file'
                setError(errorMsg)
                toast({
                    title: "Invalid file",
                    description: errorMsg,
                    variant: "destructive"
                })
                return
            }

            toast({
                title: "Importing data...",
                description: "Please wait while we process your file.",
            })

            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch(`/api/${endpoint}`, {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Import failed')
            }

            setIsOpen(false)
            setError(null)
            toast({
                title: "Import successful",
                description: data.message || "Data has been imported successfully.",
                variant: "default"
            })
            onSuccess?.()
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to import file"
            setError(errorMessage)
            toast({
                title: "Import failed",
                description: errorMessage,
                variant: "destructive"
            })
            console.error('Import error:', error)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(false)

        const file = e.dataTransfer.files[0]
        if (file) {
            handleFileUpload(file)
        }
    }

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
    }

    const handleDragLeave = () => {
        setIsDragging(false)
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Upload className="h-4 w-4" />
                    Import
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Import Data</DialogTitle>
                </DialogHeader>
                <div
                    className={cn(
                        "border-2 border-dashed rounded-lg p-8 text-center",
                        isDragging && "border-primary bg-primary/10",
                        "transition-colors"
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                >
                    <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(file)
                        }}
                    />
                    <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                    >
                        <Upload className="h-8 w-8" />
                        <p>Drag and drop a CSV file here, or click to select</p>
                        {config.template && (
                            <a
                                href={config.template}
                                className="text-sm text-blue-500 hover:underline"
                                download
                            >
                                Download template
                            </a>
                        )}
                    </label>
                </div>
                {error && (
                    <p className="text-sm text-red-500 mt-2">{error}</p>
                )}
            </DialogContent>
        </Dialog>
    )
} 