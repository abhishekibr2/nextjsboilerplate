'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import AddProduct from './AddProduct'

export default function Page() {
    const [notes, setNotes] = useState<any[] | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const getData = async () => {
            const { data } = await supabase.from('Products').select()
            setNotes(data)
        }
        getData()
    }, [])

    return (
        <div>
            <h1>Products</h1>
            <AddProduct />
            <pre>{JSON.stringify(notes, null, 2)}</pre>
        </div>
    )
}