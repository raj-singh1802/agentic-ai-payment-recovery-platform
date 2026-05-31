import xlsx from 'xlsx';
import { faker } from '@faker-js/faker';

// Number of fake customers
const NUMBER_OF_CUSTOMERS = 500;

// Array to store records
const customers = [];

// Generate fake customer data
for (let i = 1; i <= NUMBER_OF_CUSTOMERS; i++) {

    const customer = {
        Invoice: `INV${String(i).padStart(3, '0')}`,

        Name: faker.person.fullName(),

        Email: faker.internet.email(),

        "Contact Number": "+91YOUR_VERIFIED_NUMBER",

        "Due Amount": faker.number.int({
            min: 1000,
            max: 50000
        }),

        "Due Date": faker.date.soon().toISOString().split('T')[0],

        "Payment Status": "Pending",

        "Delayed Days": 0,

        "Escalation Status": "No",

        "Supervisor Contact": "+91SUPERVISOR_NUMBER",

        "Admin Email": "company_admin@gmail.com",

        "Last Commitment Date": "",

        "No Response Count": 0
        };

    customers.push(customer);
}

// Convert JSON to worksheet
const worksheet = xlsx.utils.json_to_sheet(customers);

// Create workbook
const workbook = xlsx.utils.book_new();

// Append worksheet
xlsx.utils.book_append_sheet(workbook, worksheet, 'Customers');

// Save Excel file
xlsx.writeFile(workbook, './data/customers.xlsx');

console.log('✅ customers.xlsx generated successfully!');