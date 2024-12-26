import { z } from 'zod';
import { TableConfig } from '@/types/table.types';

interface ReusableTableData {
  id: string;
  name: string;
  email: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  age: number;
  number: string;
  gender: 'Male' | 'FeMale' | 'Other';
  street: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  created_at: Date;
  updated_at: Date;
}

// Define the Zod schema for user data
const userValidationSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters"),
  email: z.string()
    .email("Invalid email address"),
  status: z.enum(['Active', 'Inactive', 'Suspended'], {
    errorMap: () => ({ message: "Invalid status" }),
  }),
  age: z.number()
    .min(0, "Age must be a positive number")
    .optional(),
  number: z.string()
    .regex(/^\+?[1-9][0-9]{7,14}$/, "Invalid phone number")
    .optional(),
  gender: z.enum(['Male', 'FeMale', 'Other'], {
    errorMap: () => ({ message: "Invalid gender" }),
  }),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postal_code: z.string().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export const ReusableTableConfig: TableConfig<ReusableTableData> = {
  id: "user-table",
  title: "Users",
  description: "Manage your users",
  columns: [
    {
      id: "name",
      header: "Name",
      accessorKey: "name",
      className: "w-[150px] text-primary",
      sortable: true,
      filterable: true,
      type: "text",
      editable: true,
      editConfig: {
        type: 'input',
        name: 'name',
        label: 'Name',
        validation: {
          required: true,
          minLength: 2,
          maxLength: 50
        }
      }
    },
    {
      id: "email",
      header: "Email",
      accessorKey: "email",
      className: "w-[150px] text-primary",
      sortable: true,
      filterable: true,
      type: "email",
      editable: true,
      editConfig: {
        type: 'input',
        name: 'email',
        label: 'Email',
        validation: {
          required: true,
          zodSchema: z.string().email("Invalid email address")
        }
      }
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      className: "w-[150px] text-primary",
      sortable: true,
      filterable: true,
      type: "select",
      editable: true,
      editConfig: {
        type: 'select',
        name: 'status',
        label: 'Status',
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' },
          { label: 'Suspended', value: 'Suspended' }
        ]
      },
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
        { label: 'Suspended', value: 'Suspended' }
      ]
    },
    {
      id: "age",
      header: "Age",
      accessorKey: "age",
      className: "w-[50px]",
      sortable: true,
      type: "number",
      editable: true,
      editConfig: {
        type: 'number',
        name: 'age',
        label: 'Age',
        validation: {
          zodSchema: z.number().min(0, "Age must be a positive number")
        }
      }
    },
    {
      id: "number",
      header: "Phone Number",
      accessorKey: "number",
      className: "w-[150px] text-primary",
      type: "phone",
      editable: true,
      editConfig: {
        type: 'input',
        name: 'number',
        label: 'Phone Number',
        validation: {
          zodSchema: z.string().regex(/^\+?[1-9][0-9]{7,14}$/, "Invalid phone number")
        }
      }
    },
    {
      id: "gender",
      header: "Gender",
      accessorKey: "gender",
      className: "w-[120px] text-primary",
      sortable: true,
      filterable: true,
      type: "select",
      editable: true,
      options: [
        { label: 'Male', value: 'Male' },
        { label: 'FeMale', value: 'Female' },
        { label: 'Other', value: 'Other' }
      ],
      editConfig: {
        type: 'select',
        name: 'gender',
        label: 'Gender',
        options: [
          { label: 'Male', value: 'Male' },
          { label: 'FeMale', value: 'Female' },
          { label: 'Other', value: 'Other' }
        ]
      }
    },
    {
      id: "street",
      header: "Street",
      accessorKey: "street",
      className: "w-[150px] text-primary",
      type: "text",
      editable: true,
      editConfig: {
        type: 'input',
        name: 'street',
        label: 'Street'
      }
    },
    {
      id: "city",
      header: "City",
      accessorKey: "city",
      className: "w-[150px] text-primary",
      type: "text",
      editable: true,
      editConfig: {
        type: 'input',
        name: 'city',
        label: 'City'
      }
    },
    {
      id: "state",
      header: "State",
      accessorKey: "state",
      className: "w-[150px] text-primary",
      type: "text",
      editable: true,
      editConfig: {
        type: 'input',
        name: 'state',
        label: 'State'
      }
    },
    {
      id: "country",
      header: "Country",
      accessorKey: "country",
      className: "w-[150px] text-primary",
      type: "text",
      editable: true,
      editConfig: {
        type: 'input',
        name: 'country',
        label: 'Country'
      }
    },
    {
      id: "postal_code",
      header: "Postal Code",
      accessorKey: "postal_code",
      className: "w-[150px] text-primary",
      type: "text",
      editable: true,
      editConfig: {
        type: 'input',
        name: 'postal_code',
        label: 'Postal Code'
      }
    },
    {
      id: "created_at",
      header: "Created At",
      accessorKey: "created_at",
      className: "w-[180px] text-primary",
      sortable: true,
      type: "date",
      editable: false
    },
    {
      id: "updated_at",
      header: "Updated At",
      accessorKey: "updated_at",
      className: "w-[180px] text-primary",
      sortable: true,
      type: "date",
      editable: false
    }
  ],
  styles: {
    wrapper: "mx-auto px-4 sm:px-6 lg:px-8 py-8",
    title: "text-4xl font-semibold text-primary mb-2",
    description: "text-sm text-gray-500 mb-6",
    table: "",
    header: "",
    headerRow: "",
    headerCell: "",
    body: "",
    bodyRow: "",
    bodyCell: "px-6 py-4 text-sm text-gray-600 font-medium whitespace-nowrap",
    noResults: "px-6 py-12 text-center text-gray-500 bg-white/50 backdrop-blur-sm"
  },
  search: {
    enabled: true,
    placeholder: "Search users...",
    searchableColumns: ["name", "email", "status", "gender"]
  },
  kanban: {
    enabled: true,
    identification: "id",
    columnIdName: "name",
    columnContent: "status",
    columnOptions: ["Active", "Inactive", "Suspended"]
  },
  pagination: {
    enabled: true,
    pageSize: 10,
    pageSizeOptions: [5, 10, 20, 50]
  },
  filter: {
    enabled: true,
    operators: []
  },
  columnToggle: {
    enabled: true,
    defaultVisible: true
  },
  export: {
    enabled: true,
    formats: ['csv', 'excel', 'pdf'],
    fields: ["name", "email", "status"],
    filename: 'users-export'
  },
  import: {
    enabled: true,
    formats: ['csv']
  },
  select: {
    enabled: true,
    type: 'multiple'
  },
  edit: {
    enabled: true,
    allowDelete: true,
    allowUpdate: true,
    confirmDelete: true,
    style: {
      column: "w-[50px]",
      editButton: "hover:text-blue-600",
      deleteButton: "hover:text-red-600"
    }
  },
  bulkEdit: {
    enabled: true,
    allowDelete: true,
    fields: [
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' },
          { label: 'Suspended', value: 'Suspended' }
        ]
      },
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        options: [
          { label: 'Male', value: 'Male' },
          { label: 'FeMale', value: 'Female' },
          { label: 'Other', value: 'Other' }
        ]
      }
    ]
  },
  validationSchema: userValidationSchema
}; 