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
import { parse } from 'csv-parse'
import { Parser } from 'json2csv'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

interface TableExportProps {
    config: ExportConfig;
    endpoint: string;
    filters?: string;
    search?: string;
    data: any;
}

declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF
    }
}

const formatObjectForExport = (obj: any, parentKey: string = ''): string => {
    if (!obj || typeof obj !== 'object') return String(obj || '-')

    return Object.entries(obj)
        .map(([key, value]) => {
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1)
            if (value instanceof Date) {
                return `${formattedKey}: ${value.toLocaleString()}`
            }
            if (typeof value === 'object' && value !== null) {
                return `${formattedKey}: ${formatObjectForExport(value, key)}`
            }
            return `${formattedKey}: ${value}`
        })
        .join(' | ')
}

export function TableExport({ config, endpoint, filters, search, data }: TableExportProps) {

    const { toast } = useToast()

    const Export = async (items: any, format: string) => {
        // Format data for export
        const exportFields = config.fields || [];
        const data = items.map((item: { [x: string]: any; }) => {
            const exportData: Record<string, any> = {}
            exportFields.forEach((field: string | number) => {
                exportData[field] = item[field]
            })
            return exportData
        })

        let response: Response
        switch (format) {
            case 'csv':
                try {
                    const parser = new Parser({ fields: exportFields })
                    const csv = parser.parse(data)
                    response = new Response(csv, {
                        headers: {
                            'Content-Type': 'text/csv',
                            'Content-Disposition': `attachment; filename=${endpoint.toLowerCase()}.csv`
                        }
                    })
                } catch (error) {
                    console.log(error)
                    return null;
                }
                break

            case 'excel':
                try {
                    const worksheet = XLSX.utils.json_to_sheet(data)
                    const workbook = XLSX.utils.book_new()
                    XLSX.utils.book_append_sheet(workbook, worksheet, endpoint)
                    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })
                    response = new Response(excelBuffer, {
                        headers: {
                            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                            'Content-Disposition': `attachment; filename=${endpoint.toLowerCase()}.xlsx`
                        }
                    })
                } catch (error) {
                    console.log(error)
                    return null;

                }
                break

            case 'pdf':
                try {
                    const doc = new jsPDF()

                    // Add title
                    doc.setFontSize(16)
                    doc.text(`${endpoint} Report`, doc.internal.pageSize.width / 2, 20, { align: 'center' })

                    // Add timestamp
                    doc.setFontSize(10)
                    doc.text(`Generated on: ${new Date().toLocaleString()}`, doc.internal.pageSize.width - 15, 30, { align: 'right' })

                    // Prepare table data
                    const tableHeaders = exportFields.map((field: any) => ({
                        header: field,
                        dataKey: field
                    }))

                    const tableRows = data.map((item: { [x: string]: any; }) => {
                        const row: Record<string, any> = {}
                        exportFields.forEach((field: string | number) => {
                            const value = item[field]
                            if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
                                row[field] = formatObjectForExport(value)
                            } else if (value instanceof Date) {
                                row[field] = value.toLocaleString()
                            } else {
                                row[field] = value || '-'
                            }
                        })
                        return row
                    })

                    // Generate table
                    doc.autoTable({
                        startY: 40,
                        head: [exportFields],
                        body: tableRows.map((row: { [x: string]: any; }) => exportFields.map((field: string | number) => row[field])),
                        headStyles: {
                            fillColor: [51, 51, 51],
                            textColor: 255,
                            fontSize: 10,
                            halign: 'center'
                        },
                        bodyStyles: {
                            fontSize: 9,
                            halign: 'left'
                        },
                        columnStyles: {
                            // Add specific column styles if needed
                        },
                        margin: { top: 40 },
                        theme: 'grid'
                    })

                    // Convert PDF to buffer
                    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

                    response = new Response(pdfBuffer, {
                        headers: {
                            'Content-Type': 'application/pdf',
                            'Content-Disposition': `attachment; filename=${endpoint.toLowerCase()}.pdf`
                        }
                    })
                } catch (error) {
                    console.error('PDF export error:', error)
                    return null;
                }
                break

            default:
                return null;
        }

        return response;
        // Check if the response is JSON (error) or blob (file)

    }


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

            const response = await Export(data, format)
            if (!response) {
                toast({
                    title: "We cannot process the file right now."
                })
                return null;
            }
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