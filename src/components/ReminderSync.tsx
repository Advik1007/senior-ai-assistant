"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import { extraRoute, syncReminders } from "@/lib/reminders";

/**
 * Asks Android for notification permission, then schedules medicine/routine
 * banners (title UNK AI, body like REMINDER SLEEP) even when the app is closed.
 */
export function ReminderSync() {
  const router = useRouter();

  useEffect(() => {
    void syncReminders();

    const onVisible = () => {
      if (document.visibilityState === "visible") void syncReminders();
    };
    document.addEventListener("visibilitychange", onVisible);

    let removeTap: (() => void) | undefined;
    let removeResume: (() => void) | undefined;

    if (Capacitor.isNativePlatform()) {
      void import("@capacitor/app")
        .then(({ App }) => {
          const sub = App.addListener("appStateChange", ({ isActive }) => {
            if (isActive) void syncReminders();
          });
          removeResume = () => {
            void sub.then((h) => h.remove());
          };
        })
        .catch(() => undefined);

      if (Capacitor.isPluginAvailable("LocalNotifications")) {
        void import("@capacitor/local-notifications")
          .then(({ LocalNotifications }) => {
            const sub = LocalNotifications.addListener(
              "localNotificationActionPerformed",
              (event) => {
                const route = extraRoute(event.notification.extra);
                if (route) router.push(route);
              },
            );
            removeTap = () => {
              void sub.then((h) => h.remove());
            };
          })
          .catch(() => undefined);
      }
    }

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      removeTap?.();
      removeResume?.();
    };
  }, [router]);

  return null;
}
