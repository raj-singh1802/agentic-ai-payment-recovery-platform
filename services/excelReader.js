import xlsx from 'xlsx';

function formatExcelDate(value) {

    if (!value) {

        return '';
    }

    // Already a proper date string

    if (
        typeof value === 'string' &&
        value.includes('-')
    ) {

        return value;
    }

    // Excel serial number

    if (
        typeof value === 'number'
    ) {

        const excelEpoch =
            new Date(1899, 11, 30);

        const date =
            new Date(
                excelEpoch.getTime() +
                value * 86400000
            );

        return date
            .toISOString()
            .split('T')[0];
    }

    return value;
}

export function readCustomerData() {

    const workbook =
        xlsx.readFile(
            './data/customers.xlsx'
        );

    const sheetName =
        workbook.SheetNames[0];

    const worksheet =
        workbook.Sheets[sheetName];

    const data =
        xlsx.utils.sheet_to_json(
            worksheet
        );

    return data.map(customer => ({

        ...customer,

        "Last Commitment Date":
            formatExcelDate(
                customer["Last Commitment Date"]
            )
    }));
}