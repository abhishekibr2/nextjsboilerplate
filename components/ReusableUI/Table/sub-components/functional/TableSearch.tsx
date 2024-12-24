import { SearchConfig } from "@/types/table.types";


interface TableSearchProps {
    config: SearchConfig;
    value: string;
    onChange: (value: string) => void;
}

export function TableSearch({ config, value, onChange }: TableSearchProps) {
    return (
        <div>
            <input
                type="text"
                placeholder={config.placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>
    )
} 