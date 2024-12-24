"use client"
import { TableComponent } from "@/components/ReusableUI/Table/Table"
import { ReusableTableConfig } from "@/config/Table/User"

export default function Home() {


    return (
        <main>

            <TableComponent config={ReusableTableConfig} endpoint="Users" />

        </main>
    )
}
