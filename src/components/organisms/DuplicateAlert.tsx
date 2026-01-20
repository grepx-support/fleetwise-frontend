"use client";
import React, { useState } from 'react';
import {
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export interface DuplicateRecord {
  row_number: number;
  duplicate_type: 'existing_db' | 'within_file' | 'both';
  customer_name: string;
  customer_id: number;
  passenger_name: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_date: string;
  pickup_time: string;
  service_type: string;
  matching_jobs: Array<{
    job_id: number;
    passenger_name: string;
    created_at: string;
  }>;
  matching_rows: number[];
}

interface DuplicateAlertProps {
  duplicates: DuplicateRecord[];
  onCreateAll: () => void;
  onCancel: () => void;
  onReviewJobs: () => void;
  isLoading?: boolean;
}

export default function DuplicateAlert({
  duplicates,
  onCreateAll,
  onCancel,
  onReviewJobs,
  isLoading = false
}: DuplicateAlertProps) {
  const [expandedRows, setExpandedRows] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;
  const totalPages = Math.ceil(duplicates.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedDuplicates = duplicates.slice(startIdx, endIdx);

  const toggleRowExpansion = (rowNumber: number) => {
    setExpandedRows(prev =>
      prev.includes(rowNumber)
        ? prev.filter(r => r !== rowNumber)
        : [...prev, rowNumber]
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('en-SG', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getDuplicateTypeLabel = (type: string) => {
    switch (type) {
      case 'existing_db':
        return 'Existing Job';
      case 'within_file':
        return 'Duplicate in Upload';
      case 'both':
        return 'Multiple Matches';
      default:
        return 'Duplicate';
    }
  };

  const getDuplicateTypeColor = (type: string) => {
    switch (type) {
      case 'existing_db':
        return 'bg-red-50 border-red-200 text-red-700';
      case 'within_file':
        return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'both':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div 
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        {/* Header */}
        <div className="sticky top-0 border-b p-6" style={{ borderColor: 'var(--color-border)' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full" style={{ backgroundColor: '#fbbf24' }}>
                  <ExclamationTriangleIcon className="h-6 w-6 text-amber-700" />
                </div>
              </div>
              <div>
                <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-main)' }}>
                  Potential Duplicates Detected
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Found {duplicates.length} potential duplicate{duplicates.length !== 1 ? 's' : ''} in your upload
                  {totalPages > 1 && <span> (Page {currentPage} of {totalPages})</span>}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Info message */}
          <div 
            className="p-4 rounded-lg border text-sm"
            style={{ 
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              borderColor: '#fbbf24',
              color: 'var(--color-text-main)'
            }}
          >
            <p>
              These rows match existing jobs or other rows in your upload. You can still create them by clicking "Create All Jobs", 
              or review and edit them by clicking "Review Jobs".
            </p>
          </div>

          {/* Duplicates Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: 'var(--color-bg-light)', borderBottomColor: 'var(--color-border)' }} className="border-b">
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-text-main)' }}>Row #</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-text-main)' }}>Customer</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-text-main)' }}>Passenger</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-text-main)' }}>Route</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-text-main)' }}>Date/Time</th>
                  <th className="px-4 py-3 text-left font-semibold" style={{ color: 'var(--color-text-main)' }}>Match Type</th>
                  <th className="px-4 py-3 text-center font-semibold" style={{ color: 'var(--color-text-main)' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDuplicates.map((dup, idx) => (
                  <React.Fragment key={idx}>
                    <tr 
                      style={{ 
                        backgroundColor: 'rgba(251, 191, 36, 0.05)',
                        borderBottomColor: 'var(--color-border)'
                      }}
                      className="border-b hover:opacity-80"
                    >
                      <td className="px-4 py-3" style={{ color: 'var(--color-text-main)' }}>
                        <span className="font-semibold">#{dup.row_number}</span>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-text-main)' }}>
                        <div>
                          <p className="font-medium">{dup.customer_name}</p>
                          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            ID: {dup.customer_id}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-text-main)' }}>
                        {dup.passenger_name || '(Not specified)'}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-text-main)' }}>
                        <div className="text-xs space-y-1">
                          <p>From: {dup.pickup_location}</p>
                          <p>To: {dup.dropoff_location}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-text-main)' }}>
                        <div className="text-xs space-y-1">
                          <p>{formatDate(dup.pickup_date)}</p>
                          <p className="font-mono">{dup.pickup_time}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span 
                          className={`px-2 py-1 rounded text-xs font-medium border ${getDuplicateTypeColor(dup.duplicate_type)}`}
                        >
                          {getDuplicateTypeLabel(dup.duplicate_type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => toggleRowExpansion(dup.row_number)}
                          className="inline-flex items-center justify-center p-1 hover:opacity-70"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          {expandedRows.includes(dup.row_number) ? (
                            <ChevronUpIcon className="h-4 w-4" />
                          ) : (
                            <ChevronDownIcon className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded details row */}
                    {expandedRows.includes(dup.row_number) && (
                      <tr style={{ backgroundColor: 'var(--color-bg-light)' }}>
                        <td colSpan={7} className="px-4 py-4">
                          <div className="space-y-4">
                            {dup.duplicate_type !== 'within_file' && dup.matching_jobs.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2" style={{ color: 'var(--color-text-main)' }}>
                                  Matching Existing Jobs:
                                </h4>
                                <div className="space-y-2">
                                  {dup.matching_jobs.map((job, jidx) => (
                                    <div 
                                      key={jidx}
                                      className="p-3 rounded border"
                                      style={{ 
                                        backgroundColor: 'rgba(239, 68, 68, 0.05)',
                                        borderColor: 'rgba(239, 68, 68, 0.3)'
                                      }}
                                    >
                                      <p style={{ color: 'var(--color-text-main)' }}>
                                        <span className="font-semibold">Job #{job.job_id}</span>
                                        {job.passenger_name && (
                                          <span> - {job.passenger_name}</span>
                                        )}
                                      </p>
                                      {job.created_at && (
                                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                                          Created: {new Date(job.created_at).toLocaleString()}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {dup.duplicate_type !== 'existing_db' && dup.matching_rows.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2" style={{ color: 'var(--color-text-main)' }}>
                                  Duplicates Within This Upload:
                                </h4>
                                <div className="space-y-2">
                                  {dup.matching_rows.map((rowNum, ridx) => (
                                    <div 
                                      key={ridx}
                                      className="p-3 rounded border"
                                      style={{ 
                                        backgroundColor: 'rgba(250, 204, 21, 0.05)',
                                        borderColor: 'rgba(250, 204, 21, 0.3)'
                                      }}
                                    >
                                      <p style={{ color: 'var(--color-text-main)' }}>
                                        <span className="font-semibold">Row #{rowNum}</span> in this upload
                                      </p>
                                    </div>
                                  ))}
                                </div>
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
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
            <div style={{ color: 'var(--color-text-secondary)' }} className="text-sm">
              Showing {startIdx + 1}-{Math.min(endIdx, duplicates.length)} of {duplicates.length} duplicates
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  color: 'var(--color-text-main)',
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-bg-light)'
                }}
              >
                Previous
              </button>
              <span style={{ color: 'var(--color-text-main)' }} className="text-sm font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  color: 'var(--color-text-main)',
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-bg-light)'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Footer / Actions */}
        <div 
          className="sticky bottom-0 border-t px-6 py-4 flex items-center justify-between"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
            style={{
              color: 'var(--color-text-main)',
              backgroundColor: 'var(--color-bg-light)',
              borderColor: 'var(--color-border)'
            }}
          >
            Cancel Upload
          </button>

          <div className="flex items-center space-x-3">
            <button
              onClick={onReviewJobs}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
              style={{
                color: 'var(--color-primary)',
                backgroundColor: 'rgba(var(--color-primary-rgb, 16 185 237), 0.1)',
                borderColor: 'var(--color-primary)'
              }}
            >
              Review Jobs
            </button>

            <button
              onClick={onCreateAll}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white border border-transparent rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
              style={{
                backgroundColor: '#10b981'
              }}
            >
              {isLoading ? 'Processing...' : 'Create All Jobs'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
