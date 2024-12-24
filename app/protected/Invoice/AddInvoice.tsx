import React, { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
// Define the Product type
interface Invoice {
    id: string;
    product: string;
}

interface Product {
    id: string;
    product_name: string;
}

const InvoiceForm: React.FC = () => {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([])
    const [formData, setFormData] = useState<Invoice>({
        id: '',
        product: ''
    });
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
    const [message, setMessage] = useState<string>('');

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    useEffect(() => {
        const getData = async () => {
            try {
                const { data } = await supabase.from('Products').select('id, product_name')
                setProducts(data as Product[])
            } catch (error) {
                console.error('Error fetching products:', error)
                setMessage('Error loading products')
            } finally {
                setIsLoading(false)
            }
        }
        getData()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setIsSubmitting(true)

        try {
            const supabase = await createClient()
            const { error } = await supabase.from('Invoice').insert([formData]);

            if (error) {
                console.error(error);
                setMessage('Error inserting data: ' + error.message);
                return;
            }

            setMessage('Product added successfully!');
            setFormData({
                id: '',
                product: '',
            });
            router.refresh();
        } catch (err) {
            console.error(err);
            setMessage('An unexpected error occurred.');
        } finally {
            setIsSubmitting(false)
            location.reload();
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">
            <Loader2 className="animate-spin h-5 w-5 text-primary" />
        </div>
    }

    return (
        <div className="p-6 bg-background rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Add New Invoice</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="id" className="block text-sm font-medium text-primary">ID:</label>
                    <input
                        type="number"
                        id="id"
                        name="id"
                        value={formData.id}
                        onChange={handleChange}
                        placeholder="Enter invoice ID"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-primary"
                    />
                </div>
                <div>
                    <label htmlFor="product" className="block text-sm font-medium text-primary">Product Name:</label>
                    <select
                        id="product"
                        name="product"
                        value={formData.product}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-primary"
                    >
                        <option value="">Select a product</option>
                        {products.map((product) => (
                            <option key={product.id} value={product.id}>
                                {product.product_name}
                            </option>
                        ))}
                    </select>
                </div>
                <button 
                    type="submit" 
                    className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <div className="flex items-center justify-center">
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            Submitting...
                        </div>
                    ) : (
                        'Add Invoice'
                    )}
                </button>
            </form>
            {message && <p className="mt-4 text-green-600">{message}</p>}
        </div>
    );
};

export default InvoiceForm;
