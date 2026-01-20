import * as XLSX from 'xlsx';

export function exportToXLSX(data: any[], filename: string) {
    if (!data || !data.length) {
        return;
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Generate the file and trigger download
    XLSX.writeFile(workbook, filename.replace('.csv', '.xlsx'));
}

// Keep CSV export for backward compatibility but add BOM for Arabic support
export function exportToCSV(data: any[], filename: string) {
    if (!data || !data.length) {
        return;
    }

    const separator = ',';
    const keys = Object.keys(data[0]);
    const csvContent =
        keys.join(separator) +
        '\n' +
        data
            .map((row) => {
                return keys
                    .map((k) => {
                        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
                        cell = cell instanceof Date ? cell.toISOString() : cell.toString();
                        cell = cell.replace(/"/g, '""');
                        if (cell.search(/("|,|\n)/g) >= 0) {
                            cell = `"${cell}"`;
                        }
                        return cell;
                    })
                    .join(separator);
            })
            .join('\n');

    // Add BOM for UTF-8 to support Arabic characters
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

export function printTable(title: string, data: any[], columns: { key: string; label: string }[]) {
    if (!data || !data.length) {
        return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Please allow popups to print');
        return;
    }

    const tableRows = data.map(row => {
        return `<tr>${columns.map(col => `<td style="border: 1px solid #ddd; padding: 8px;">${row[col.key] ?? ''}</td>`).join('')}</tr>`;
    }).join('');

    const html = `
<!DOCTYPE html>
<html dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            direction: rtl;
        }
        h1 {
            text-align: center;
            margin-bottom: 20px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th {
            background-color: #f4f4f4;
            border: 1px solid #ddd;
            padding: 12px 8px;
            text-align: right;
        }
        td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: right;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .print-date {
            text-align: center;
            color: #666;
            margin-bottom: 20px;
        }
        @media print {
            body { -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <p class="print-date">تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}</p>
    <table>
        <thead>
            <tr>${columns.map(col => `<th>${col.label}</th>`).join('')}</tr>
        </thead>
        <tbody>
            ${tableRows}
        </tbody>
    </table>
    <script>
        window.onload = function() {
            window.print();
        }
    </script>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
}

