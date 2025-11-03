import { z } from "zod";

export const agentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional(),
  mobile: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  agent_discount_percent: z.number().optional(),
});

export const vehicleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  number: z.string().min(1, "Number is required"),
  status: z.string().optional(),
});

// Time range config schema for ancillary services
const timeRangeConfigSchema = z.object({
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format (e.g., 23:00)"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format (e.g., 06:00)")
});

// Additional stops config schema for ancillary services
const additionalStopsConfigSchema = z.object({
  trigger_count: z.number().int().nonnegative("Must be non-negative integer")
});

export const serviceSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  base_price: z.number().optional(),
  status: z.string().optional(),
  // Decimal fields - accept numbers with optional defaults
  additional_ps: z.number().optional(),
  distance_levy: z.number().optional(),
  midnight_surcharge: z.number().optional(),
  // Ancillary charge fields
  is_ancillary: z.boolean().optional(),
  condition_type: z.enum(['time_range', 'additional_stops', 'always']).nullable().optional(),
  condition_config: z.string().optional()
    .refine(
      (val) => {
        if (!val) return true;
        try {
          JSON.parse(val);
          return true;
        } catch {
          return false;
        }
      },
      "Must be valid JSON"
    ),
  is_per_occurrence: z.boolean().optional(),
}).refine(
  (data) => {
    // Validate config structure matches condition_type
    if (!data.is_ancillary || !data.condition_config) return true;
    try {
      const config = JSON.parse(data.condition_config);
      if (data.condition_type === 'time_range') {
        return timeRangeConfigSchema.safeParse(config).success;
      }
      if (data.condition_type === 'additional_stops') {
        return additionalStopsConfigSchema.safeParse(config).success;
      }
      return true;
    } catch {
      return false;
    }
  },
  {
    message: "Configuration doesn't match the selected condition type requirements",
    path: ["condition_config"]
  }
);

export const servicesVehicleTypePriceSchema = z.object({
  service_id: z.number().positive("Service is required"),
  vehicle_type_id: z.number().positive("Vehicle type is required"),
  price: z.number().positive("Price must be positive"),
});