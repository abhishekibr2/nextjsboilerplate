'use client'

import { createClient } from '@/utils/supabase/client'
import { useEffect, useState } from 'react'
import AddProduct from './AddProduct'
import { Loader2 } from 'lucide-react'

export default function Page() {
    const [products, setProducts] = useState<any[] | null>(null)
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState<boolean>(true)

    useEffect(() => {
        const getData = async () => {
            const { data } = await supabase.from('Products').select()
            setProducts(data)
            setIsLoading(false)
        }
        getData()
    }, [])

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">
            <Loader2 className="animate-spin h-5 w-5 text-primary" />
        </div>
    }

    return (
        <div>
            <h1>Products</h1>
            <AddProduct />
            <pre className='mt-10 bg-primary/10 rounded-lg p-5'>{JSON.stringify(products, null, 2)}</pre>
        </div>
    )
}