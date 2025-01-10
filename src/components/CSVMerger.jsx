import React, { useState } from 'react';
import { Upload, FileDown } from 'lucide-react';

const CSVMerger = () => {
  const [mergedData, setMergedData] = useState(null);
  const [error, setError] = useState('');

  const extractAccountInfo = (filename) => {
    // Extract everything after the last underscore and before .csv
    const match = filename.match(/\_([^_]+)\.csv$/);
    if (!match) return { name: '', last4: '' };

    const fullAccount = match[1];
    // Extract last 4 digits and name
    const last4Match = fullAccount.match(/\d{4}$/);
    const last4 = last4Match ? last4Match[0] : '';
    const name = fullAccount.replace(last4, '').trim(); // Remove the numbers to get just the name

    return {
      name: name,
      last4: last4
    };
  };

  const processCSV = (content, filename) => {
    try {
      const accountInfo = extractAccountInfo(filename);

      // Split into lines and remove empty ones
      const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line);

      // Process each line
      return lines.map(line => {
        const parts = line.split(',');
        if (parts[0] === 'CHK_SAV_LOC_IRA') {
          // THIS IS WHERE THE NEW CODE GOES
          // Clean the description
          const description = parts[4]
            .replace(/\s+$/, '')  // Remove trailing spaces but preserve internal spacing
            .replace(/\s{2,}/g, ' '); // Normalize multiple spaces to single space

          // Clean the amount
          const amount = (parts[6] || parts[5] || '').trim();

          return {
            name: accountInfo.name,
            last4: accountInfo.last4,
            date: parts[1],
            description: description,
            amount: amount
          };
        }
        return null;
      }).filter(row => row !== null);
    } catch (err) {
      console.error('Parse error:', err);
      throw err;
    }
  };

  const handleFiles = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    try {
      let allData = [];

      for (const file of files) {
        const content = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsText(file);
        });

        const data = processCSV(content, file.name);
        allData = [...allData, ...data];
      }

      // THIS IS WHERE THE NEW SORTING CODE GOES
      // Sort by last4 (ascending) and then by date
      allData.sort((a, b) => {
        // First compare last4
        if (a.last4 !== b.last4) {
          return parseInt(a.last4) - parseInt(b.last4);
        }
        // If same last4, sort by date
        return new Date(a.date) - new Date(b.date);
      });

      setMergedData(allData);
      setError('');
    } catch (err) {
      setError('Error processing files: ' + err.message);
      console.error('Error details:', err);
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return '';
    const numberAmount = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numberAmount);
  };

  const getRowStyle = (amount) => {
    if (!amount) return {};
    return parseFloat(amount) < 0 ? { color: 'red' } : {};
  };

  const handleExport = () => {
    if (!mergedData || mergedData.length === 0) return;

    // Create CSV content
    const headers = ['Name', 'Last 4', 'Date', 'Description', 'Amount'];
    const csvContent = [
      headers.join(','),
      ...mergedData.map(row => [
        row.name,
        row.last4,
        row.date,
        `"${row.description}"`, // Wrap description in quotes to handle commas
        row.amount
      ].join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `combined_statements_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">CSV File Merger</h2>
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg border-gray-300 mb-6">
          <Upload className="w-12 h-12 mb-4 text-gray-400" />
          <label className="flex flex-col items-center cursor-pointer">
            <span className="text-sm text-gray-600">Choose CSV files to merge</span>
            <input
              type="file"
              multiple
              accept=".csv"
              onChange={handleFiles}
              className="hidden"
            />
            <span className="mt-2 text-sm font-semibold text-blue-600">
              Browse Files
            </span>
          </label>
        </div>

        {error && (
          <div className="p-4 text-red-700 bg-red-100 rounded mb-6">
            {error}
          </div>
        )}

        {mergedData && mergedData.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-600">
                Showing {mergedData.length} transactions
              </span>
              <button
                onClick={handleExport}
                className="flex items-center px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export to CSV
              </button>
            </div>

            <div className="overflow-x-auto border rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last 4</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mergedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{row.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.last4}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.date}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{row.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right" style={getRowStyle(row.amount)}>
                        {formatAmount(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CSVMerger;