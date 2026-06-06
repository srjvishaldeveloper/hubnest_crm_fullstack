/**
 * Utility to export an array of records to a CSV file in the browser
 */
export function exportToCSV(data: any[], filename: string) {
  if (!data || data.length === 0) {
    alert('No data available to export.');
    return;
  }

  // Find all keys that are primitive values
  const firstRow = data[0];
  const keys = Object.keys(firstRow).filter(k => {
    const val = firstRow[k];
    return typeof val !== 'object' || val === null;
  });

  const csvRows = [];
  
  // Header row
  csvRows.push(keys.map(key => `"${key.toUpperCase().replace(/([A-Z])/g, ' $1').trim()}"`).join(','));

  // Data rows
  for (const row of data) {
    const values = keys.map(key => {
      const val = row[key];
      const valStr = val === null || val === undefined ? '' : String(val);
      // Escape double quotes
      const escaped = valStr.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  // Create a Blob with the CSV content
  const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  // Create download link and trigger click
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
