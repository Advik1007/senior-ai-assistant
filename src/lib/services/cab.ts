import {
  ServiceNotConnectedError,
  type BookingProvider,
} from "@/lib/services/types";

/** Cab provider. Connect a licensed ride-hail API here later. */
export const cabService: BookingProvider = {
  serviceName: "Cab booking",
  status: "api_connection_required",
  async search() {
    throw new ServiceNotConnectedError("Cab booking");
  },
  async book() {
    throw new ServiceNotConnectedError("Cab booking");
  },
};
