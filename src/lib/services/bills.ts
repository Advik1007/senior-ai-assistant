import {
  ServiceNotConnectedError,
  type BookingProvider,
} from "@/lib/services/types";

/** Utility bills (electricity / water). Designed for a BBPS-style API. */
export const billService: BookingProvider = {
  serviceName: "Utility bill payment",
  status: "api_connection_required",
  async search() {
    throw new ServiceNotConnectedError("Utility bill payment");
  },
  async book() {
    throw new ServiceNotConnectedError("Utility bill payment");
  },
};
