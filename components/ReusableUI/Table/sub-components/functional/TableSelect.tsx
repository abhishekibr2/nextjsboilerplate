import { Checkbox } from "@/components/ui/checkbox"

interface TableSelectProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    indeterminate?: boolean;
}

export function TableSelect({ checked, onChange, indeterminate = false }: TableSelectProps) {
    return (
        <Checkbox 
            checked={checked}
            className="translate-y-[2px]"
            onCheckedChange={onChange}
            ref={(el) => {
                if (el) {
                    (el as any).indeterminate = indeterminate
                }
            }}
        />
    )
} 