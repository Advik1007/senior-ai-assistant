import {
  ServiceNotConnectedError,
  type BookingProvider,
} from "@/lib/services/types";

export const flightService: BookingProvider = {
  serviceName: "Flight booking",
  status: "api_connection_required",
  async search() {
    throw new ServiceNotConnectedError("Flight booking");
  },
  async book() {
    throw new ServiceNotConnectedError("Flight booking");
  },
};
