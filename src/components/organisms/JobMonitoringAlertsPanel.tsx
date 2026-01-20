import React, { useState } from 'react';
import { useJobMonitoring } from '@/hooks/useJobMonitoring';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

const JobMonitoringAlertsPanel = () => {
  const { alerts, startTrip, dismissAlert, isStartingTrip, isDismissing } = useJobMonitoring();
  const [expandedAlerts, setExpandedAlerts] = useState<Record<number, boolean>>({});

  const toggleExpand = (id: number) => {
    setExpandedAlerts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatElapsedTime = (minutes: number) => {
    if (minutes < 0) {
      const absMinutes = Math.abs(minutes);
      if (absMinutes < 60) {
        return `${absMinutes} min early`;
      } else if (absMinutes < 1440) { // Less than a day (24 hours * 60 minutes)
        const hours = Math.floor(absMinutes / 60);
        const remainingMinutes = absMinutes % 60;
        return remainingMinutes > 0 
          ? `${hours}h ${remainingMinutes}m early`
          : `${hours}h early`;
      } else { // 1 day or more
        const days = Math.floor(absMinutes / 1440);
        const remainingHours = Math.floor((absMinutes % 1440) / 60);
        return remainingHours > 0
          ? `${days}d ${remainingHours}h early`
          : `${days}d early`;
      }
    } else if (minutes < 60) {
      return `${minutes} min late`;
    } else if (minutes < 1440) { // Less than a day (24 hours * 60 minutes)
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 
        ? `${hours}h ${remainingMinutes}m late`
        : `${hours}h late`;
    } else { // 1 day or more
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      return remainingHours > 0
        ? `${days}d ${remainingHours}h late`
        : `${days}d late`;
    }
  };

  return (
    <div className="col-span-3 pr-8 pl-8">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
            Active Monitoring Alerts
          </h3>
          <span className="px-3 py-1 bg-red-600/20 text-red-300 text-sm font-medium rounded-full border border-red-600/30">
            {alerts.length} alerts
          </span>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {alerts && alerts.length > 0 ? (
            alerts.map((alert) => (
              <div key={alert.id} className="border border-gray-600 rounded-lg p-3 bg-gray-750 hover:bg-gray-700 transition-colors">
                <div className="flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => toggleExpand(alert.id)}
                        className="text-gray-300 hover:text-white focus:outline-none"
                        aria-label={expandedAlerts[alert.id] ? "Collapse" : "Expand"}
                      >
                        {expandedAlerts[alert.id] ? 
                          <ChevronUpIcon className="h-4 w-4" /> : 
                          <ChevronDownIcon className="h-4 w-4" />
                        }
                      </button>
                      <span className="font-medium text-white truncate">Job #{alert.jobId}</span>
                      <span className="text-xs text-yellow-400 bg-yellow-900/50 px-1.5 py-0.5 rounded">
                        {formatElapsedTime(Math.floor(alert.elapsedTime))}
                      </span>
                      <span className="text-xs text-gray-400 truncate ml-1">
                        • {alert.driverName}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <button 
                      onClick={() => {
                        // Open job details in a new window/tab
                        window.open(`/jobs/${alert.jobId}`, '_blank');
                      }}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                      title="View Job"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => startTrip(alert.jobId)}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded transition-colors"
                      disabled={isStartingTrip}
                      title="Start Trip"
                    >
                      Start
                    </button>

                    <button 
                      onClick={() => dismissAlert(alert.id)}
                      className="text-xs bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors"
                      disabled={isDismissing}
                      title="Dismiss Alert"
                    >
                      X
                    </button>
                  </div>
                </div>
                {expandedAlerts[alert.id] && (
                  <div className="mt-2 pt-2 border-t border-gray-700 text-sm space-y-1">
                    <div className="text-gray-300">
                      <span className="text-gray-400">Pickup Time:</span> {new Date(alert.pickupTime).toLocaleString()}
                    </div>
                    <div className="text-gray-300">
                      <span className="text-gray-400">Passenger:</span> {alert.passengerDetails}
                    </div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-gray-400">
              <p>No active monitoring alerts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobMonitoringAlertsPanel;