import { useQuery } from '@tanstack/react-query';
import { getCustomerServicePricing } from '@/services/api/customerServicePricingApi';

export function useCustomerServicePricing(
  customerId: number | undefined, 
  serviceName: string | undefined,
  vehicleType: string | undefined
) {
  return useQuery({
    queryKey: ['customerServicePricing', customerId, serviceName, vehicleType],
    queryFn: () => {
      // Only call API if ALL three fields are present
      if (!customerId || !serviceName || !vehicleType) {
        return Promise.resolve(null);
      }
      return getCustomerServicePricing(customerId, serviceName, vehicleType);
    },
    // Enable query ONLY when all three fields are provided
    enabled: !!customerId && !!serviceName && !!vehicleType,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry if pricing doesn't exist
  });
}