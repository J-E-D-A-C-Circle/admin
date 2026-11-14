'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '@/lib/api';
import { formatDate, calcDepreciation } from '@/lib/utils';
import {
  ArrowLeft,
  Calendar,
  Shield,
  Tag,
  Cpu,
  Wrench,
  Clock,
  ClipboardCheck,
  Activity,
  Loader2,
  AlertTriangle,
  CheckCircle,
  FileMinus,
  MapPin,
  QrCode,
  Paperclip,
  Upload,
  Trash2,
  FileText,
} from 'lucide-react';
import Link from 'next/link';

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [asset, setAsset] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [docType, setDocType] = useState<'Photo' | 'Invoice' | 'Warranty' | 'Other'>('Photo');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [attachError, setAttachError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'specs' | 'history' | 'attachments' | 'maintenance'>('specs');

  useEffect(() => {
    if (!id) return;

    const loadAssetDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const [assetData, historyData, attachmentData] = await Promise.all([
          api.getAsset(id),
          api.getAssetHistory(id),
          api.getAssetAttachments(id).catch(() => []),
        ]);
        setAsset(assetData);
        setHistory(historyData);
        setAttachments(attachmentData || []);

        if (assetData.categoryName === 'Vehicles') {
          const maintData = await api.getAssetMaintenance(id);
          setMaintenanceLogs(maintData);
        }
      } catch (err: any) {
        console.error('Error loading asset details page:', err);
        setError(err.message || 'Failed to load asset details.');
      } finally {
        setLoading(false);
      }
    };

    loadAssetDetails();
  }, [id]);

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Under_Maintenance':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Damaged':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Auctioned':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
          <p className="text-sm text-slate-400 font-medium">Loading asset lifecycle data...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-950 text-white p-4 space-y-4 text-center">
        <AlertTriangle className="w-12 h-12 text-red-400 animate-pulse" />
        <h2 className="text-xl font-bold">Asset Not Found</h2>
        <p className="text-slate-400 max-w-md text-sm">
          {error || `The asset with ID "${id}" could not be found or you do not have permission to view it.`}
        </p>
        <button
          onClick={() => router.push('/assets')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white rounded-lg transition-colors font-semibold text-sm shadow-md"
        >
          Back to Asset Registry
        </button>
      </div>
    );
  }

  const depreciation = asset.purchaseValue
    ? calcDepreciation(asset.purchaseValue, asset.acquisitionDate, asset.categoryName)
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <button
          onClick={() => router.push('/assets')}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors self-start py-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-semibold">Back to Registry</span>
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {asset.status !== 'Obsolete' && (
            <>
              <Link
                href={`/verifications?assetId=${encodeURIComponent(asset.assetId)}`}
                className="px-3.5 py-2 bg-emerald-600/90 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors text-sm flex items-center space-x-2"
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Verify Asset</span>
              </Link>
              {asset.categoryName === 'Vehicles' && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('maintenance');
                    document.getElementById('asset-detail-tabs')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold rounded-lg transition-colors text-sm flex items-center space-x-2"
                >
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>Log Maintenance</span>
                </button>
              )}
              <Link
                href={`/transfers?assetId=${encodeURIComponent(asset.assetId)}`}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-semibold rounded-lg transition-colors text-sm flex items-center space-x-2"
              >
                <span>Transfer Asset</span>
              </Link>
            </>
          )}
          <Link
            href={`/assets/${asset.assetId}/label`}
            target="_blank"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg transition-colors text-sm shadow-md flex items-center space-x-2"
          >
            <QrCode className="w-4 h-4" />
            <span>View & Print Label</span>
          </Link>
        </div>
      </div>

      {/* Asset Identification Card */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-[0.03] pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <Cpu className="w-96 h-96 text-white" />
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-slate-950 text-slate-400 font-mono text-xs font-bold rounded border border-slate-800 uppercase">
              {asset.categoryName}
            </span>
            <span
              className={`px-2.5 py-0.5 text-xs font-semibold border rounded-full ${getStatusColor(
                asset.status
              )}`}
            >
              {asset.status.replace('_', ' ')}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">{asset.name}</h1>
            <p className="text-lg font-mono text-amber-500 font-bold mt-1 tracking-tight">{asset.assetId}</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-400 pt-1">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span>{asset.stationName} station, {asset.regionName}</span>
            </div>
          </div>
        </div>

        {/* Small QR Code Preview */}
        <div className="flex-shrink-0 bg-white p-2.5 rounded-xl border border-slate-800 flex flex-col items-center justify-center self-start md:self-center shadow-md">
          <Link href={`/assets/${asset.assetId}/label`} target="_blank" className="group flex flex-col items-center">
            <QRCodeSVG
              value={typeof window !== 'undefined' ? `${window.location.origin}/assets/${asset.assetId}` : `/assets/${asset.assetId}`}
              size={84}
              level="M"
              bgColor="#ffffff"
              fgColor="#0f172a"
            />
            <span className="mt-1 text-[9px] font-bold uppercase tracking-wider text-emerald-700 group-hover:underline">
              Print Label
            </span>
          </Link>
        </div>
      </div>

      {/* Scan Summary Highlights: Description/Specifications, Employee/Department, Station */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-amber-500 mb-1">
            Description / Specifications
          </p>
          <p className="text-sm text-slate-200 font-medium leading-relaxed line-clamp-3">
            {asset.description || [asset.brand, asset.model, asset.subcategoryName].filter(Boolean).join(' • ') || 'No description provided'}
          </p>
          <p className="mt-2 text-xs text-slate-400 font-mono">
            S/N: {asset.serialNumber || 'N/A'}
            {(asset.brand || asset.model) ? ` • ${[asset.brand, asset.model].filter(Boolean).join(' ')}` : ''}
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
            Employee / Department
          </p>
          <p className="text-sm text-white font-bold">
            {asset.assignedEmployeeName
              ? `${asset.assignedEmployeeName}${asset.assignedEmployeeIdCode ? ` (${asset.assignedEmployeeIdCode})` : ''}`
              : 'Unassigned'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Department: <span className="text-slate-200 font-medium">{asset.departmentName || 'N/A'}</span>
          </p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-1">
            Station
          </p>
          <p className="text-sm text-white font-bold">
            {asset.stationName || 'N/A'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Region: <span className="text-slate-200 font-medium">{asset.regionName || 'N/A'}</span>
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div id="asset-detail-tabs" className="flex border-b border-slate-800 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setActiveTab('specs')}
          className={`py-3 px-6 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'specs'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Specifications
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-3 px-6 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Timeline History
        </button>
        <button
          onClick={() => setActiveTab('attachments')}
          className={`py-3 px-6 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'attachments'
              ? 'border-amber-500 text-amber-500'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Photos & Docs</span>
          {attachments.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-amber-500/20 text-amber-400">
              {attachments.length}
            </span>
          )}
        </button>
        {asset.categoryName === 'Vehicles' && (
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`py-3 px-6 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'maintenance'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Fleet Maintenance
          </button>
        )}
      </div>

      {/* Tabs Content */}
      <div className="space-y-6">
        {/* Specifications Tab */}
        {activeTab === 'specs' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Specs Panel */}
            <div className="md:col-span-2 space-y-6">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-sm">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Tag className="w-5 h-5 text-amber-500" />
                  <span>Asset Specifications</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/70">
                    <p className="text-xs text-slate-500 font-bold uppercase">Brand</p>
                    <p className="text-sm font-medium text-slate-200 mt-0.5">{asset.brand || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/70">
                    <p className="text-xs text-slate-500 font-bold uppercase">Model</p>
                    <p className="text-sm font-medium text-slate-200 mt-0.5">{asset.model || 'N/A'}</p>
                  </div>
                  <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/70">
                    <p className="text-xs text-slate-500 font-bold uppercase">
                      {asset.categoryName === 'Vehicles' ? 'Chassis Number / VIN' : 'Serial Number'}
                    </p>
                    <p className="text-sm font-mono text-slate-250 mt-0.5 font-bold">{asset.serialNumber}</p>
                  </div>
                  <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/70">
                    <p className="text-xs text-slate-500 font-bold uppercase">Subcategory</p>
                    <p className="text-sm font-medium text-slate-250 mt-0.5">{asset.subcategoryName || 'N/A'}</p>
                  </div>
                  {asset.categoryName === 'Vehicles' && (
                    <>
                      <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/70">
                        <p className="text-xs text-slate-500 font-bold uppercase">License Plate</p>
                        <p className="text-sm font-medium text-slate-200 mt-0.5">{asset.licensePlate || 'N/A'}</p>
                      </div>
                      <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/70">
                        <p className="text-xs text-slate-500 font-bold uppercase">Engine Number</p>
                        <p className="text-sm font-medium text-slate-200 mt-0.5">{asset.engineNumber || 'N/A'}</p>
                      </div>
                    </>
                  )}
                </div>
                {asset.description && (
                  <div className="pt-2">
                    <p className="text-xs text-slate-500 font-bold uppercase">Description / Notes</p>
                    <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap bg-slate-950/20 p-3 rounded-lg border border-slate-800/60">
                      {asset.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Assignment details */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-sm">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-amber-500" />
                  <span>Location & Employee Assignment</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/70">
                    <p className="text-xs text-slate-500 font-bold uppercase">Department</p>
                    <p className="text-sm font-semibold text-slate-250 mt-0.5">{asset.departmentName}</p>
                  </div>
                  <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/70">
                    <p className="text-xs text-slate-500 font-bold uppercase">Sub-Location / Room</p>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">
                      {asset.subLocation || 'Not specified'}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-950/40 rounded-lg border border-slate-800/70">
                    <p className="text-xs text-slate-500 font-bold uppercase">Assigned Employee</p>
                    {asset.assignedEmployeeName ? (
                      <div>
                        <p className="text-sm font-bold text-slate-200 mt-0.5">{asset.assignedEmployeeName}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-0.5">{asset.assignedEmployeeIdCode}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic mt-0.5">Unassigned</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar with Acquisition / Depreciation */}
            <div className="space-y-6">
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-sm">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <span>Acquisition Details</span>
                </h3>
                <div className="space-y-3.5">
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Acquisition Date</p>
                    <p className="text-sm font-medium text-slate-200 mt-0.5">{formatDate(asset.acquisitionDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Last Audit Verification</p>
                    <p className="text-sm font-medium text-slate-200 mt-0.5">{formatDate(asset.lastVerificationDate)}</p>
                  </div>
                </div>
              </div>

              {/* Depreciation Book Value Card */}
              {depreciation && (
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-sm relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 opacity-[0.03] pointer-events-none transform translate-x-1/6 translate-y-1/6">
                    <Activity className="w-32 h-32 text-emerald-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                    <ClipboardCheck className="w-5 h-5 text-emerald-400" />
                    <span>Depreciation Book Value</span>
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Purchase Value</p>
                      <p className="text-lg font-black text-white">GHS {depreciation.purchaseValue.toLocaleString()}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Deprec. Rate</p>
                        <p className="text-xs font-bold text-emerald-400">{depreciation.ratePercent}% / yr</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Age in Service</p>
                        <p className="text-xs font-bold text-slate-300">{depreciation.yearsInService} yrs</p>
                      </div>
                    </div>
                    <div className="border-t border-slate-800 pt-3 mt-1">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Current Net Book Value</p>
                      <p className="text-xl font-black text-amber-500">GHS {depreciation.bookValue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History timeline Tab */}
        {activeTab === 'history' && (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Activity className="w-5 h-5 text-amber-500" />
              <span>Lifecycle History Timeline</span>
            </h3>
            {history.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-12 italic">No timeline history events logged for this asset.</p>
            ) : (
              <div className="relative border-l border-slate-800 pl-6 ml-3 space-y-8 py-2">
                {history.map((h: any) => {
                  const changes = h.description.split('; ');
                  return (
                    <div key={h.id} className="relative">
                      <span className="absolute -left-[31px] top-1.5 flex items-center justify-center w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-slate-900"></span>
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-white px-2 py-0.5 bg-slate-800 rounded border border-slate-700/60 uppercase">
                            {h.actionType.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(h.createdAt).toLocaleString('en-GB')}
                          </span>
                        </div>
                        <ul className="space-y-1 pl-1">
                          {changes.map((change: string, idx: number) => (
                            <li key={idx} className="text-sm text-slate-350 flex items-start gap-1.5">
                              <span className="text-amber-500 font-bold">›</span>
                              <span>{change.trim()}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="text-[10px] text-slate-500 border-t border-slate-800/70 pt-1 mt-1">
                          Performed by: <span className="font-semibold text-slate-400">{h.userName} ({h.userUsername})</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Fleet Maintenance Tab */}
        {activeTab === 'maintenance' && asset.categoryName === 'Vehicles' && (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-sm space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <Wrench className="w-5 h-5 text-blue-400" />
              <span>Fleet Maintenance & Service Logs</span>
            </h3>
            {maintenanceLogs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-12 italic">No maintenance services logged for this vehicle.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 font-semibold uppercase">
                      <th className="py-3 px-4">Service Date</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Odometer Reading</th>
                      <th className="py-3 px-4">Service Notes</th>
                      <th className="py-3 px-4">Next Due Date</th>
                      <th className="py-3 px-4">Recorded By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {maintenanceLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/10">
                        <td className="py-3 px-4 font-mono font-medium">{formatDate(log.serviceDate)}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.serviceType === 'Emergency' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            log.serviceType === 'Major' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                            'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {log.serviceType}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono">
                          {log.odometerReading ? `${log.odometerReading.toLocaleString()} km` : '—'}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate" title={log.serviceNotes || ''}>
                          {log.serviceNotes || '—'}
                        </td>
                        <td className="py-3 px-4 font-mono text-blue-400 font-medium">
                          {log.nextServiceDueDate ? formatDate(log.nextServiceDueDate) : '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {log.recorderName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Photos & Documents Tab */}
        {activeTab === 'attachments' && (
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Paperclip className="w-5 h-5 text-amber-500" />
                  <span>Asset Photos & Supporting Documents</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Upload photos, purchase invoices (PDF), or warranty certificates for this asset.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as 'Photo' | 'Invoice' | 'Warranty' | 'Other')}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Photo">Photo</option>
                  <option value="Invoice">Invoice / Receipt</option>
                  <option value="Warranty">Warranty</option>
                  <option value="Other">Other Document</option>
                </select>
                <label className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center space-x-1.5 cursor-pointer transition-colors">
                  {uploadingDoc ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{uploadingDoc ? 'Uploading...' : 'Upload File'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                    disabled={uploadingDoc}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setAttachError('');
                      setUploadingDoc(true);
                      try {
                        const uploaded = await api.uploadFile(file, 'assets');
                        await api.addAssetAttachment(asset.assetId, {
                          fileName: uploaded.fileName || file.name,
                          docType,
                          fileUrl: uploaded.url,
                          mimeType: uploaded.mimeType || file.type,
                        });
                        const refreshed = await api.getAssetAttachments(asset.assetId);
                        setAttachments(refreshed || []);
                      } catch (err: unknown) {
                        setAttachError(err instanceof Error ? err.message : 'Upload failed');
                      } finally {
                        setUploadingDoc(false);
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {attachError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
                {attachError}
              </div>
            )}

            {attachments.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No photos or documents attached to this asset yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {attachments.map((att) => {
                  const isPdf = att.mimeType === 'application/pdf' || att.fileUrl?.endsWith('.pdf');
                  return (
                    <div
                      key={att.id}
                      className="bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden flex flex-col"
                    >
                      {isPdf ? (
                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="h-40 flex flex-col items-center justify-center bg-slate-950 text-slate-300 hover:text-amber-400 transition-colors p-4"
                        >
                          <FileText className="w-10 h-10 mb-2 text-amber-400" />
                          <span className="text-xs font-semibold">Open PDF Document</span>
                        </a>
                      ) : (
                        <a href={att.fileUrl} target="_blank" rel="noreferrer" className="block h-40 bg-slate-950">
                          <img
                            src={att.fileUrl}
                            alt={att.fileName}
                            className="w-full h-full object-cover"
                          />
                        </a>
                      )}
                      <div className="p-3 flex items-center justify-between gap-2 border-t border-slate-800">
                        <div className="min-w-0">
                          <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-800 text-amber-400 mb-1">
                            {att.docType}
                          </span>
                          <p className="text-xs font-medium text-slate-200 truncate" title={att.fileName}>
                            {att.fileName}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {att.uploadedByName || 'User'} • {formatDate(att.createdAt)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await api.deleteAssetAttachment(asset.assetId, att.id);
                              setAttachments((prev) => prev.filter((item) => item.id !== att.id));
                            } catch (err: unknown) {
                              setAttachError(err instanceof Error ? err.message : 'Failed to delete attachment');
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
                          title="Remove attachment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
