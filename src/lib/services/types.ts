/**
 * Shared contract for paid services.
 *
 * Safety rule: never mark a booking as confirmed unless an authorized
 * external API returns a real confirmation id. Never store PINs, OTPs,
 * or CVVs.
 */

export type ServiceConnectionStatus = "api_connection_required" | "connected";

export type ServiceQuote = {
  id: string;
  providerName: string;
  summary: string;
  whenLabel: string;
  totalPrice: number;
  currency: string;
};

export class ServiceNotConnectedError extends Error {
  constructor(serviceName: string) {
    super(
      `${serviceName} is not connected. Add authorized API credentials on the server before search or booking can run.`,
    );
    this.name = "ServiceNotConnectedError";
  }
}

export type BookingProvider = {
  serviceName: string;
  status: ServiceConnectionStatus;
  search: (details: Record<string, string>) => Promise<ServiceQuote[]>;
  /**
   * Must be called only after the user confirmed twice.
   * Implementations must refuse if status is api_connection_required.
   */
  book: (quoteId: string) => Promise<{ confirmationId: string }>;
};
