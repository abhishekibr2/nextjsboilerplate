export const filterOptions: Record<string, Array<{ label: string; value: string }>> = {
    status: [
        { label: 'Available', value: 'available' },
        { label: 'Occupied', value: 'occupied' },
        { label: 'Under Maintenance', value: 'under maintenance' }
    ],
    invoiceStatus: [
        { label: 'Paid', value: 'paid' },
        { label: 'Unpaid', value: 'unpaid' },
        { label: 'Overdue', value: 'overdue' }
    ],
    type: [
        { label: 'Residential', value: 'residential' },
        { label: 'Commercial', value: 'commercial' },
        { label: 'Industrial', value: 'industrial' }
    ],
    gender: [
        { label: 'Male', value: 'male' },
        { label: 'Female', value: 'female' },
        { label: 'Other', value: 'other' }
    ]
}; 