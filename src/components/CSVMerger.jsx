import React, { useState } from 'react';
import { Upload } from 'lucide-react';

const CSVMerger = () => {
  const [mergedData, setMergedData] = useState(null);
  const [error, setError] = useState('');

  const processCSV = (content) => {
    try {
      // Split into lines and remove empty ones
      const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line);

      // Process each line
      return lines.map(line => {
        const parts = line.split(',');
        if (parts[0] === 'CHK_SAV_LOC_IRA') {
          return {
            account: parts[0],
            date: parts[1],
            description: parts[4].trim(),
            amount: parts[6] || parts[5] || '' // Check both possible amount positions
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

        const data = processCSV(content);
        allData = [...allData, ...data];
      }

      // Sort by date
      allData.sort((a, b) => new Date(a.date) - new Date(b.date));

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
            <div className="text-sm text-gray-600 mb-4">
              Showing {mergedData.length} transactions
            </div>

            <div className="overflow-x-auto border rounded">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {mergedData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.account}</td>
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