import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
// Define the Product type
interface Product {
    id: string;
    product_name: string;
    product_price: number;
    product_description: string;
}

const ProductForm: React.FC = () => {
    const router = useRouter();
    const [formData, setFormData] = useState<Product>({
        id: '',
        product_name: '',
        product_price: 0,
        product_description: '',
    });

    const [message, setMessage] = useState<string>('');

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        setFormData((prevData) => ({
            ...prevData,
            [name]: name === 'product_price' ? parseFloat(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(''); // Clear any previous messages

        try {
            const supabase = await createClient()
            const { data, error } = await supabase.from('Products').insert([formData]);

            if (error) {
                console.error(error);
                setMessage('Error inserting data: ' + error.message);
                return;
            }

            setMessage('Product added successfully!');
            setFormData({
                id: '',
                product_name: '',
                product_price: 0,
                product_description: '',
            }); // Reset form
            router.refresh();
        } catch (err) {
            console.error(err);
            setMessage('An unexpected error occurred.');
        }
    };

    return (
        <div className="p-6 bg-background rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Add New Product</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="id" className="block text-sm font-medium text-primary">ID:</label>
                    <input
                        type="text"
                        id="id"
                        name="id"
                        value={formData.id}
                        onChange={handleChange}
                        placeholder="Enter product ID"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-primary"
                    />
                </div>
                <div>
                    <label htmlFor="product_name" className="block text-sm font-medium text-primary">Product Name:</label>
                    <input
                        type="text"
                        id="product_name"
                        name="product_name"
                        value={formData.product_name}
                        onChange={handleChange}
                        placeholder="Enter product name"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-primary"
                    />
                </div>
                <div>
                    <label htmlFor="product_price" className="block text-sm font-medium text-primary">Product Price:</label>
                    <input
                        type="number"
                        id="product_price"
                        name="product_price"
                        value={formData.product_price}
                        onChange={handleChange}
                        placeholder="Enter product price"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-primary"
                    />
                </div>
                <div>
                    <label htmlFor="product_description" className="block text-sm font-medium text-primary">Product Description:</label>
                    <textarea
                        id="product_description"
                        name="product_description"
                        value={formData.product_description}
                        onChange={handleChange}
                        placeholder="Enter product description"
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring focus:ring-primary"
                    ></textarea>
                </div>
                <button type="submit" className="w-full bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700">Add Product</button>
            </form>
            {message && <p className="mt-4 text-green-600">{message}</p>}
        </div>
    );
};

export default ProductForm;
