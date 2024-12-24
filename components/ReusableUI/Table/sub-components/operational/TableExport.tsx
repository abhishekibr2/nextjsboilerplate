import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Download } from "lucide-react"
import { ExportConfig } from "@/types/table.types"
import { useToast } from "@/hooks/use-toast";

interface TableExportProps {
    config: ExportConfig;
    endpoint: string;
    filters?: string;
    search?: string;
}

export function TableExport({ config, endpoint, filters, search }: TableExportProps) {
    const { toast } = useToast()

    const handleExport = async (format: string) => {
        try {
            const params = new URLSearchParams()
            params.append('format', format)
            if (filters) params.append('filters', filters)
            if (search) params.append('search', search)

            toast({
                title: "Exporting data...",
                description: "Please wait while we prepare your file.",
            })

            const response = await fetch(`/api/${endpoint}&${params.toString()}`)
            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Export failed')
            }

            // Check if the response is JSON (error) or blob (file)
            const contentType = response.headers.get('content-type')
            if (contentType && contentType.includes('application/json')) {
                const errorData = await response.json()
                throw new Error(errorData.message || 'Export failed')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${config.filename || 'export'}.${format}`
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
            toast({
                title: "Export successful",
                description: "Your file has been downloaded.",
                variant: "default"
            })
        } catch (error) {
            console.error('Export error:', error)
            toast({
                title: "Export failed",
                description: error instanceof Error ? error.message : "There was an error exporting your data.",
                variant: "destructive"
            })
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                {config.formats.map((format) => (
                    <DropdownMenuItem
                        key={format}
                        onClick={() => handleExport(format)}
                    >
                        Export as {format.toUpperCase()}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
} 