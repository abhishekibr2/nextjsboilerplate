import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import { PaginationConfig, PaginationState } from "@/types/table.types";
import { useEffect } from "react";

interface TablePaginationProps {
    config: PaginationConfig;
    state: PaginationState;
    onChange: (state: Partial<PaginationState>) => void;
}

export function TablePagination({ config, state, onChange }: TablePaginationProps) {

    return (
        <div className="mt-4 flex items-center justify-between mb-4">
            <div className="flex items-center">
                <p className="text-sm text-gray-500 w-[100px] mr-2">Rows per page</p>
                <Select
                    value={state.pageSize.toString()}
                    onValueChange={(value) => {
                        onChange({
                            pageSize: parseInt(value),
                            pageIndex: 0
                        })
                    }}
                >
                    <SelectTrigger className="w-[70px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {config.pageSizeOptions.map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                                {size}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Pagination className="ml-[-160px]">
                <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                            onClick={() => onChange({
                                pageIndex: Math.max(0, state.pageIndex - 1)
                            })}
                            className={cn(
                                "cursor-pointer",
                                state.pageIndex === 0 && "pointer-events-none opacity-50"
                            )}
                        />
                    </PaginationItem>

                    <PaginationItem>
                        <span className="text-sm text-gray-500">
                            Page {state.pageIndex + 1} of {state.totalPages}
                        </span>
                    </PaginationItem>

                    <PaginationItem>
                        <PaginationNext
                            onClick={() => onChange({
                                pageIndex: Math.min(state.totalPages - 1, state.pageIndex + 1)
                            })}
                            className={cn(
                                "cursor-pointer",
                                state.pageIndex === state.totalPages - 1 && "pointer-events-none opacity-50"
                            )}
                        />
                    </PaginationItem>
                </PaginationContent>
            </Pagination>
        </div>
    )
} 