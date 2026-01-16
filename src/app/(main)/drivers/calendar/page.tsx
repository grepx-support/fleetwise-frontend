"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { format, addDays, subDays, parseISO, differenceInHours, isSameDay, isToday, isYesterday } from 'date-fns';
import { 
  TruckIcon, 
  UserIcon, 
  ClockIcon, 
  MapPinIcon, 
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BriefcaseIcon,
  DollarSignIcon,
  UsersIcon,
  XCircleIcon,
  CheckCircleIcon
} from 'lucide-react';
import { useGetAllDrivers } from '@/hooks/useDrivers';
import * as jobsApi from '@/services/api/jobsApi';
import { useGetDriverLeaves } from '@/hooks/useDriverLeave';
import { Job, ApiJob } from '@/types/job';
import type { Driver } from '@/lib/types';
import { DriverLeave } from '@/types/driverLeave';

interface CalendarBlock {
  type: 'job' | 'leave' | 'available' | 'unavailable';
  startTime: string;
  endTime: string;
  job?: Job;
  leave?: DriverLeave;
  driverId: number;
}

interface DriverWithAvailability {
  driver: Driver;
  availabilityBlocks: CalendarBlock[];
  todayStats: {
    totalJobs: number;
    totalHours: number;
    totalEarnings: number;
    jobsByStatus: Record<string, number>;
  };
  yesterdayStats: {
    totalJobs: number;
    totalHours: number;
    totalEarnings: number;
    jobsByStatus: Record<string, number>;
  };
}

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => i); // 0-23 hours
const DAYS_TO_SHOW = 5;

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    'new': 'bg-blue-500',
    'confirmed': 'bg-blue-500',
    'otw': 'bg-purple-500',
    'ots': 'bg-yellow-500',
    'pob': 'bg-orange-500',
    'jc': 'bg-green-500',
    'sd': 'bg-gray-500',
    'canceled': 'bg-red-500'
  };
  return colors[status?.toLowerCase()] || 'bg-gray-400';
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    'new': 'New',
    'confirmed': 'Confirmed',
    'otw': 'On the Way',
    'ots': 'On the Spot',
    'pob': 'Person On Board',
    'jc': 'Job Completed',
    'sd': 'Stand Down',
    'canceled': 'Canceled'
  };
  return labels[status?.toLowerCase()] || status;
};

const getLeaveTypeColor = (leaveType: string) => {
  const colors: Record<string, string> = {
    'sick_leave': 'bg-orange-500',
    'vacation': 'bg-purple-500',
    'personal': 'bg-yellow-500',
    'emergency': 'bg-red-500'
  };
  return colors[leaveType] || 'bg-gray-500';
};

