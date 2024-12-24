'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import AddInvoice from './AddInvoice'

export default function Page() {
    const [invoices, setInvoices] = useState<any[] | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const getData = async () => {
            const { data } = await supabase.from('Invoice').select(`
                id,
                product ( product_name ),
                created_at
              `);
            setInvoices(data)
        }
        getData()
    }, [])

    return (
        <div>
            <h1>Invoices</h1>
            <AddInvoice />
            <pre className='mt-10 bg-primary/10 rounded-lg p-5'>{JSON.stringify(invoices, null, 2)}</pre>
        </div>
    )
}