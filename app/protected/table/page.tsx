"use client"
import { TableComponent } from "@/components/ReusableUI/Table/Table"
import { ReusableTableConfig } from "@/components/ReusableUI/Table/configs/User"

export default function Home() {


    return (
        <main>
            <TableComponent config={ReusableTableConfig} endpoint="Users" />
        </main>
    )
}