const getLeaveTypeLabel = (leaveType: string) => {
  return leaveType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function DriverCalendarPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [driverStatusFilter, setDriverStatusFilter] = useState<string>('all');
  const [hoveredBlock, setHoveredBlock] = useState<{ block: CalendarBlock; position: { x: number; y: number } } | null>(null);

  // Fetch data
  const { data: drivers = [], isLoading: driversLoading } = useGetAllDrivers();
  
  // Fetch calendar data
  const { data: calendarData, isLoading: calendarLoading } = useQuery({
    queryKey: ['jobs', 'calendar', DAYS_TO_SHOW],
    queryFn: async () => {
      const response = await jobsApi.getJobsCalendar(DAYS_TO_SHOW);
      return response;
    },
    refetchInterval: 30000,
  });
  
  const { data: leaves = [], isLoading: leavesLoading } = useGetDriverLeaves({});

  // Generate date range (5 days centered on selected date)
  const dateRange = useMemo(() => {
    const dates = [];
    const startDate = subDays(selectedDate, 2);
    for (let i = 0; i < DAYS_TO_SHOW; i++) {
      dates.push(addDays(startDate, i));
    }
    return dates;
  }, [selectedDate]);

  // Process driver availability data
  const driversWithAvailability = useMemo<DriverWithAvailability[]>(() => {
    if (driversLoading || calendarLoading || leavesLoading) return [];

    return drivers
      .filter(driver => driverStatusFilter === 'all' || driver.status?.toLowerCase() === driverStatusFilter)
      .map(driver => {
        const availabilityBlocks: CalendarBlock[] = [];
        const today = new Date();
        const yesterday = subDays(today, 1);
        
        // Generate 24-hour blocks for each day
        dateRange.forEach(date => {
          const dateString = format(date, 'yyyy-MM-dd');
          
          // Find jobs for this driver on this date
          const driverJobs = (calendarData?.calendar_data?.[dateString]?.[driver.id] || []) as Job[];
          
          // Find leaves for this driver on this date
          const driverLeaves = (leaves || []).filter(leave => 
            leave.driver_id === driver.id &&
            leave.status === 'approved' &&
            new Date(leave.start_date) <= date &&
            new Date(leave.end_date) >= date
          );

          // Create hourly blocks
          for (let hour = 0; hour < 24; hour++) {
            const startTime = `${hour.toString().padStart(2, '0')}:00`;
            const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
            
            // Check for jobs in this hour
            const hourJobs = driverJobs.filter(job => {
              if (!job.pickup_time) return false;
              const [pickupHour] = job.pickup_time.split(':').map(Number);
              return pickupHour === hour;
            });

            // Check for leave in this hour
            const hasLeave = driverLeaves.length > 0;

            if (hourJobs.length > 0) {
              // Job block
              availabilityBlocks.push({
                type: 'job',
                startTime,
                endTime,
                job: hourJobs[0], // Take first job if multiple
                driverId: driver.id
              });
            } else if (hasLeave) {
              // Leave block
              availabilityBlocks.push({
                type: 'leave',
                startTime,
                endTime,
                leave: driverLeaves[0],
                driverId: driver.id
              });
            } else {
              // Available block
              availabilityBlocks.push({
                type: 'available',
                startTime,
                endTime,
                driverId: driver.id
              });
            }
          }
        });

        // Calculate today's stats
        const todayDateString = format(today, 'yyyy-MM-dd');
        const todayJobs = (calendarData?.calendar_data?.[todayDateString]?.[driver.id] || []) as Job[];
        const todayStats = {
          totalJobs: todayJobs.length,
          totalHours: todayJobs.reduce((sum, job) => sum + 1, 0), // Simplified
          totalEarnings: todayJobs.reduce((sum, job) => sum + (parseFloat(job.base_price?.toString() || '0') || 0), 0),
          jobsByStatus: todayJobs.reduce((acc, job) => {
            acc[job.status || 'unknown'] = (acc[job.status || 'unknown'] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        };

        // Calculate yesterday's stats
        const yesterdayDateString = format(yesterday, 'yyyy-MM-dd');
        const yesterdayJobs = (calendarData?.calendar_data?.[yesterdayDateString]?.[driver.id] || []) as Job[];
        const yesterdayStats = {
          totalJobs: yesterdayJobs.length,
          totalHours: yesterdayJobs.reduce((sum, job) => sum + 1, 0), // Simplified
          totalEarnings: yesterdayJobs.reduce((sum, job) => sum + (parseFloat(job.base_price?.toString() || '0') || 0), 0),
          jobsByStatus: yesterdayJobs.reduce((acc, job) => {
            acc[job.status || 'unknown'] = (acc[job.status || 'unknown'] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        };

        return {
          driver,
          availabilityBlocks,
          todayStats,
          yesterdayStats
        };
      });
  }, [drivers, calendarData, leaves, dateRange, driverStatusFilter, driversLoading, calendarLoading, leavesLoading]);

  const isLoading = driversLoading || calendarLoading || leavesLoading;

  // Navigation handlers
  const goToPreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const goToNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Tooltip component
  const BlockTooltip = () => {
    if (!hoveredBlock) return null;

    const { block, position } = hoveredBlock;
    const tooltipRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
      if (!tooltipRef.current) return;

      const tooltip = tooltipRef.current;
      const rect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = position.x + 10;
      let newY = position.y + 10;

      if (newX + rect.width > viewportWidth) {
        newX = position.x - rect.width - 10;
      }
      if (newY + rect.height > viewportHeight) {
        newY = position.y - rect.height - 10;
      }

      tooltip.style.left = `${newX}px`;
      tooltip.style.top = `${newY}px`;
    }, [position]);

    return (
      <div
        ref={tooltipRef}
        className="fixed z-50 bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700 p-3 w-64 pointer-events-none"
      >
        {block.type === 'job' && block.job && (
          <>
            <div className="font-bold text-sm mb-2">Job #{block.job.id}</div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <UserIcon className="w-3 h-3 text-blue-400" />
                <span>{block.job.customer_name || 'No customer'}</span>
              </div>
              <div className="flex items-center gap-2">
                <TruckIcon className="w-3 h-3 text-blue-400" />
                <span>{block.job.service_type}</span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="w-3 h-3 text-blue-400" />
                <span>{block.startTime}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-3 h-3 text-blue-400" />
                <span className="truncate">{block.job.pickup_location}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPinIcon className="w-3 h-3 text-red-400" />
                <span className="truncate">{block.job.dropoff_location}</span>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-700">
                <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(block.job.status || '')}`}>
                  {getStatusLabel(block.job.status || '')}
                </span>
              </div>
            </div>
          </>
        )}

        {block.type === 'leave' && block.leave && (
          <>
            <div className="font-bold text-sm mb-2">On Leave</div>
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-3 h-3 text-orange-400" />
                <span>{getLeaveTypeLabel(block.leave.leave_type)}</span>
              </div>
              <div className="text-gray-300 text-xs">
                {format(new Date(block.leave.start_date), 'MMM d')} - {format(new Date(block.leave.end_date), 'MMM d')}
              </div>
              {block.leave.reason && (
                <div className="text-gray-400 text-xs italic mt-1">
                  "{block.leave.reason}"
                </div>
              )}
            </div>
          </>
        )}

        {block.type === 'available' && (
          <div className="text-xs">
            <div className="font-bold mb-1">Available</div>
            <div className="text-gray-300">{block.startTime} - {block.endTime}</div>
          </div>
        )}
      </div>
    );
  };

  // Stats Card Component
  const StatsCard = ({ title, stats, isToday }: { title: string; stats: any; isToday: boolean }) => (
    <Card className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700">
      <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
        {isToday ? (
          <CheckCircleIcon className="w-5 h-5 text-green-400" />
        ) : (
          <ClockIcon className="w-5 h-5 text-blue-400" />
        )}
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.totalJobs}</div>
          <div className="text-xs text-gray-400">Total Jobs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.totalHours.toFixed(1)}</div>
          <div className="text-xs text-gray-400">Hours</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">${stats.totalEarnings.toFixed(2)}</div>
          <div className="text-xs text-gray-400">Earnings</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {Object.keys(stats.jobsByStatus).length}
          </div>
          <div className="text-xs text-gray-400">Status Types</div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-700">
        <div className="text-xs text-gray-400 mb-1">Jobs by Status:</div>
        <div className="flex flex-wrap gap-1">
          {Object.entries(stats.jobsByStatus).map(([status, count]) => (
            <span 
              key={status}
              className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status as string)}`}
            >
              {getStatusLabel(status as string)}: {String(count)}
            </span>
          ))}
        </div>
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Driver Calendar</h1>
            <p className="text-gray-400">View driver schedules, availability, and performance metrics</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/drivers')}
              variant="secondary"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <UsersIcon className="w-4 h-4 mr-2" />
              View All Drivers
            </Button>
          </div>
        </div>

        {/* Controls */}
        <Card className="p-4 mb-6 bg-gray-800/50 border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  onClick={goToPreviousDay}
                  variant="secondary"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </Button>
                <Button
                  onClick={goToToday}
                  variant="secondary"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Today
                </Button>
                <Button
                  onClick={goToNextDay}
                  variant="secondary"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-lg font-semibold text-white">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-300">Driver Status:</label>
              <select
                value={driverStatusFilter}
                onChange={(e) => setDriverStatusFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Drivers</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Date Headers */}
        <div className="grid grid-cols-6 gap-1 mb-2 sticky top-0 z-10 bg-gray-900/80 backdrop-blur-sm py-2 px-1 rounded-lg">
          <div className="text-sm font-semibold text-gray-300 pl-2">Driver</div>
          {dateRange.map(date => (
            <div 
              key={date.toISOString()} 
              className={`text-center text-sm font-medium ${
                isToday(date) ? 'text-green-400' : 
                isYesterday(date) ? 'text-blue-400' : 'text-gray-300'
              }`}
            >
              <div>{format(date, 'EEE')}</div>
              <div className="text-xs opacity-75">{format(date, 'MMM d')}</div>
            </div>
          ))}
        </div>

        {/* Driver Rows */}
        <div className="space-y-3">
          {driversWithAvailability.map(({ driver, availabilityBlocks, todayStats, yesterdayStats }) => (
            <Card key={driver.id} className="p-4 bg-gray-800/30 border-gray-700 hover:border-gray-600 transition-colors">
              <div className="grid grid-cols-6 gap-1">
                {/* Driver Info */}
                <div className="flex items-center gap-3 pl-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {driver.name?.charAt(0).toUpperCase() || 'D'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-white truncate">{driver.name}</div>
                    <div className="text-xs text-gray-400">
                      {driver.vehicle?.number || 'No Vehicle'}
                    </div>
                    <div className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                      driver.status?.toLowerCase() === 'active' 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {driver.status}
                    </div>
                  </div>
                </div>

                {/* Availability Blocks for each day */}
                {dateRange.map(date => {
                  const dateString = format(date, 'yyyy-MM-dd');
                  const dayBlocks = availabilityBlocks.filter(block => {
                    // Simple way to match blocks to dates - improve if needed
                    return true; // Placeholder logic
                  });

                  return (
                    <div 
                      key={`${driver.id}-${dateString}`} 
                      className="h-16 bg-gray-700/50 rounded border border-gray-600 relative overflow-hidden"
                    >
                      {/* Hourly grid lines */}
                      {TIME_SLOTS.map(hour => (
                        <div 
                          key={hour}
                          className="absolute top-0 bottom-0 w-px bg-gray-600/30"
                          style={{ left: `${(hour / 24) * 100}%` }}
                        />
                      ))}
                      
                      {/* Sample block visualization - would need more sophisticated logic */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-xs text-gray-500">Timeline View</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-700">
                <StatsCard title="Today's Performance" stats={todayStats} isToday={true} />
                <StatsCard title="Yesterday's Performance" stats={yesterdayStats} isToday={false} />
              </div>
            </Card>
          ))}
        </div>

        {driversWithAvailability.length === 0 && (
          <Card className="p-12 text-center bg-gray-800/30 border-gray-700">
            <CalendarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-300 mb-2">No drivers found</h3>
            <p className="text-gray-500 mb-6">
              {driverStatusFilter === 'all' 
                ? 'No drivers in the system.' 
                : `No ${driverStatusFilter} drivers found.`}
            </p>
            <Button
              onClick={() => router.push('/drivers/new')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <UserIcon className="w-4 h-4 mr-2" />
              Add Driver
            </Button>
          </Card>
        )}
      </div>

      {hoveredBlock && <BlockTooltip />}
    </div>
  );
}