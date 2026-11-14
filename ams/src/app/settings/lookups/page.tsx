'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  List,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Loader2,
  ArrowLeft,
  Settings,
  FolderTree,
  MapPin,
  Building2,
  Layers,
  Component,
  Users,
  Package,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type LookupType = 'categories' | 'subcategories' | 'regions' | 'stations' | 'departments' | 'employees';

export default function LookupsManagementPage() {
  const [activeTab, setActiveTab] = useState<LookupType>('categories');
  const [lookups, setLookups] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states for creating new items
  const [newCategory, setNewCategory] = useState({ name: '', code: '' });
  const [newSubcategory, setNewSubcategory] = useState({ name: '', code: '', categoryId: '' });
  const [newRegion, setNewRegion] = useState({ name: '', code: '' });
  const [newStation, setNewStation] = useState({
    name: '',
    regionId: '',
    code: '',
    city: '',
    latitude: '',
    longitude: '',
    address: '',
    phone: '',
  });
  const [newDepartment, setNewDepartment] = useState({ name: '' });
  const [newEmployee, setNewEmployee] = useState({
    employeeId: '',
    name: '',
    position: '',
    departmentId: '',
    stationId: '',
  });
  const [employeesList, setEmployeesList] = useState<any[]>([]);

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPayload, setEditPayload] = useState<any>({});

  // Employee custody / clearance modal state
  const [custodyModalOpen, setCustodyModalOpen] = useState(false);
  const [custodyLoading, setCustodyLoading] = useState(false);
  const [custodyData, setCustodyData] = useState<any>(null);

  const openCustodyModal = async (empId: number) => {
    setCustodyModalOpen(true);
    setCustodyLoading(true);
    setCustodyData(null);
    try {
      const data = await api.getEmployeeCustody(empId);
      setCustodyData(data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load employee custody roster.');
      setCustodyModalOpen(false);
    } finally {
      setCustodyLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [data, emps] = await Promise.all([
        api.getLookups(),
        api.getEmployees().catch(() => []),
      ]);
      setLookups(data);
      setEmployeesList(emps);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load lookup data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    let payload: any = {};
    if (activeTab === 'categories') payload = newCategory;
    else if (activeTab === 'subcategories') payload = newSubcategory;
    else if (activeTab === 'regions') payload = newRegion;
    else if (activeTab === 'stations') payload = newStation;
    else if (activeTab === 'departments') payload = newDepartment;

    try {
      if (activeTab === 'employees') {
        await api.createEmployee({
          employeeId: newEmployee.employeeId,
          name: newEmployee.name,
          position: newEmployee.position,
          departmentId: parseInt(newEmployee.departmentId, 10),
          stationId: parseInt(newEmployee.stationId, 10),
        });
        setNewEmployee({ employeeId: '', name: '', position: '', departmentId: '', stationId: '' });
      } else {
        await api.createLookup(activeTab, payload);
      }
      setSuccessMsg(`New entry added successfully!`);
      // Clear forms
      setNewCategory({ name: '', code: '' });
      setNewSubcategory({ name: '', code: '', categoryId: '' });
      setNewRegion({ name: '', code: '' });
      setNewStation({
        name: '',
        regionId: '',
        code: '',
        city: '',
        latitude: '',
        longitude: '',
        address: '',
        phone: '',
      });
      setNewDepartment({ name: '' });
      // Reload lookup lists
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create lookup entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditPayload({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPayload({});
  };

  const handleUpdate = async (id: number) => {
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      if (activeTab === 'employees') {
        await api.updateEmployee(id, {
          employeeId: editPayload.employeeId,
          name: editPayload.name,
          position: editPayload.position,
          departmentId: parseInt(String(editPayload.departmentId), 10),
          stationId: parseInt(String(editPayload.stationId), 10),
        });
      } else {
        await api.updateLookup(activeTab, id, editPayload);
      }
      setSuccessMsg(`Entry updated successfully!`);
      setEditingId(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update lookup entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deletingEntry, setDeletingEntry] = useState(false);

  const handleDelete = (id: number) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = async () => {
    if (deleteTargetId === null) return;
    setDeletingEntry(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (activeTab === 'employees') {
        await api.deleteEmployee(deleteTargetId);
      } else {
        await api.deleteLookup(activeTab, deleteTargetId);
      }
      setSuccessMsg('Entry deleted successfully.');
      setDeleteTargetId(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete lookup entry. It might be referenced by other records.');
      setDeleteTargetId(null);
    } finally {
      setDeletingEntry(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg text-slate-200 text-sm placeholder-slate-600 focus:outline-none transition-colors';
  const selectClass =
    'w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg text-slate-300 text-sm focus:outline-none transition-colors';
  const labelClass = 'block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5';

  const tabs = [
    { id: 'categories', label: 'Categories', icon: FolderTree, data: lookups.categories || [] },
    { id: 'subcategories', label: 'Subcategories', icon: Layers, data: lookups.subcategories || [] },
    { id: 'regions', label: 'Regions', icon: MapPin, data: lookups.regions || [] },
    { id: 'stations', label: 'Stations', icon: Building2, data: lookups.stations || [] },
    { id: 'departments', label: 'Departments', icon: Component, data: lookups.departments || [] },
    { id: 'employees', label: 'Employees', icon: Users, data: employeesList || [] },
  ];

  const currentTabInfo = tabs.find((t) => t.id === activeTab)!;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/settings"
          className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dropdown Options</h1>
          <p className="text-sm text-slate-400">Manage lookup lists and dropdown selection items dynamically</p>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-800 space-x-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as LookupType);
                cancelEdit();
              }}
              className={`flex items-center space-x-2 py-3 px-4 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-amber-500 text-amber-500'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-850 text-slate-400 border border-slate-800/80">
                {tab.data.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-200 rounded-lg text-sm">
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 text-emerald-200 rounded-lg text-sm">
          {successMsg}
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add New Entry Form */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 h-fit">
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              <Plus className="w-5 h-5 text-amber-500" />
              Add {currentTabInfo.label.slice(0, -1)}
            </h2>

            <form onSubmit={handleCreate} className="space-y-4">
              {activeTab === 'categories' && (
                <>
                  <div>
                    <label className={labelClass}>Category Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Computing Equipment"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory((p) => ({ ...p, name: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Unique Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. COMP"
                      value={newCategory.code}
                      onChange={(e) => setNewCategory((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                      className={inputClass}
                    />
                  </div>
                </>
              )}

              {activeTab === 'subcategories' && (
                <>
                  <div>
                    <label className={labelClass}>Parent Category *</label>
                    <Select
                      value={newSubcategory.categoryId}
                      onValueChange={(val) => setNewSubcategory((p) => ({ ...p, categoryId: val }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Parent Category" />
                      </SelectTrigger>
                      <SelectContent>
                        {lookups.categories?.map((c: any) => (
                          <SelectItem key={c.id} value={String(c.id)}>
                            {c.name} ({c.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className={labelClass}>Subcategory Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Laptops"
                      value={newSubcategory.name}
                      onChange={(e) => setNewSubcategory((p) => ({ ...p, name: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Unique Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LPT"
                      value={newSubcategory.code}
                      onChange={(e) => setNewSubcategory((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                      className={inputClass}
                    />
                  </div>
                </>
              )}

              {activeTab === 'regions' && (
                <>
                  <div>
                    <label className={labelClass}>Region Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Greater Accra Region"
                      value={newRegion.name}
                      onChange={(e) => setNewRegion((p) => ({ ...p, name: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Regional Code *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GAR"
                      value={newRegion.code}
                      onChange={(e) => setNewRegion((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                      className={inputClass}
                    />
                  </div>
                </>
              )}

              {activeTab === 'stations' && (
                <>
                  <div>
                    <label className={labelClass}>Region *</label>
                    <Select
                      value={newStation.regionId}
                      onValueChange={(val) => setNewStation((p) => ({ ...p, regionId: val }))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Region" />
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
                    <label className={labelClass}>Station Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Tema Regional Office"
                      value={newStation.name}
                      onChange={(e) => setNewStation((p) => ({ ...p, name: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelClass}>Station Code</label>
                      <input
                        type="text"
                        placeholder="e.g. GAR-TEM"
                        value={newStation.code}
                        onChange={(e) => setNewStation((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>City / District</label>
                      <input
                        type="text"
                        placeholder="e.g. Tema"
                        value={newStation.city}
                        onChange={(e) => setNewStation((p) => ({ ...p, city: e.target.value }))}
                        className={inputClass}
                      />
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-amber-400 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Map Coordinates (GPS)</span>
                      </label>
                      <span className="text-[10px] text-slate-400">Pointers for GIS Radar</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Latitude (N)</span>
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g. 5.6698"
                          value={newStation.latitude}
                          onChange={(e) => setNewStation((p) => ({ ...p, latitude: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block mb-0.5">Longitude (W/E)</span>
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g. -0.0166"
                          value={newStation.longitude}
                          onChange={(e) => setNewStation((p) => ({ ...p, longitude: e.target.value }))}
                          className={inputClass}
                        />
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-1">Quick Ghana Presets:</span>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { city: 'Accra', lat: 5.5898, lng: -0.1834 },
                          { city: 'Kumasi', lat: 6.6713, lng: -1.6111 },
                          { city: 'Takoradi', lat: 4.9016, lng: -1.7831 },
                          { city: 'Tamale', lat: 9.4008, lng: -0.8393 },
                          { city: 'Cape Coast', lat: 5.1054, lng: -1.2466 },
                          { city: 'Sunyani', lat: 7.3399, lng: -2.3268 },
                          { city: 'Ho', lat: 6.6101, lng: 0.4786 },
                          { city: 'Bolgatanga', lat: 10.7856, lng: -0.8514 },
                        ].map((pr) => (
                          <button
                            key={pr.city}
                            type="button"
                            onClick={() => setNewStation((p) => ({ ...p, city: pr.city, latitude: String(pr.lat), longitude: String(pr.lng) }))}
                            className="px-1.5 py-0.5 bg-slate-900 hover:bg-slate-800 text-[10px] text-amber-300 border border-slate-800 rounded transition-colors"
                          >
                            {pr.city}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Physical Address</label>
                    <input
                      type="text"
                      placeholder="e.g. Harbour Road, Community 1"
                      value={newStation.address}
                      onChange={(e) => setNewStation((p) => ({ ...p, address: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Contact Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +233 303 202 119"
                      value={newStation.phone}
                      onChange={(e) => setNewStation((p) => ({ ...p, phone: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                </>
              )}

              {activeTab === 'departments' && (
                <div>
                  <label className={labelClass}>Department Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Information Technology"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment((p) => ({ ...p, name: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              )}

              {activeTab === 'employees' && (
                <div className="space-y-3">
                  <div>
                    <label className={labelClass}>Employee ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. EMP-009"
                      value={newEmployee.employeeId}
                      onChange={(e) => setNewEmployee((p) => ({ ...p, employeeId: e.target.value.toUpperCase() }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Kwame Boateng"
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee((p) => ({ ...p, name: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Position / Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Licensing Officer"
                      value={newEmployee.position}
                      onChange={(e) => setNewEmployee((p) => ({ ...p, position: e.target.value }))}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Station *</label>
                    <Select
                      value={newEmployee.stationId}
                      onValueChange={(val) => setNewEmployee((p) => ({ ...p, stationId: val }))}
                    >
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select station" /></SelectTrigger>
                      <SelectContent>
                        {lookups.stations?.map((s: any) => (
                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className={labelClass}>Department *</label>
                    <Select
                      value={newEmployee.departmentId}
                      onValueChange={(val) => setNewEmployee((p) => ({ ...p, departmentId: val }))}
                    >
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select department" /></SelectTrigger>
                      <SelectContent>
                        {lookups.departments?.map((d: any) => (
                          <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-sm flex items-center justify-center space-x-2 transition-colors cursor-pointer"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Add Entry</span>
              </button>
            </form>
          </div>

          {/* List and Inline Edit Card */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm h-fit">
            <div className="p-4 border-b border-slate-800 font-bold text-white text-sm flex items-center justify-between">
              <span>Existing Entries ({currentTabInfo.data.length})</span>
            </div>

            {currentTabInfo.data.length === 0 ? (
              <div className="p-8 text-center text-slate-500 italic text-sm">No entries found. Add a new one to populate.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Name</th>
                      {activeTab !== 'departments' && (
                        <th className="py-3 px-4">
                          {activeTab === 'stations'
                            ? 'Region & City'
                            : activeTab === 'subcategories'
                              ? 'Category'
                              : activeTab === 'employees'
                                ? 'Position & Station'
                                : 'Code'}
                        </th>
                      )}
                      {activeTab === 'stations' && <th className="py-3 px-4">GPS Coordinates</th>}
                      <th className="py-3 px-4 text-right w-28">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {currentTabInfo.data.map((item: any) => {
                      const isEditing = editingId === item.id;
                      return (
                        <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="py-3 px-4">
                            {isEditing ? (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={editPayload.name}
                                  placeholder="Station Name"
                                  onChange={(e) => setEditPayload((p: any) => ({ ...p, name: e.target.value }))}
                                  className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-sm text-white focus:outline-none w-full"
                                />
                                {activeTab === 'stations' && (
                                  <input
                                    type="text"
                                    value={editPayload.code || ''}
                                    placeholder="Code (e.g. GAR-37)"
                                    onChange={(e) => setEditPayload((p: any) => ({ ...p, code: e.target.value.toUpperCase() }))}
                                    className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none w-full"
                                  />
                                )}
                              </div>
                            ) : (
                              <div>
                                <span className="font-medium text-white block">{item.name}</span>
                                {(item.code || item.employeeId) && (
                                  <span className="text-[10px] font-mono text-amber-400/90">{item.code || item.employeeId}</span>
                                )}
                              </div>
                            )}
                          </td>
                          {activeTab !== 'departments' && (
                            <td className="py-3 px-4">
                              {isEditing ? (
                                activeTab === 'stations' ? (
                                  <div className="space-y-1">
                                    <Select
                                      value={String(editPayload.regionId)}
                                      onValueChange={(val) => setEditPayload((p: any) => ({ ...p, regionId: parseInt(val) }))}
                                    >
                                      <SelectTrigger className="h-7 py-0.5 px-2 rounded bg-slate-950 border-slate-800 text-xs text-white">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {lookups.regions?.map((r: any) => (
                                          <SelectItem key={r.id} value={String(r.id)}>
                                            {r.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <input
                                      type="text"
                                      placeholder="City / District"
                                      value={editPayload.city || ''}
                                      onChange={(e) => setEditPayload((p: any) => ({ ...p, city: e.target.value }))}
                                      className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none w-full"
                                    />
                                  </div>
                                ) : activeTab === 'subcategories' ? (
                                  <Select
                                    value={String(editPayload.categoryId)}
                                    onValueChange={(val) => setEditPayload((p: any) => ({ ...p, categoryId: parseInt(val) }))}
                                  >
                                    <SelectTrigger className="h-8 py-1 px-2 rounded bg-slate-950 border-slate-800 text-xs text-white">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {lookups.categories?.map((c: any) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                          {c.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : activeTab === 'employees' ? (
                                  <div className="space-y-1">
                                    <input
                                      type="text"
                                      value={editPayload.position || ''}
                                      placeholder="Position"
                                      onChange={(e) => setEditPayload((p: any) => ({ ...p, position: e.target.value }))}
                                      className="px-2 py-0.5 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none w-full"
                                    />
                                    <Select
                                      value={String(editPayload.stationId)}
                                      onValueChange={(val) => setEditPayload((p: any) => ({ ...p, stationId: parseInt(val) }))}
                                    >
                                      <SelectTrigger className="h-7 py-0.5 px-2 rounded bg-slate-950 border-slate-800 text-xs text-white">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {lookups.stations?.map((s: any) => (
                                          <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ) : (
                                  <input
                                    type="text"
                                    value={editPayload.code}
                                    onChange={(e) => setEditPayload((p: any) => ({ ...p, code: e.target.value.toUpperCase() }))}
                                    className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-sm text-white focus:outline-none w-full"
                                  />
                                )
                              ) : (
                                <div>
                                  <span className="text-slate-300 text-xs block">
                                    {activeTab === 'stations'
                                      ? lookups.regions?.find((r: any) => r.id === item.regionId)?.name || 'Unknown'
                                      : activeTab === 'subcategories'
                                        ? lookups.categories?.find((c: any) => c.id === item.categoryId)?.name || 'Unknown'
                                        : activeTab === 'employees'
                                          ? `${item.position || ''} • ${item.stationName || ''}`
                                          : item.code}
                                  </span>
                                  {activeTab === 'employees' && item.departmentName && (
                                    <span className="text-[10px] text-slate-500">{item.departmentName}</span>
                                  )}
                                  {activeTab === 'stations' && item.city && (
                                    <span className="text-[10px] text-slate-500">{item.city}</span>
                                  )}
                                </div>
                              )}
                            </td>
                          )}

                          {/* Stations GPS Column */}
                          {activeTab === 'stations' && (
                            <td className="py-3 px-4">
                              {isEditing ? (
                                <div className="grid grid-cols-2 gap-1 min-w-[160px]">
                                  <input
                                    type="number"
                                    step="any"
                                    placeholder="Lat"
                                    value={editPayload.latitude || ''}
                                    onChange={(e) => setEditPayload((p: any) => ({ ...p, latitude: e.target.value }))}
                                    className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none"
                                  />
                                  <input
                                    type="number"
                                    step="any"
                                    placeholder="Lng"
                                    value={editPayload.longitude || ''}
                                    onChange={(e) => setEditPayload((p: any) => ({ ...p, longitude: e.target.value }))}
                                    className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 rounded text-xs text-white focus:outline-none"
                                  />
                                </div>
                              ) : item.latitude && item.longitude ? (
                                <Link
                                  href="/map"
                                  className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-400 font-mono hover:bg-emerald-500/20 transition-colors"
                                  title="View pin on Geographic Ghana Map"
                                >
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  <span>
                                    {parseFloat(item.latitude).toFixed(4)}°, {parseFloat(item.longitude).toFixed(4)}°
                                  </span>
                                </Link>
                              ) : (
                                <span className="text-slate-500 text-xs italic">No GPS set</span>
                              )}
                            </td>
                          )}

                          <td className="py-3 px-4 text-right">
                            {isEditing ? (
                              <div className="flex justify-end space-x-1.5">
                                <button
                                  onClick={() => handleUpdate(item.id)}
                                  disabled={submitting}
                                  title="Save Changes"
                                  className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded hover:bg-emerald-500/10 transition-colors cursor-pointer"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  title="Cancel"
                                  className="p-1.5 text-red-400 hover:text-red-300 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end space-x-1.5">
                                {activeTab === 'employees' && (
                                  <button
                                    type="button"
                                    onClick={() => openCustodyModal(item.id)}
                                    title="View Asset Custody & Clearance"
                                    className="px-2 py-1 text-xs font-semibold text-amber-400 hover:text-slate-950 hover:bg-amber-500 border border-amber-500/30 rounded flex items-center space-x-1 transition-colors cursor-pointer"
                                  >
                                    <Package className="w-3.5 h-3.5" />
                                    <span>Custody</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => startEdit(item)}
                                  title="Edit Entry"
                                  className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  title="Delete Entry"
                                  className="p-1.5 text-red-400 hover:text-red-300 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteTargetId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Trash2 className="w-4 h-4 text-red-400" />
                <span>Delete Lookup Entry</span>
              </h3>
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-300">
                Are you sure you want to delete this entry? Items referencing this lookup might throw errors if deleted.
              </p>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTargetId(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deletingEntry}
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white disabled:opacity-50 inline-flex items-center space-x-1.5"
                >
                  {deletingEntry && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee Custody & Staff Clearance Modal */}
      {custodyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center space-x-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span>Employee Asset Custody &amp; Staff Clearance</span>
                </h3>
                {custodyData?.employee && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    {custodyData.employee.name} ({custodyData.employee.employeeId}) •{' '}
                    {custodyData.employee.position} — {custodyData.employee.stationName}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setCustodyModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {custodyLoading ? (
                <div className="py-10 flex items-center justify-center text-slate-400 text-sm">
                  <Loader2 className="w-5 h-5 animate-spin mr-2 text-amber-500" />
                  Loading assigned assets...
                </div>
              ) : custodyData ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <p className="text-[11px] text-slate-400 uppercase font-semibold">Clearance Status</p>
                      <p
                        className={`text-sm font-bold mt-1 ${
                          custodyData.clearanceStatus === 'Cleared' ? 'text-emerald-400' : 'text-amber-400'
                        }`}
                      >
                        {custodyData.clearanceStatus}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <p className="text-[11px] text-slate-400 uppercase font-semibold">Active Assets Held</p>
                      <p className="text-sm font-bold text-white mt-1">{custodyData.activeCount}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
                      <p className="text-[11px] text-slate-400 uppercase font-semibold">Total Value</p>
                      <p className="text-sm font-bold text-white mt-1">
                        GHS {Number(custodyData.totalValue || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {custodyData.assets?.length === 0 ? (
                    <div className="p-6 text-center text-sm text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                      No assets assigned. This staff member is cleared for transfer or exit.
                    </div>
                  ) : (
                    <div className="border border-slate-800 rounded-lg overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-950 text-slate-400 uppercase">
                          <tr>
                            <th className="px-3 py-2">Asset ID</th>
                            <th className="px-3 py-2">Name</th>
                            <th className="px-3 py-2">Station / Room</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2 text-right">Open</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {custodyData.assets.map((a: any) => (
                            <tr key={a.assetId}>
                              <td className="px-3 py-2 font-mono text-amber-400">{a.assetId}</td>
                              <td className="px-3 py-2 text-slate-200 font-medium">{a.name}</td>
                              <td className="px-3 py-2 text-slate-400">
                                {a.stationName || '—'}
                                {a.subLocation ? ` (${a.subLocation})` : ''}
                              </td>
                              <td className="px-3 py-2 text-slate-300">{a.status.replace('_', ' ')}</td>
                              <td className="px-3 py-2 text-right">
                                <Link
                                  href={`/assets/${encodeURIComponent(a.assetId)}`}
                                  className="inline-flex items-center space-x-1 text-sky-400 hover:text-sky-300"
                                >
                                  <span>View</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
