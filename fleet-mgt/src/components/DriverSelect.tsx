'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useFleet } from '@/context/FleetContext';
import { User, ShieldCheck, ShieldAlert } from 'lucide-react';

interface DriverSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

export default function DriverSelect({
  value,
  onChange,
  placeholder = "Search or type driver name...",
  required = false
}: DriverSelectProps) {
  const { drivers } = useFleet();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Keep input synchronized with value from parent form state
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Click outside close logic
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter existing drivers by name or license number
  const suggestions = drivers.filter(d => 
    d.name.toLowerCase().includes(inputValue.toLowerCase()) ||
    d.licenseNumber.toLowerCase().includes(inputValue.toLowerCase())
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    setIsOpen(true);
  };

  const handleSelectSuggestion = (driverName: string) => {
    setInputValue(driverName);
    onChange(driverName);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        className="form-input"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setIsOpen(true)}
        required={required}
        autoComplete="off"
        style={{ width: '100%' }}
      />
      {isOpen && suggestions.length > 0 && (
        <div 
          className="glass-panel" 
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: '6px',
            padding: '6px',
            zIndex: 99,
            maxHeight: '220px',
            overflowY: 'auto',
            background: 'var(--bg-card-solid)',
            borderColor: 'var(--border-color)',
            boxShadow: 'var(--shadow-glow)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {suggestions.map((driver) => {
              return (
                <div
                  key={driver.id}
                  onClick={() => handleSelectSuggestion(driver.name)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    transition: 'var(--transition-smooth)'
                  }}
                  className="driver-suggestion-item"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.borderColor = 'var(--primary-gold)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User style={{ height: '12px', width: '12px', color: 'var(--primary-gold)' }} />
                      <span style={{ fontWeight: '600', fontSize: '0.82rem', color: 'var(--text-bright)' }}>
                        {driver.name}
                      </span>
                    </div>
                    <span 
                      style={{ 
                        fontSize: '0.62rem', 
                        fontWeight: '700',
                        padding: '1px 6px', 
                        borderRadius: '4px',
                        background: 'rgba(212, 175, 55, 0.15)',
                        color: 'var(--primary-gold)'
                      }}
                    >
                      {driver.licenseClass || 'Class B'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', paddingLeft: '18px' }}>
                    <span>License: {driver.licenseNumber}</span>
                    <span>{driver.phone}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
