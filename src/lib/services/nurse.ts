import {
  ServiceNotConnectedError,
  type BookingProvider,
} from "@/lib/services/types";

export const nurseService: BookingProvider = {
  serviceName: "Nurse booking",
  status: "api_connection_required",
  async search() {
    throw new ServiceNotConnectedError("Nurse booking");
  },
  async book() {
    throw new ServiceNotConnectedError("Nurse booking");
  },
};
