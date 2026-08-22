import {
  ServiceNotConnectedError,
  type BookingProvider,
} from "@/lib/services/types";

export const bloodTestService: BookingProvider = {
  serviceName: "Blood test booking",
  status: "api_connection_required",
  async search() {
    throw new ServiceNotConnectedError("Blood test booking");
  },
  async book() {
    throw new ServiceNotConnectedError("Blood test booking");
  },
};
