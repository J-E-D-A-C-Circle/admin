'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { formatDate, calcDepreciation } from '@/lib/utils';
import {
  Search,
  Filter,
  Eye,
  Edit,
  ArrowRightLeft,
  ClipboardCheck,
  User,
  History,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Trash2,
  X,
  QrCode,
  Wrench,
  Package
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AssetsPage() {
  const router = useRouter();
  // Filters & State
  const [assets, setAssets] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [regionId, setRegionId] = useState('');
  const [stationId, setStationId] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkDepartmentId, setBulkDepartmentId] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkError, setBulkError] = useState('');

  // Lookup data
  const [lookups, setLookups] = useState<any>({});
  const [filteredStations, setFilteredStations] = useState<any[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [drawerAssetId, setDrawerAssetId] = useState<string | null>(null);
  const [drawerAsset, setDrawerAsset] = useState<any>(null);
  const [drawerHistory, setDrawerHistory] = useState<any[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  // Row expansion for update logs
  const [expandedAssets, setExpandedAssets] = useState<Record<string, boolean>>({});
  const [expandedAssetLogs, setExpandedAssetLogs] = useState<Record<string, any[]>>({});
  const [logsLoading, setLogsLoading] = useState<Record<string, boolean>>({});

  // Form states in drawer
  const [updateStatus, setUpdateStatus] = useState('');
  const [updateEmployeeId, setUpdateEmployeeId] = useState('');
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editSerialNumber, setEditSerialNumber] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLicensePlate, setEditLicensePlate] = useState('');
  const [editEngineNumber, setEditEngineNumber] = useState('');
  const [updateError, setUpdateError] = useState('');
  const [updateSuccess, setUpdateSuccess] = useState('');

  // Verification form state in drawer
  const [verifyType, setVerifyType] = useState('Quarterly');
  const [verifyStatus, setVerifyStatus] = useState('Verified');
  const [verifyComments, setVerifyComments] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');

  // Feature 1: Disposal states
  const [disposeMethod, setDisposeMethod] = useState<'Auction' | 'Scrapped' | 'Donated' | 'Written_Off'>('Auction');
  const [disposeRealisedValue, setDisposeRealisedValue] = useState('');
  const [disposeNotes, setDisposeNotes] = useState('');
  const [disposeError, setDisposeError] = useState('');
  const [disposeSuccess, setDisposeSuccess] = useState('');
  const [disposeSubmitting, setDisposeSubmitting] = useState(false);

  // Feature 2: Maintenance states
  const [maintenanceLogs, setMaintenanceLogs] = useState<any[]>([]);
  const [maintLoading, setMaintLoading] = useState(false);
  const [maintServiceType, setMaintServiceType] = useState<'Routine' | 'Major' | 'Emergency'>('Routine');
  const [maintServiceDate, setMaintServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [maintNextDueDate, setMaintNextDueDate] = useState('');
  const [maintOdometer, setMaintOdometer] = useState('');
  const [maintNotes, setMaintNotes] = useState('');
  const [maintError, setMaintError] = useState('');
  const [maintSuccess, setMaintSuccess] = useState('');
  const [maintSubmitting, setMaintSubmitting] = useState(false);

  // Feature 3: Depreciation states
  const [editPurchaseValue, setEditPurchaseValue] = useState('');

  // Active Tab in drawer
  const [drawerTab, setDrawerTab] = useState<'info' | 'history' | 'audit' | 'edit' | 'maintenance' | 'dispose'>('info');

  const limit = 10;

  // Load assets and lookups
  const loadAssets = async () => {
    setLoading(true);
    try {
      const res = await api.getAssets({
        search,
        status,
        categoryId,
        regionId,
        stationId,
        page,
        limit,
      });
      setAssets(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Error loading assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedIds([]);
    loadAssets();
  }, [page, status, categoryId, regionId, stationId]);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const data = await api.getLookups();
        setLookups(data);
        setFilteredStations(data.stations);
      } catch (err) {
        console.error('Error loading lookups:', err);
      }
    };
    fetchLookups();

    // Check user role
    const u = localStorage.getItem('dams_user');
    if (u) {
      setUserRole(JSON.parse(u).role);
    }
  }, []);

  // Filter stations based on selected region
  useEffect(() => {
    if (regionId && lookups.stations) {
      const filtered = lookups.stations.filter(
        (s: any) => s.regionId === parseInt(regionId)
      );
      setFilteredStations(filtered);
      setStationId('');
    } else if (lookups.stations) {
      setFilteredStations(lookups.stations);
    }
  }, [regionId, lookups]);

  // Open asset detail drawer
  const openDrawer = async (assetId: string) => {
    setDrawerAssetId(assetId);
    setDrawerLoading(true);
    setDrawerTab('info');
    setUpdateError('');
    setUpdateSuccess('');
    setVerifyError('');
    setVerifySuccess('');
    setVerifyComments('');

    // Reset disposal states
    setDisposeMethod('Auction');
    setDisposeRealisedValue('');
    setDisposeNotes('');
    setDisposeError('');
    setDisposeSuccess('');

    // Reset maintenance states
    setMaintServiceType('Routine');
    setMaintServiceDate(new Date().toISOString().split('T')[0]);
    setMaintNextDueDate('');
    setMaintOdometer('');
    setMaintNotes('');
    setMaintError('');
    setMaintSuccess('');

    try {
      const [asset, history] = await Promise.all([
        api.getAsset(assetId),
        api.getAssetHistory(assetId),
      ]);
      setDrawerAsset(asset);
      setDrawerHistory(history);
      setUpdateStatus(asset.status);
      setUpdateEmployeeId(asset.assignedEmployeeId ? String(asset.assignedEmployeeId) : '');
      setEditName(asset.name || '');
      setEditBrand(asset.brand || '');
      setEditModel(asset.model || '');
      setEditSerialNumber(asset.serialNumber || '');
      setEditLicensePlate(asset.licensePlate || '');
      setEditEngineNumber(asset.engineNumber || '');
      setEditDescription(asset.description || '');
      setEditPurchaseValue(asset.purchaseValue || '');

      // Fetch maintenance logs if vehicle
      if (asset.categoryName === 'Vehicles') {
        loadMaintenanceLogs(assetId);
      }
    } catch (err) {
      console.error('Error loading asset details:', err);
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setDrawerAssetId(null);
    setDrawerAsset(null);
    setDrawerHistory([]);
  };

  const loadMaintenanceLogs = async (assetId: string) => {
    setMaintLoading(true);
    try {
      const logs = await api.getAssetMaintenance(assetId);
      setMaintenanceLogs(logs);
    } catch (err) {
      console.error('Error loading maintenance logs:', err);
    } finally {
      setMaintLoading(false);
    }
  };

  const handleDisposeAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisposeError('');
    setDisposeSuccess('');
    setDisposeSubmitting(true);

    try {
      await api.disposeAsset(drawerAsset.assetId, {
        disposalMethod: disposeMethod,
        disposalDate: new Date().toISOString().split('T')[0],
        realisedValue: disposeRealisedValue || null,
        notes: disposeNotes || null,
      });

      setDisposeSuccess('Asset disposed successfully!');
      
      // Reload drawer details and main asset list
      const [asset, history] = await Promise.all([
        api.getAsset(drawerAsset.assetId),
        api.getAssetHistory(drawerAsset.assetId),
      ]);
      setDrawerAsset(asset);
      setDrawerHistory(history);
      setUpdateStatus(asset.status);
      loadAssets();
    } catch (err: any) {
      setDisposeError(err.message || 'Failed to dispose asset.');
    } finally {
      setDisposeSubmitting(false);
    }
  };

  const handleCreateMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMaintError('');
    setMaintSuccess('');
    setMaintSubmitting(true);

    try {
      await api.createAssetMaintenance(drawerAsset.assetId, {
        serviceType: maintServiceType,
        serviceDate: maintServiceDate,
        nextServiceDueDate: maintNextDueDate || null,
        odometerReading: maintOdometer ? parseInt(maintOdometer) : null,
        serviceNotes: maintNotes || null,
      });

      setMaintSuccess('Maintenance service logged successfully!');
      setMaintOdometer('');
      setMaintNotes('');
      setMaintNextDueDate('');

      // Reload maintenance logs, drawer details, and main asset list
      loadMaintenanceLogs(drawerAsset.assetId);
      const [asset, history] = await Promise.all([
        api.getAsset(drawerAsset.assetId),
        api.getAssetHistory(drawerAsset.assetId),
      ]);
      setDrawerAsset(asset);
      setDrawerHistory(history);
      setUpdateStatus(asset.status);
      loadAssets();
    } catch (err: any) {
      setMaintError(err.message || 'Failed to log maintenance.');
    } finally {
      setMaintSubmitting(false);
    }
  };

  const handleBulkEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBulkError('');
    if (!bulkDepartmentId && !bulkStatus) {
      setBulkError('Please select at least one field to update.');
      return;
    }
    setBulkSubmitting(true);
    try {
      const payload: any = { assetIds: selectedIds, updates: {} };
      if (bulkDepartmentId) payload.updates.departmentId = parseInt(bulkDepartmentId);
      if (bulkStatus) payload.updates.status = bulkStatus;
      await api.batchEditAssets(payload);
      setShowBulkEditModal(false);
      setSelectedIds([]);
      loadAssets();
    } catch (err: any) {
      setBulkError(err.message || 'Bulk edit failed');
    } finally {
      setBulkSubmitting(false);
    }
  };

  const exportCsv = () => {
    const headers = ['Asset ID', 'Name', 'Serial Number', 'Category', 'Station', 'Status'];
    const rows = assets.map(a => [
      a.assetId,
      `"${a.name || ''}"`,
      `"${a.serialNumber || ''}"`,
      `"${a.categoryName || ''}"`,
      `"${a.stationName || ''}"`,
      a.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(',') + '\n' 
      + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `assets_export_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openDrawerToEdit = async (assetId: string) => {
    await openDrawer(assetId);
    setDrawerTab('edit');
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (confirm(`Are you sure you want to permanently delete asset ${assetId}? This action cannot be undone.`)) {
      try {
        await api.deleteAsset(assetId);
        loadAssets();
      } catch (err: any) {
        alert(err.message || 'Failed to delete asset.');
      }
    }
  };

  const toggleRowExpand = async (assetId: string) => {
    const isCurrentlyExpanded = !!expandedAssets[assetId];
    
    setExpandedAssets(prev => ({
      ...prev,
      [assetId]: !isCurrentlyExpanded
    }));

    if (!isCurrentlyExpanded && !expandedAssetLogs[assetId]) {
      setLogsLoading(prev => ({ ...prev, [assetId]: true }));
      try {
        const history = await api.getAssetHistory(assetId);
        setExpandedAssetLogs(prev => ({
          ...prev,
          [assetId]: history
        }));
      } catch (err) {
        console.error('Error fetching expanded asset logs:', err);
      } finally {
        setLogsLoading(prev => ({ ...prev, [assetId]: false }));
      }
    }
  };

  const handleUpdateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError('');
    setUpdateSuccess('');

    try {
      await api.updateAsset(drawerAsset.assetId, {
        name: editName,
        brand: editBrand || null,
        model: editModel || null,
        serialNumber: editSerialNumber,
        licensePlate: drawerAsset.categoryName === 'Vehicles' ? editLicensePlate || null : null,
        engineNumber: drawerAsset.categoryName === 'Vehicles' ? editEngineNumber || null : null,
        purchaseValue: editPurchaseValue || null,
        description: editDescription || null,
        status: updateStatus,
        assignedEmployeeId: updateEmployeeId ? parseInt(updateEmployeeId) : null,
      });
      setUpdateSuccess('Asset updated successfully!');
      // Reload drawer details and main asset list
      const [asset, history] = await Promise.all([
        api.getAsset(drawerAsset.assetId),
        api.getAssetHistory(drawerAsset.assetId),
      ]);
      setDrawerAsset(asset);
      setDrawerHistory(history);
      setUpdateStatus(asset.status);
      setUpdateEmployeeId(asset.assignedEmployeeId ? String(asset.assignedEmployeeId) : '');
      setEditName(asset.name || '');
      setEditBrand(asset.brand || '');
      setEditModel(asset.model || '');
      setEditSerialNumber(asset.serialNumber || '');
      setEditLicensePlate(asset.licensePlate || '');
      setEditEngineNumber(asset.engineNumber || '');
      setEditDescription(asset.description || '');
      loadAssets();
    } catch (err: any) {
      setUpdateError(err.message || 'Update failed.');
    }
  };

  const handleVerifyAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifyError('');
    setVerifySuccess('');

    try {
      await api.createVerification({
        assetId: drawerAsset.assetId,
        verificationType: verifyType,
        status: verifyStatus,
        comments: verifyComments,
      });
      setVerifySuccess('Verification submitted successfully!');
      // Reload drawer details and main asset list
      const [asset, history] = await Promise.all([
        api.getAsset(drawerAsset.assetId),
        api.getAssetHistory(drawerAsset.assetId),
      ]);
      setDrawerAsset(asset);
      setDrawerHistory(history);
      setUpdateStatus(asset.status);
      loadAssets();
    } catch (err: any) {
      setVerifyError(err.message || 'Verification failed.');
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'Active':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Under_Maintenance':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Damaged':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Missing':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Asset Registry</h1>
          <p className="text-sm text-slate-400">Search, filter, and audit all physical and hardware assets</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {(userRole === 'Super Admin' || userRole === 'Asset Officer' || userRole === 'Regional Manager') && selectedIds.length > 0 && (
            <button
              onClick={() => {
                setBulkDepartmentId('');
                setBulkStatus('');
                setBulkError('');
                setShowBulkEditModal(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors text-center text-sm shadow-md flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Bulk Edit ({selectedIds.length})</span>
            </button>
          )}

          <button
            onClick={exportCsv}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors text-center text-sm shadow-md flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              const urlParams = new URLSearchParams();
              if (selectedIds.length > 0) {
                urlParams.set('ids', selectedIds.join(','));
              } else {
                if (search) urlParams.set('search', search);
                if (status) urlParams.set('status', status);
                if (categoryId) urlParams.set('categoryId', categoryId);
                if (regionId) urlParams.set('regionId', regionId);
                if (stationId) urlParams.set('stationId', stationId);
                urlParams.set('limit', '1000');
              }
              window.open(`/assets/print-labels?${urlParams.toString()}`, '_blank');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg transition-colors text-center text-sm shadow-md flex items-center space-x-2"
          >
            <QrCode className="w-4 h-4" />
            <span>
              {selectedIds.length > 0
                ? `Print Labels (${selectedIds.length} Selected)`
                : 'Print Labels (Bulk)'}
            </span>
          </button>

          {(userRole === 'Super Admin' || userRole === 'Asset Officer') && (
            <Link
              href="/assets/register"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold rounded-lg transition-colors text-center text-sm shadow-md"
            >
              Register Asset
            </Link>
          )}
        </div>
      </div>

      {/* Filter panel */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search assets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadAssets()}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg text-slate-200 text-sm placeholder-slate-600 focus:outline-none"
          />
        </div>

        {/* Category */}
        <Select value={categoryId || 'all'} onValueChange={(val) => setCategoryId(val === 'all' ? '' : val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {lookups.categories?.map((c: any) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Region */}
        <Select value={regionId || 'all'} onValueChange={(val) => setRegionId(val === 'all' ? '' : val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Regions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Regions</SelectItem>
            {lookups.regions?.map((r: any) => (
              <SelectItem key={r.id} value={String(r.id)}>
                {r.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Station */}
        <Select value={stationId || 'all'} onValueChange={(val) => setStationId(val === 'all' ? '' : val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Stations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stations</SelectItem>
            {filteredStations.map((s: any) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status */}
        <Select value={status || 'all'} onValueChange={(val) => setStatus(val === 'all' ? '' : val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Under_Maintenance">Under Maintenance</SelectItem>
            <SelectItem value="Damaged">Damaged</SelectItem>
            <SelectItem value="Missing">Missing</SelectItem>
            <SelectItem value="Disposed">Disposed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assets Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No assets found matching filters.</div>
        ) : (
          <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 px-2">
            {assets.map((asset) => (
              <div 
                key={`mobile-${asset.assetId}`}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col"
              >
                <div 
                  className="p-3 cursor-pointer hover:bg-slate-800/30 transition-colors"
                  onClick={() => router.push(`/assets/${asset.assetId}`)}
                >
                  <div className="flex justify-between items-start mb-2.5 gap-2">
                    <div className="flex space-x-3 items-center flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Package className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-200 text-sm leading-tight truncate">{asset.name}</h3>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{asset.assetId}</p>
                      </div>
                    </div>
                    <span className={`inline-block px-2 py-0.5 text-[10px] font-semibold border rounded flex-shrink-0 ${getStatusColor(asset.status)}`}>
                      {asset.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="bg-slate-950/30 rounded-lg p-2.5 grid grid-cols-2 gap-y-2 gap-x-2 text-xs mb-1">
                    <div>
                      <span className="text-slate-500 block mb-0.5">Category</span>
                      <span className="font-medium text-slate-300">{asset.categoryName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">Station</span>
                      <span className="font-medium text-slate-300">{asset.stationName}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block mb-0.5">Serial</span>
                      <span className="font-mono text-slate-300 text-[10px]">{asset.serialNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-800 px-3 py-2.5 flex items-center justify-between bg-slate-900 mt-auto">
                  <label className="flex items-center space-x-2 cursor-pointer" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(asset.assetId)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds((prev) => [...prev, asset.assetId]);
                        } else {
                          setSelectedIds((prev) => prev.filter((id) => id !== asset.assetId));
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                    />
                    <span className="text-xs font-medium text-slate-400">Select</span>
                  </label>
                  
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openDrawer(asset.assetId)} className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => window.open(`/assets/${asset.assetId}/label`, '_blank')} className="p-1.5 text-slate-400 hover:text-amber-500 rounded-md hover:bg-slate-800 transition-colors">
                      <QrCode className="w-4 h-4" />
                    </button>
                    {(userRole === 'Super Admin' || userRole === 'Asset Officer' || userRole === 'Station Manager') && (
                      <button onClick={() => openDrawerToEdit(asset.assetId)} className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                    {userRole === 'Super Admin' && (
                      <button onClick={() => handleDeleteAsset(asset.assetId)} className="p-1.5 text-slate-400 hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4 w-12 text-center"></th>
                  <th className="py-4 px-2 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={assets.length > 0 && selectedIds.length === assets.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIds(assets.map((a) => a.assetId));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                      className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500/50 focus:ring-offset-0 focus:outline-none"
                    />
                  </th>
                  <th className="py-4 px-6">Asset ID</th>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Serial Number</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Station</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-200">
                {assets.map((asset) => (
                  <React.Fragment key={asset.assetId}>
                    <tr 
                      className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                      onClick={() => router.push(`/assets/${asset.assetId}`)}
                    >
                      <td className="py-4 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => toggleRowExpand(asset.assetId)}
                          className="p-1 text-slate-500 hover:text-white rounded hover:bg-slate-800/50 transition-colors focus:outline-none"
                        >
                          {expandedAssets[asset.assetId] ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </button>
                      </td>
                      <td className="py-4 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(asset.assetId)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds((prev) => [...prev, asset.assetId]);
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== asset.assetId));
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-amber-500 focus:ring-amber-500/50 focus:ring-offset-0 focus:outline-none"
                        />
                      </td>
                      <td className="py-4 px-6 font-mono font-medium text-amber-500">{asset.assetId}</td>
                      <td className="py-4 px-6 font-medium">{asset.name}</td>
                      <td className="py-4 px-6 text-slate-400 font-mono">{asset.serialNumber}</td>
                      <td className="py-4 px-6 text-slate-300">{asset.categoryName}</td>
                      <td className="py-4 px-6 text-slate-300">{asset.stationName}</td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 text-xs font-semibold border rounded-full ${getStatusColor(
                            asset.status
                          )}`}
                        >
                          {asset.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => openDrawer(asset.assetId)}
                            title="View Details"
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => window.open(`/assets/${asset.assetId}/label`, '_blank')}
                            title="Print QR Label"
                            className="p-1 text-slate-400 hover:text-amber-500 rounded hover:bg-slate-800 transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                          
                          {(userRole === 'Super Admin' || userRole === 'Asset Officer' || userRole === 'Station Manager') && (
                            <button
                              onClick={() => openDrawerToEdit(asset.assetId)}
                              title="Edit Asset"
                              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          
                          {userRole === 'Super Admin' && (
                            <button
                              onClick={() => handleDeleteAsset(asset.assetId)}
                              title="Delete Asset"
                              className="p-1 text-red-400 hover:text-red-300 rounded hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedAssets[asset.assetId] && (
                      <tr className="bg-slate-950/20">
                        <td colSpan={9} className="p-4 px-8 border-b border-slate-800/50">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Asset Update History</span>
                              {logsLoading[asset.assetId] && <Loader2 className="w-4 h-4 animate-spin text-amber-500" />}
                            </div>
                            
                            {logsLoading[asset.assetId] ? (
                              <div className="py-4 text-center text-xs text-slate-500">Loading update logs...</div>
                            ) : !expandedAssetLogs[asset.assetId] || expandedAssetLogs[asset.assetId].length === 0 ? (
                              <div className="py-2 text-xs text-slate-500 italic">No update logs found for this asset.</div>
                            ) : (
                              <div className="grid grid-cols-2 gap-2">
                                {expandedAssetLogs[asset.assetId].map((h: any) => {
                                  const changes = h.description.split('; ');
                                  return (
                                    <div key={h.id} className="p-2 rounded-lg border border-slate-800/80 bg-slate-950/40 text-xs flex flex-col gap-1.5">
                                      {/* Header: action type badge + timestamp */}
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-bold uppercase tracking-wide">
                                          {h.actionType.replace(/([A-Z])/g, ' $1').trim()}
                                        </span>
                                        <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                                          {new Date(h.createdAt).toLocaleString()}
                                        </span>
                                      </div>
                                      {/* Change lines */}
                                      <ul className="space-y-0.5">
                                        {changes.map((change: string, i: number) => (
                                          <li key={i} className="text-slate-300 leading-snug flex items-start gap-1">
                                            <span className="text-amber-500 flex-shrink-0">›</span>
                                            <span>{change.trim()}</span>
                                          </li>
                                        ))}
                                      </ul>
                                      {/* Footer: actor */}
                                      <div className="text-[10px] text-slate-500 border-t border-slate-800/60 pt-1">
                                        By: <span className="font-semibold text-slate-400">{h.userName} ({h.userUsername})</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/40">
            <span className="text-xs text-slate-400">
              Showing page {page} of {totalPages}
            </span>
            <div className="flex space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slidedown/Drawer Panel */}
      {drawerAssetId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm">
          {/* Drawer backdrop close click */}
          <div className="flex-1" onClick={closeDrawer}></div>

          <div className="w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/20">
              <div>
                <h3 className="text-lg font-bold text-white font-mono">
                  {drawerAsset?.assetId || 'Loading...'}
                </h3>
                <p className="text-xs text-slate-400">Asset Detail & Lifecycle Portal</p>
              </div>
              <div className="flex items-center space-x-2">
                {drawerAsset && (
                  <button
                    onClick={() => window.open(`/assets/${drawerAsset.assetId}/label`, '_blank')}
                    title="Print QR Label"
                    className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/20 hover:border-transparent rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Print Label</span>
                  </button>
                )}
                <button
                  onClick={closeDrawer}
                  className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {drawerLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
              </div>
            ) : (
              <>
                {/* Tabs selection */}
                <div className="flex overflow-x-auto whitespace-nowrap border-b border-slate-800 px-6 bg-slate-950/10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    onClick={() => setDrawerTab('info')}
                    className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex-shrink-0 ${
                      drawerTab === 'info'
                        ? 'border-amber-500 text-amber-500'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Specifications
                  </button>
                  <button
                    onClick={() => setDrawerTab('history')}
                    className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex-shrink-0 ${
                      drawerTab === 'history'
                        ? 'border-amber-500 text-amber-500'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    History Timeline
                  </button>
                  {drawerAsset && drawerAsset.categoryName === 'Vehicles' && (
                    <button
                      onClick={() => setDrawerTab('maintenance')}
                      className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex-shrink-0 ${
                        drawerTab === 'maintenance'
                          ? 'border-blue-500 text-blue-500'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Maintenance
                    </button>
                  )}
                  {(userRole === 'Super Admin' || userRole === 'Asset Officer' || userRole === 'Station Manager') && drawerAsset?.status !== 'Disposed' && (
                    <button
                      onClick={() => setDrawerTab('edit')}
                      className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex-shrink-0 ${
                        drawerTab === 'edit'
                          ? 'border-amber-500 text-amber-500'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                    >
                      Update Asset
                    </button>
                  )}
                  {(userRole === 'Super Admin' || userRole === 'Asset Officer') && drawerAsset?.status !== 'Disposed' && (
                    <button
                      onClick={() => setDrawerTab('audit')}
                      className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex-shrink-0 ${
                        drawerTab === 'audit'
                          ? 'border-amber-500 text-amber-500'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Audit & Verify
                    </button>
                  )}
                  {userRole === 'Super Admin' && drawerAsset?.status !== 'Disposed' && (
                    <button
                      onClick={() => setDrawerTab('dispose')}
                      className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors flex-shrink-0 ${
                        drawerTab === 'dispose'
                          ? 'border-red-500 text-red-500'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Disposal
                    </button>
                  )}
                </div>

                {/* Tab content area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Info Tab */}
                  {drawerTab === 'info' && drawerAsset && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800/80">
                          <p className="text-xs text-slate-500 font-semibold uppercase">Name</p>
                          <p className="text-sm font-medium text-white">{drawerAsset.name}</p>
                        </div>
                        <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800/80">
                          <p className="text-xs text-slate-500 font-semibold uppercase">Category</p>
                          <p className="text-sm font-medium text-white">{drawerAsset.categoryName}</p>
                        </div>
                        <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800/80">
                          <p className="text-xs text-slate-500 font-semibold uppercase">Brand</p>
                          <p className="text-sm font-medium text-white">{drawerAsset.brand || 'N/A'}</p>
                        </div>
                        <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800/80">
                          <p className="text-xs text-slate-500 font-semibold uppercase">Model</p>
                          <p className="text-sm font-medium text-white">{drawerAsset.model || 'N/A'}</p>
                        </div>
                        <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800/80">
                          <p className="text-xs text-slate-500 font-semibold uppercase">
                            {drawerAsset.categoryName === 'Vehicles' ? 'Chassis Number / VIN' : 'Serial Number'}
                          </p>
                          <p className="text-sm font-mono text-white">{drawerAsset.serialNumber}</p>
                        </div>
                        <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800/80">
                          <p className="text-xs text-slate-500 font-semibold uppercase">Current Status</p>
                          <span
                            className={`inline-block mt-1 px-2.5 py-0.5 text-xs font-semibold border rounded-full ${getStatusColor(
                              drawerAsset.status
                            )}`}
                          >
                            {drawerAsset.status.replace('_', ' ')}
                          </span>
                        </div>
                        {drawerAsset.categoryName === 'Vehicles' && (
                          <>
                            <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800/80">
                              <p className="text-xs text-slate-500 font-semibold uppercase">License Plate</p>
                              <p className="text-sm font-medium text-white">{drawerAsset.licensePlate || 'N/A'}</p>
                            </div>
                            <div className="p-4 bg-slate-950/40 rounded-lg border border-slate-800/80">
                              <p className="text-xs text-slate-500 font-semibold uppercase">Engine Number</p>
                              <p className="text-sm font-medium text-white">{drawerAsset.engineNumber || 'N/A'}</p>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="border-t border-slate-800 pt-4 space-y-4">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Location & Assignment</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase">Region & Station</p>
                            <p className="text-sm text-slate-200">{drawerAsset.stationName}, {drawerAsset.regionName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase">Department</p>
                            <p className="text-sm text-slate-200">{drawerAsset.departmentName}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase">Assigned Employee</p>
                            <p className="text-sm text-slate-200">{drawerAsset.assignedEmployeeName || 'Unassigned'}</p>
                            {drawerAsset.assignedEmployeeIdCode && (
                              <span className="text-[10px] text-slate-500 font-mono">{drawerAsset.assignedEmployeeIdCode}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-slate-800 pt-4 space-y-2">
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Acquisition Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase">Acquisition Date</p>
                            <p className="text-sm text-slate-200">{formatDate(drawerAsset.acquisitionDate)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 font-semibold uppercase">Last Verified</p>
                            <p className="text-sm text-slate-200">{formatDate(drawerAsset.lastVerificationDate)}</p>
                          </div>
                        </div>
                      </div>

                      {drawerAsset.description && (
                        <div className="border-t border-slate-800 pt-4">
                          <p className="text-xs text-slate-500 font-semibold uppercase">Description</p>
                          <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{drawerAsset.description}</p>
                        </div>
                      )}

                      {/* Depreciation Calculator Card */}
                      {drawerAsset.purchaseValue && (
                        (() => {
                          const dep = calcDepreciation(
                            drawerAsset.purchaseValue,
                            drawerAsset.acquisitionDate,
                            drawerAsset.categoryName
                          );
                          if (!dep) return null;
                          return (
                            <div className="border-t border-slate-800 pt-4 space-y-3">
                              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Depreciation & Book Value</h4>
                              <div className="p-4 bg-emerald-950/10 border border-emerald-900/30 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Purchase Value</p>
                                  <p className="text-sm font-bold text-white">GHS {dep.purchaseValue.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Depreciation Rate</p>
                                  <p className="text-sm font-bold text-emerald-400">{dep.ratePercent}% / yr</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Age in Service</p>
                                  <p className="text-sm font-bold text-white">{dep.yearsInService} yrs</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-slate-500 font-semibold uppercase">Current Book Value</p>
                                  <p className="text-sm font-bold text-amber-500">GHS {dep.bookValue.toLocaleString()}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}

                  {/* History Timeline Tab */}
                  {drawerTab === 'history' && (
                    <div className="space-y-4">
                      {drawerHistory.length === 0 ? (
                        <p className="text-sm text-slate-500 text-center py-8">No history events logged</p>
                      ) : (
                        <div className="relative border-l border-slate-800 pl-6 space-y-6">
                          {drawerHistory.map((h: any) => (
                            <div key={h.id} className="relative">
                              <span className="absolute -left-[31px] top-1.5 flex items-center justify-center w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-slate-900"></span>
                              <div className="space-y-1">
                                <span className="text-[10px] text-slate-500 block font-mono">
                                  {new Date(h.createdAt).toLocaleString()}
                                </span>
                                <span className="text-xs font-bold text-white px-2 py-0.5 bg-slate-800 rounded border border-slate-700/60 inline-block mb-1">
                                  {h.actionType}
                                </span>
                                <p className="text-sm text-slate-300">{h.description}</p>
                                <span className="text-xs text-slate-500 block">
                                  Action by: <span className="font-semibold text-slate-400">{h.userName} ({h.userUsername})</span>
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Edit/Update Tab */}
                  {drawerTab === 'edit' && drawerAsset && (
                    <form onSubmit={handleUpdateAsset} className="space-y-4">
                      {updateSuccess && (
                        <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 text-emerald-250 rounded-lg text-sm font-medium">
                          {updateSuccess}
                        </div>
                      )}
                      {updateError && (
                        <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-205 rounded-lg text-sm">
                          {updateError}
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Asset Name *</label>
                        <input
                          type="text"
                          required
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-300">Brand</label>
                          <input
                            type="text"
                            value={editBrand}
                            onChange={(e) => setEditBrand(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold text-slate-300">Model</label>
                          <input
                            type="text"
                            value={editModel}
                            onChange={(e) => setEditModel(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Purchase Value (GHS)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editPurchaseValue}
                          onChange={(e) => setEditPurchaseValue(e.target.value)}
                          placeholder="e.g. 25000"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">
                          {drawerAsset.categoryName === 'Vehicles' ? 'Chassis Number / VIN *' : 'Serial Number *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={editSerialNumber}
                          onChange={(e) => setEditSerialNumber(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      {drawerAsset.categoryName === 'Vehicles' && (
                        <>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-300">License Plate *</label>
                            <input
                              type="text"
                              required
                              value={editLicensePlate}
                              onChange={(e) => setEditLicensePlate(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                              placeholder="e.g. GR 1234-26"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-300">Engine Number *</label>
                            <input
                              type="text"
                              required
                              value={editEngineNumber}
                              onChange={(e) => setEditEngineNumber(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                              placeholder="Vehicle engine number"
                            />
                          </div>
                        </>
                      )}

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Description</label>
                        <textarea
                          rows={3}
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Status</label>
                        <Select value={updateStatus} onValueChange={setUpdateStatus}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Under_Maintenance">Under Maintenance</SelectItem>
                            <SelectItem value="Damaged">Damaged</SelectItem>
                            <SelectItem value="Missing">Missing</SelectItem>
                            <SelectItem value="Disposed">Disposed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Assigned Employee</label>
                        <Select value={updateEmployeeId || 'unassigned'} onValueChange={(val) => setUpdateEmployeeId(val === 'unassigned' ? '' : val)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {lookups.employees
                              ?.filter((e: any) => e.stationId === drawerAsset.stationId)
                              .map((e: any) => (
                                <SelectItem key={e.id} value={String(e.id)}>
                                  {e.name} ({e.position})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-sm transition-colors"
                      >
                        Save Asset Changes
                      </button>
                    </form>
                  )}

                  {/* Audit / Verify Tab */}
                  {drawerTab === 'audit' && drawerAsset && (
                    <form onSubmit={handleVerifyAsset} className="space-y-4">
                      {verifySuccess && (
                        <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 text-emerald-200 rounded-lg text-sm">
                          {verifySuccess}
                        </div>
                      )}
                      {verifyError && (
                        <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-200 rounded-lg text-sm">
                          {verifyError}
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Verification Schedule</label>
                        <Select value={verifyType} onValueChange={setVerifyType}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Quarterly">Quarterly Audit</SelectItem>
                            <SelectItem value="Half_Yearly">Half-Yearly Audit</SelectItem>
                            <SelectItem value="Annual">Annual Inventory Audit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Audit Status</label>
                        <Select value={verifyStatus} onValueChange={setVerifyStatus}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Verified">Verified Present (Active)</SelectItem>
                            <SelectItem value="Missing">Report Missing</SelectItem>
                            <SelectItem value="Damaged">Report Damaged</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Verification Comments</label>
                        <textarea
                          rows={3}
                          value={verifyComments}
                          onChange={(e) => setVerifyComments(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder-slate-600"
                          placeholder="e.g. verified at desk location. Keyboard missing, but laptop works perfectly."
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-sm transition-colors"
                      >
                        Submit Verification Audit
                      </button>
                    </form>
                  )}

                  {/* Maintenance Tab */}
                  {drawerTab === 'maintenance' && drawerAsset && (
                    <div className="space-y-6">
                      {/* Log Service Form */}
                      {(userRole === 'Super Admin' || userRole === 'Asset Officer' || userRole === 'Station Manager') && (
                        <form onSubmit={handleCreateMaintenanceSubmit} className="p-4 bg-slate-950/30 border border-slate-800 rounded-xl space-y-4">
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Log New Service Record</h4>
                          {maintSuccess && (
                            <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 text-emerald-250 rounded-lg text-sm font-medium">
                              {maintSuccess}
                            </div>
                          )}
                          {maintError && (
                            <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-200 rounded-lg text-sm">
                              {maintError}
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-slate-400 uppercase">Service Type *</label>
                              <Select value={maintServiceType} onValueChange={(val) => setMaintServiceType(val as 'Routine' | 'Major' | 'Emergency')}>
                                <SelectTrigger className="w-full bg-slate-950 border-slate-800">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Routine">Routine</SelectItem>
                                  <SelectItem value="Major">Major</SelectItem>
                                  <SelectItem value="Emergency">Emergency</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-slate-400 uppercase">Service Date *</label>
                              <input
                                type="date"
                                required
                                value={maintServiceDate}
                                onChange={(e) => setMaintServiceDate(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-slate-400 uppercase">Next Service Due</label>
                              <input
                                type="date"
                                value={maintNextDueDate}
                                onChange={(e) => setMaintNextDueDate(e.target.value)}
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-semibold text-slate-400 uppercase">Odometer (km)</label>
                              <input
                                type="number"
                                value={maintOdometer}
                                onChange={(e) => setMaintOdometer(e.target.value)}
                                placeholder="e.g. 45000"
                                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-semibold text-slate-400 uppercase">Service Notes *</label>
                            <textarea
                              rows={2}
                              required
                              value={maintNotes}
                              onChange={(e) => setMaintNotes(e.target.value)}
                              placeholder="Describe the service details..."
                              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none"
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={maintSubmitting}
                            className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors disabled:opacity-60 flex items-center justify-center space-x-2"
                          >
                            {maintSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-3.5 h-3.5" />}
                            <span>{maintSubmitting ? 'Logging...' : 'Log Service Record'}</span>
                          </button>
                        </form>
                      )}

                      {/* Timeline */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Maintenance Service History</h4>
                        {maintLoading ? (
                          <div className="py-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>
                        ) : maintenanceLogs.length === 0 ? (
                          <p className="text-xs text-slate-500 italic text-center py-4">No maintenance logs recorded for this vehicle.</p>
                        ) : (
                          <div className="relative border-l border-slate-800 pl-6 space-y-6">
                            {maintenanceLogs.map((log: any) => (
                              <div key={log.id} className="relative">
                                <span className="absolute -left-[31px] top-1.5 flex items-center justify-center w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-slate-900"></span>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-slate-500 font-mono">
                                      {formatDate(log.serviceDate)}
                                    </span>
                                    {log.odometerReading && (
                                      <span className="text-[10px] text-blue-400 font-mono font-semibold">
                                        {log.odometerReading.toLocaleString()} km
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] font-bold text-blue-400 px-1.5 py-0.5 bg-blue-950/40 border border-blue-900/30 rounded inline-block">
                                    {log.serviceType} Service
                                  </span>
                                  <p className="text-sm text-slate-350">{log.serviceNotes}</p>
                                  {log.nextServiceDueDate && (
                                    <p className="text-[10px] text-amber-400/80">
                                      Next Service Due: <span className="font-semibold">{formatDate(log.nextServiceDueDate)}</span>
                                    </p>
                                  )}
                                  <span className="text-[10px] text-slate-500 block">
                                    Recorded by: <span className="font-semibold text-slate-400">{log.recorderName}</span>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Disposal Tab */}
                  {drawerTab === 'dispose' && drawerAsset && (
                    <form onSubmit={handleDisposeAssetSubmit} className="space-y-4 p-4 bg-slate-950/30 border border-slate-800 rounded-xl">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Record Asset Disposal</h4>
                      {disposeSuccess && (
                        <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 text-emerald-250 rounded-lg text-sm font-medium">
                          {disposeSuccess}
                        </div>
                      )}
                      {disposeError && (
                        <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-200 rounded-lg text-sm">
                          {disposeError}
                        </div>
                      )}
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Disposal Method *</label>
                        <Select value={disposeMethod} onValueChange={(val) => setDisposeMethod(val as 'Auction' | 'Scrapped' | 'Donated' | 'Written_Off')}>
                          <SelectTrigger className="w-full bg-slate-950 border-slate-800">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Auction">Auction</SelectItem>
                            <SelectItem value="Scrapped">Scrapped</SelectItem>
                            <SelectItem value="Donated">Donated</SelectItem>
                            <SelectItem value="Written_Off">Written Off</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Realised Value (GHS, optional)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={disposeRealisedValue}
                          onChange={(e) => setDisposeRealisedValue(e.target.value)}
                          placeholder="e.g. 5000"
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-300">Disposal Notes / Authorization Details</label>
                        <textarea
                          rows={3}
                          value={disposeNotes}
                          onChange={(e) => setDisposeNotes(e.target.value)}
                          placeholder="Describe authorization references or scrappage certificates..."
                          className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={disposeSubmitting}
                        className="w-full py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-slate-950 font-bold rounded-lg text-xs uppercase tracking-wider transition-colors"
                      >
                        {disposeSubmitting ? 'Recording Disposal...' : 'Confirm Asset Disposal'}
                      </button>
                    </form>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <Edit className="w-5 h-5 text-indigo-400" />
                <span>Bulk Edit {selectedIds.length} Assets</span>
              </h2>
              <button onClick={() => setShowBulkEditModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleBulkEditSubmit} className="p-5 space-y-5">
              {bulkError && (
                <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-200 rounded-lg text-sm">
                  {bulkError}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Change Department</label>
                <Select value={bulkDepartmentId} onValueChange={setBulkDepartmentId}>
                  <SelectTrigger className="w-full bg-slate-950 border-slate-800">
                    <SelectValue placeholder="Select new department (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {lookups.departments?.map((d: any) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Change Status</label>
                <Select value={bulkStatus} onValueChange={setBulkStatus}>
                  <SelectTrigger className="w-full bg-slate-950 border-slate-800">
                    <SelectValue placeholder="Select new status (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Under_Maintenance">In Maintenance</SelectItem>
                    <SelectItem value="Disposed">Disposed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="pt-2 flex justify-end space-x-3">
                <button type="button" onClick={() => setShowBulkEditModal(false)} className="px-4 py-2 text-slate-300 hover:text-white transition-colors text-sm font-semibold">
                  Cancel
                </button>
                <button type="submit" disabled={bulkSubmitting} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-500/50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center">
                  {bulkSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Update {selectedIds.length} Assets
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
