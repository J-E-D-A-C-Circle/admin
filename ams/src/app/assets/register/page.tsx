'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Loader2, AlertCircle, Plus, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function AssetRegisterPage() {
  const router = useRouter();
  const [lookups, setLookups] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [form, setForm] = useState({
    name: '',
    categoryId: '',
    subcategoryId: '',
    brand: '',
    model: '',
    serialNumber: '',
    description: '',
    regionId: '',
    stationId: '',
    departmentId: '',
    subLocation: '',
    assignedEmployeeId: '',
    acquisitionDate: new Date().toISOString().split('T')[0],
    licensePlate: '',
    engineNumber: '',
    purchaseValue: '',
  });

  const [filteredSubcategories, setFilteredSubcategories] = useState<any[]>([]);
  const [filteredStations, setFilteredStations] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);

  const isVehicle = lookups.categories?.find((c: any) => c.id === parseInt(form.categoryId))?.name === 'Vehicles';

  // Employee creation states
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [empForm, setEmpForm] = useState({
    employeeId: '',
    name: '',
    position: '',
    departmentId: '',
    regionId: '',
    stationId: '',
  });
  const [empError, setEmpError] = useState('');
  const [empSubmitting, setEmpSubmitting] = useState(false);
  const [empFilteredStations, setEmpFilteredStations] = useState<any[]>([]);

  const fetchLookups = async () => {
    try {
      const data = await api.getLookups();
      setLookups(data);
      return data;
    } catch (err) {
      console.error('Error loading lookups:', err);
    }
  };

  useEffect(() => {
    fetchLookups().finally(() => setPageLoading(false));
  }, []);

  // Sync employee modal dropdowns when it opens or parent region/station/dept changes
  useEffect(() => {
    if (showEmployeeModal) {
      setEmpForm({
        employeeId: '',
        name: '',
        position: '',
        departmentId: form.departmentId || '',
        regionId: form.regionId || '',
        stationId: form.stationId || '',
      });
      setEmpError('');
    }
  }, [showEmployeeModal, form.regionId, form.stationId, form.departmentId]);

  // Sync stations in employee modal when its region changes
  useEffect(() => {
    if (empForm.regionId && lookups.stations) {
      setEmpFilteredStations(
        lookups.stations.filter((s: any) => s.regionId === parseInt(empForm.regionId))
      );
    } else {
      setEmpFilteredStations([]);
    }
  }, [empForm.regionId, lookups.stations]);

  const updateForm = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // Filter subcategories when category changes
  useEffect(() => {
    if (form.categoryId && lookups.subcategories) {
      setFilteredSubcategories(
        lookups.subcategories.filter((s: any) => s.categoryId === parseInt(form.categoryId))
      );
      updateForm('subcategoryId', '');
    }
  }, [form.categoryId, lookups.subcategories]);

  // Filter stations when region changes
  useEffect(() => {
    if (form.regionId && lookups.stations) {
      setFilteredStations(
        lookups.stations.filter((s: any) => s.regionId === parseInt(form.regionId))
      );
      updateForm('stationId', '');
      updateForm('assignedEmployeeId', '');
    }
  }, [form.regionId, lookups.stations]);

  // Filter employees when station changes
  useEffect(() => {
    if (form.stationId && lookups.employees) {
      const filtered = lookups.employees.filter((e: any) => e.stationId === parseInt(form.stationId));
      setFilteredEmployees(filtered);
      
      // Only reset assignedEmployeeId if it is not in the filtered list
      if (form.assignedEmployeeId && !filtered.some((e: any) => String(e.id) === form.assignedEmployeeId)) {
        updateForm('assignedEmployeeId', '');
      }
    } else {
      setFilteredEmployees([]);
      if (form.assignedEmployeeId) {
        updateForm('assignedEmployeeId', '');
      }
    }
  }, [form.stationId, lookups.employees, form.assignedEmployeeId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        name: form.name,
        categoryId: parseInt(form.categoryId),
        subcategoryId: parseInt(form.subcategoryId),
        brand: form.brand || null,
        model: form.model || null,
        serialNumber: form.serialNumber,
        licensePlate: isVehicle ? form.licensePlate : null,
        engineNumber: isVehicle ? form.engineNumber : null,
        purchaseValue: form.purchaseValue || null,
        description: form.description || null,
        regionId: parseInt(form.regionId),
        stationId: parseInt(form.stationId),
        departmentId: parseInt(form.departmentId),
        subLocation: form.subLocation.trim() || null,
        assignedEmployeeId: form.assignedEmployeeId ? parseInt(form.assignedEmployeeId) : null,
        acquisitionDate: form.acquisitionDate,
      };

      const res = await api.createAsset(payload);
      setSuccess(`Asset registered successfully with ID: ${res.assetId}`);
      setTimeout(() => router.push('/assets'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to register asset.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmpError('');
    setEmpSubmitting(true);

    try {
      const payload = {
        employeeId: empForm.employeeId,
        name: empForm.name,
        position: empForm.position,
        departmentId: parseInt(empForm.departmentId),
        stationId: parseInt(empForm.stationId),
      };

      await api.createEmployee(payload);
      
      const updatedLookups = await fetchLookups();
      
      const newEmp = updatedLookups?.employees?.find(
        (emp: any) => emp.employeeId === empForm.employeeId
      );

      if (newEmp) {
        if (newEmp.stationId !== parseInt(form.stationId)) {
          updateForm('regionId', String(empForm.regionId));
          updateForm('stationId', String(newEmp.stationId));
        }
        updateForm('assignedEmployeeId', String(newEmp.id));
      }

      setShowEmployeeModal(false);
    } catch (err: any) {
      setEmpError(err.message || 'Failed to create employee.');
    } finally {
      setEmpSubmitting(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const inputClass =
    'w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg text-slate-200 text-sm placeholder-slate-600 focus:outline-none';
  const selectClass =
    'w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg text-slate-300 text-sm focus:outline-none';
  const labelClass = 'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Register Asset</h1>
        <p className="text-sm text-slate-400">
          Add a new asset to the DVLA inventory. An Asset ID will be auto-generated.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-900/50 text-emerald-200 rounded-lg text-sm">
          ✅ {success}
        </div>
      )}
      {error && (
        <div className="flex items-start space-x-2 p-4 bg-red-950/40 border border-red-900/50 text-red-200 rounded-lg text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Asset Identity */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
            Asset Identity
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Asset Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                className={inputClass}
                placeholder="e.g. HP ProBook 450 G8"
              />
            </div>
            <div>
              <label className={labelClass}>Category *</label>
              <Select
                value={form.categoryId}
                onValueChange={(val) => updateForm('categoryId', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {lookups.categories?.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={labelClass}>Subcategory *</label>
              <Select
                value={form.subcategoryId}
                onValueChange={(val) => updateForm('subcategoryId', val)}
                disabled={!form.categoryId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubcategories.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={labelClass}>Serial Number *</label>
              <input
                type="text"
                required={!isVehicle}
                disabled={isVehicle}
                value={isVehicle ? '' : form.serialNumber}
                onChange={(e) => updateForm('serialNumber', e.target.value)}
                className={`${inputClass} ${isVehicle ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''}`}
                placeholder={isVehicle ? "Not applicable for vehicles" : "Manufacturer serial number"}
              />
            </div>
            <div>
              <label className={labelClass}>Chassis Number / VIN *</label>
              <input
                type="text"
                required={isVehicle}
                disabled={!isVehicle}
                value={isVehicle ? form.serialNumber : ''}
                onChange={(e) => updateForm('serialNumber', e.target.value)}
                className={`${inputClass} ${!isVehicle ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''}`}
                placeholder={!isVehicle ? "Active for vehicles only" : "Vehicle Chassis Number / VIN"}
              />
            </div>
            <div>
              <label className={labelClass}>License Plate *</label>
              <input
                type="text"
                required={isVehicle}
                disabled={!isVehicle}
                value={isVehicle ? form.licensePlate : ''}
                onChange={(e) => updateForm('licensePlate', e.target.value)}
                className={`${inputClass} ${!isVehicle ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''}`}
                placeholder={!isVehicle ? "Active for vehicles only" : "e.g. GR 1234-26"}
              />
            </div>
            <div>
              <label className={labelClass}>Engine Number *</label>
              <input
                type="text"
                required={isVehicle}
                disabled={!isVehicle}
                value={isVehicle ? form.engineNumber : ''}
                onChange={(e) => updateForm('engineNumber', e.target.value)}
                className={`${inputClass} ${!isVehicle ? 'opacity-50 cursor-not-allowed bg-slate-900' : ''}`}
                placeholder={!isVehicle ? "Active for vehicles only" : "Vehicle engine number"}
              />
            </div>
            <div>
              <label className={labelClass}>Brand</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => updateForm('brand', e.target.value)}
                className={inputClass}
                placeholder="e.g. HP, Dell, Cisco"
              />
            </div>
            <div>
              <label className={labelClass}>Model</label>
              <input
                type="text"
                value={form.model}
                onChange={(e) => updateForm('model', e.target.value)}
                className={inputClass}
                placeholder="e.g. ProBook 450 G8"
              />
            </div>
            <div>
              <label className={labelClass}>Acquisition Date *</label>
              <input
                type="date"
                required
                value={form.acquisitionDate}
                onChange={(e) => updateForm('acquisitionDate', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Purchase Value (GHS)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.purchaseValue}
                onChange={(e) => updateForm('purchaseValue', e.target.value)}
                className={inputClass}
                placeholder="e.g. 25000"
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Description</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                className={inputClass}
                placeholder="Additional details about this asset..."
              />
            </div>
          </div>
        </div>

        {/* Location & Assignment */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-5">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-3">
            Location & Assignment
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelClass}>Region *</label>
              <Select
                value={form.regionId}
                onValueChange={(val) => updateForm('regionId', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {lookups.regions?.map((r: any) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={labelClass}>Station *</label>
              <Select
                value={form.stationId}
                onValueChange={(val) => updateForm('stationId', val)}
                disabled={!form.regionId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select station" />
                </SelectTrigger>
                <SelectContent>
                  {filteredStations.map((s: any) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className={labelClass}>
                Sub-Location / Room <span className="text-slate-500 font-normal normal-case">(Optional)</span>
              </label>
              <input
                type="text"
                value={form.subLocation}
                onChange={(e) => updateForm('subLocation', e.target.value)}
                placeholder="e.g. Block B, 2nd Floor - Room 204"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Department *</label>
              <Select
                value={form.departmentId}
                onValueChange={(val) => updateForm('departmentId', val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
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
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Assigned Employee <span className="text-slate-500 font-normal normal-case">(Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(true)}
                  className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 hover:border-transparent rounded-lg text-xs font-semibold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Employee</span>
                </button>
              </div>
              <Select
                value={form.assignedEmployeeId || 'unassigned'}
                onValueChange={(val) => updateForm('assignedEmployeeId', val === 'unassigned' ? '' : val)}
                disabled={!form.stationId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {filteredEmployees.map((e: any) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.name} — {e.position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.push('/assets')}
            className="px-5 py-2.5 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-500/50 text-slate-950 font-bold rounded-lg text-sm transition-colors flex items-center space-x-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering...</span>
              </>
            ) : (
              <span>Register Asset</span>
            )}
          </button>
        </div>
      </form>

      {showEmployeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg mx-4 shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-lg font-bold text-white">Add New Employee</h2>
              <button
                type="button"
                onClick={() => setShowEmployeeModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateEmployeeSubmit} className="p-5 space-y-4">
              {empError && (
                <div className="flex items-start space-x-2 p-3 bg-red-950/40 border border-red-900/50 text-red-200 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                  <span>{empError}</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={empForm.employeeId}
                    onChange={(e) => setEmpForm((p) => ({ ...p, employeeId: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g. EMP-GAR-010"
                  />
                </div>
                <div>
                  <label className={labelClass}>Name *</label>
                  <input
                    type="text"
                    required
                    value={empForm.name}
                    onChange={(e) => setEmpForm((p) => ({ ...p, name: e.target.value }))}
                    className={inputClass}
                    placeholder="e.g. Isaac Newton"
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Position / Role *</label>
                <Select
                  value={empForm.position}
                  onValueChange={(val) => setEmpForm((p) => ({ ...p, position: val }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from(
                      new Set([
                        'Licensing Officer',
                        'Vehicle Examiner',
                        'IT Officer',
                        'Transport Officer',
                        'Asset Officer',
                        'Accountant',
                        'Administrative Officer',
                        'Internal Auditor',
                        'Station Manager',
                        'Regional Manager',
                        'Stores Officer',
                        'Security Officer',
                        'Driver',
                        ...((lookups.employees || []).map((e: any) => e.position).filter(Boolean) as string[]),
                      ])
                    )
                      .sort()
                      .map((pos) => (
                        <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Region *</label>
                  <Select
                    value={empForm.regionId}
                    onValueChange={(val) => setEmpForm((p) => ({ ...p, regionId: val, stationId: '' }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select region" />
                    </SelectTrigger>
                    <SelectContent>
                      {lookups.regions?.map((r: any) => (
                        <SelectItem key={r.id} value={String(r.id)}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={labelClass}>Station *</label>
                  <Select
                    value={empForm.stationId}
                    onValueChange={(val) => setEmpForm((p) => ({ ...p, stationId: val }))}
                    disabled={!empForm.regionId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select station" />
                    </SelectTrigger>
                    <SelectContent>
                      {empFilteredStations.map((s: any) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Department *</label>
                <Select
                  value={empForm.departmentId}
                  onValueChange={(val) => setEmpForm((p) => ({ ...p, departmentId: val }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {lookups.departments?.map((d: any) => (
                      <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmployeeModal(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-lg text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={empSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-sm flex items-center space-x-2 disabled:opacity-60"
                >
                  {empSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>{empSubmitting ? 'Adding...' : 'Add Employee'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
