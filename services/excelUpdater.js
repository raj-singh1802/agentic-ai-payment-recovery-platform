import xlsx from 'xlsx';

export function updateCustomerStatus(invoiceNumber, updates) {

    // Read workbook
    const workbook = xlsx.readFile('./data/customers.xlsx');

    // Get first sheet
    const sheetName = workbook.SheetNames[0];

    const worksheet = workbook.Sheets[sheetName];

    // Convert sheet to JSON
    const customers = xlsx.utils.sheet_to_json(worksheet);

    // Find customer row
    const customerIndex = customers.findIndex(
        customer => customer.Invoice === invoiceNumber
    );

    // If customer not found
    if (customerIndex === -1) {
        console.log('❌ Customer not found');
        return;
    }

    // Update fields dynamically
    customers[customerIndex] = {
        ...customers[customerIndex],
        ...updates
    };

    // Convert updated JSON back to sheet
    const updatedWorksheet = xlsx.utils.json_to_sheet(customers);

    // Replace worksheet
    workbook.Sheets[sheetName] = updatedWorksheet;

    // Save workbook
    xlsx.writeFile(workbook, './data/customers.xlsx');

    console.log(`✅ Updated customer ${invoiceNumber}`);

}

export function getCustomerByInvoice(invoiceNumber) {

    // Read workbook
    const workbook = xlsx.readFile(
        './data/customers.xlsx'
    );

    // Get first sheet
    const sheetName = workbook.SheetNames[0];

    const worksheet =
        workbook.Sheets[sheetName];

    // Convert sheet to JSON
    const customers =
        xlsx.utils.sheet_to_json(worksheet);

    // Find customer
    return customers.find(
        customer =>
            customer.Invoice === invoiceNumber
    );
}