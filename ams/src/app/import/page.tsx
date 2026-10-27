'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import {
  Upload,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Download,
  Loader2,
  Play,
  X,
  FileWarning,
} from 'lucide-react';

export default function ImportPage() {
  const [fileContent, setFileContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // CSV Template downloader
  const downloadTemplate = () => {
    const csvContent =
      'assetId,name,category,subcategory,brand,model,serialNumber,description,region,station,department,assignedEmployeeId,status,acquisitionDate\n' +
      'DVLA-LAP-9092,HP ProBook 450 G8,Computers,Laptops,HP,ProBook,SER998811,,Greater Accra,Accra Main,ICT,,Active,2026-01-15\n' +
      'DVLA-PRN-1011,HP LaserJet Pro,Printers,Laser Printers,HP,LaserJet,SER443322,,Greater Accra,Accra Main,Human Resource,,Active,2026-02-10\n';

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dams_import_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Parsing CSV manually or utilizing a clean parser helper
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorMsg('');
    setSuccessMsg('');
    setValidationErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
    if (lines.length < 2) {
      setErrorMsg('The uploaded file is empty or does not contain data.');
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const rows = [];
    const localErrors: string[] = [];

    // Check headers compatibility
    const requiredHeaders = ['name', 'category', 'subcategory', 'serialNumber', 'region', 'station', 'department'];
    const missingHeaders = requiredHeaders.filter((req) => !headers.includes(req));

    if (missingHeaders.length > 0) {
      setErrorMsg(`Missing required headers: ${missingHeaders.join(', ')}`);
      return;
    }

    const seenSerials = new Set<string>();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Simple parse accounting for commas inside quotes can be done, but a simple split works for standard cases
      // If we need a slightly more robust splitter:
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((v) => v.trim().replace(/^["']|["']$/g, ''));

      if (values.length < headers.length) {
        localErrors.push(`Row ${i}: Column count mismatch (expected ${headers.length}, got ${values.length})`);
        continue;
      }

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Quick validate
      const rowNum = i;
      requiredHeaders.forEach((req) => {
        if (!row[req]) {
          localErrors.push(`Row ${rowNum}: Required field "${req}" is empty`);
        }
      });

      if (row.serialNumber) {
        if (seenSerials.has(row.serialNumber.toLowerCase())) {
          localErrors.push(`Row ${rowNum}: Duplicate serial number "${row.serialNumber}" within file`);
        } else {
          seenSerials.add(row.serialNumber.toLowerCase());
        }
      }

      rows.push(row);
    }

    setParsedRows(rows);
    setValidationErrors(localErrors);
  };

  const handleImport = async () => {
    if (parsedRows.length === 0 || validationErrors.length > 0) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await api.importAssets({ items: parsedRows });
      setSuccessMsg(res.message || 'Assets imported successfully.');
      setParsedRows([]);
      setFileName('');
      setFileContent('');
    } catch (err: any) {
      if (err.errors && Array.isArray(err.errors)) {
        setValidationErrors(err.errors);
        setErrorMsg('Import failed due to database or validation errors below.');
      } else {
        setErrorMsg(err.message || 'Import failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const clearFile = () => {
    setFileName('');
    setFileContent('');
    setParsedRows([]);
    setValidationErrors([]);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const labelClass = 'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Bulk Import Assets</h1>
          <p className="text-sm text-slate-400">Import assets from a CSV file into the database in bulk</p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center space-x-2 px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 font-medium rounded-lg text-sm transition-colors"
        >
          <Download className="w-4.5 h-4.5" />
          <span>Download CSV Template</span>
        </button>
      </div>

      {successMsg && (
        <div className="flex items-center space-x-3 p-4 bg-emerald-950/40 border border-emerald-900/50 text-emerald-200 rounded-xl text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-start space-x-3 p-4 bg-red-950/40 border border-red-900/50 text-red-200 rounded-xl text-sm">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* File Upload Zone */}
      {!fileName ? (
        <div className="border-2 border-dashed border-slate-800 hover:border-amber-500/50 bg-slate-900/30 hover:bg-slate-900/50 rounded-2xl p-10 text-center transition-all">
          <Upload className="w-12 h-12 text-slate-500 mx-auto mb-4" />
          <p className="text-sm font-semibold text-white mb-1">Upload CSV File</p>
          <p className="text-xs text-slate-500 mb-6">Drag and drop your CSV file here, or click to browse</p>
          <label className="px-5 py-2.5 bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg text-sm font-bold cursor-pointer transition-colors">
            Browse Files
            <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="w-8 h-8 text-emerald-500" />
            <div>
              <p className="text-sm font-medium text-white">{fileName}</p>
              <p className="text-xs text-slate-500">
                {parsedRows.length} {parsedRows.length === 1 ? 'row' : 'rows'} detected
              </p>
            </div>
          </div>
          <button onClick={clearFile} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="p-5 bg-red-950/20 border border-red-900/30 rounded-xl space-y-3">
          <div className="flex items-center space-x-2 text-sm font-bold text-red-400">
            <FileWarning className="w-5 h-5" />
            <span>Validation Issues Found ({validationErrors.length})</span>
          </div>
          <p className="text-xs text-slate-400">
            Please resolve the issues in your file and try uploading again. Duplicate serial numbers or missing lookup associations will block the import process.
          </p>
          <div className="max-h-48 overflow-y-auto border border-red-950 bg-red-950/10 rounded-lg p-3 space-y-1.5 scrollbar">
            {validationErrors.map((err, i) => (
              <div key={i} className="text-xs text-red-300/90 font-mono">
                • {err}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Table */}
      {parsedRows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">File Preview</h2>
            <button
              onClick={handleImport}
              disabled={loading || validationErrors.length > 0}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-sm flex items-center space-x-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-slate-950" />
                  <span>Start Bulk Import</span>
                </>
              )}
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-96 scrollbar">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 sticky top-0">
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider">Asset ID</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider">Subcategory</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider">Serial Number</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider">Region</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider">Station</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-slate-400 uppercase tracking-wider">Department</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 100).map((row, i) => (
                    <tr key={i} className="border-t border-slate-800/60">
                      <td className="px-3 py-2.5 text-slate-400 font-mono">{row.assetId || 'Auto-generated'}</td>
                      <td className="px-3 py-2.5 text-slate-200 font-medium">{row.name}</td>
                      <td className="px-3 py-2.5 text-slate-300">{row.category}</td>
                      <td className="px-3 py-2.5 text-slate-300">{row.subcategory}</td>
                      <td className="px-3 py-2.5 text-slate-300 font-mono">{row.serialNumber}</td>
                      <td className="px-3 py-2.5 text-slate-300">{row.region}</td>
                      <td className="px-3 py-2.5 text-slate-300">{row.station}</td>
                      <td className="px-3 py-2.5 text-slate-300">{row.department}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedRows.length > 100 && (
              <div className="p-3 bg-slate-900/40 border-t border-slate-800 text-center text-xs text-slate-500">
                Showing first 100 rows. {parsedRows.length - 100} more rows are loaded.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
