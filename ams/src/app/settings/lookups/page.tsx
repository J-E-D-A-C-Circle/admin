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
  Component
} from 'lucide-react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type LookupType = 'categories' | 'subcategories' | 'regions' | 'stations' | 'departments';

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
  const [newStation, setNewStation] = useState({ name: '', regionId: '' });
  const [newDepartment, setNewDepartment] = useState({ name: '' });

  // Inline edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPayload, setEditPayload] = useState<any>({});

  const loadData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await api.getLookups();
      setLookups(data);
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
      await api.createLookup(activeTab, payload);
      setSuccessMsg(`New entry added successfully!`);
      // Clear forms
      setNewCategory({ name: '', code: '' });
      setNewSubcategory({ name: '', code: '', categoryId: '' });
      setNewRegion({ name: '', code: '' });
      setNewStation({ name: '', regionId: '' });
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
      await api.updateLookup(activeTab, id, editPayload);
      setSuccessMsg(`Entry updated successfully!`);
      setEditingId(null);
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update lookup entry.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry? Items referencing this lookup might throw errors if deleted.')) {
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await api.deleteLookup(activeTab, id);
      setSuccessMsg('Entry deleted successfully.');
      await loadData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete lookup entry. It might be referenced by other records.');
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
                      placeholder="e.g. Tema Head Office"
                      value={newStation.name}
                      onChange={(e) => setNewStation((p) => ({ ...p, name: e.target.value }))}
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

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-sm flex items-center justify-center space-x-2 transition-colors"
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
                      {activeTab !== 'departments' && <th className="py-3 px-4">{activeTab === 'stations' ? 'Region' : activeTab === 'subcategories' ? 'Category' : 'Code'}</th>}
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
                              <input
                                type="text"
                                value={editPayload.name}
                                onChange={(e) => setEditPayload((p: any) => ({ ...p, name: e.target.value }))}
                                className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-sm text-white focus:outline-none w-full"
                              />
                            ) : (
                              <span className="font-medium">{item.name}</span>
                            )}
                          </td>
                          {activeTab !== 'departments' && (
                            <td className="py-3 px-4">
                              {isEditing ? (
                                activeTab === 'stations' ? (
                                  <Select
                                    value={String(editPayload.regionId)}
                                    onValueChange={(val) => setEditPayload((p: any) => ({ ...p, regionId: parseInt(val) }))}
                                  >
                                    <SelectTrigger className="h-8 py-1 px-2 rounded bg-slate-950 border-slate-800 text-xs text-white">
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
                                ) : (
                                  <input
                                    type="text"
                                    value={editPayload.code}
                                    onChange={(e) => setEditPayload((p: any) => ({ ...p, code: e.target.value.toUpperCase() }))}
                                    className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-sm text-white focus:outline-none w-full"
                                  />
                                )
                              ) : (
                                <span className="text-slate-400 font-mono text-xs">
                                  {activeTab === 'stations'
                                    ? lookups.regions?.find((r: any) => r.id === item.regionId)?.name || 'Unknown'
                                    : activeTab === 'subcategories'
                                    ? lookups.categories?.find((c: any) => c.id === item.categoryId)?.name || 'Unknown'
                                    : item.code}
                                </span>
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
                                  className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded hover:bg-emerald-500/10 transition-colors"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  title="Cancel"
                                  className="p-1.5 text-red-400 hover:text-red-300 rounded hover:bg-red-500/10 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex justify-end space-x-1.5">
                                <button
                                  onClick={() => startEdit(item)}
                                  title="Edit Entry"
                                  className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id)}
                                  title="Delete Entry"
                                  className="p-1.5 text-red-400 hover:text-red-300 rounded hover:bg-red-500/10 transition-colors"
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
    </div>
  );
}
