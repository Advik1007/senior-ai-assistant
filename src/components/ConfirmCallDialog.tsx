"use client";

import type { Contact } from "@/lib/db/schema";
import { useApp } from "@/components/providers/app-provider";
import { BigButton } from "@/components/BigButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function ConfirmCallDialog({
  contact,
  onClose,
  onConfirm,
}: {
  contact: Contact | null;
  onClose: () => void;
  onConfirm: (contact: Contact) => void;
}) {
  const { strings } = useApp();
  if (!contact) return null;

  const relationship = strings.relationship[contact.relationship];

  return (
    <Dialog open={!!contact} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-md gap-6 rounded-3xl border-4 border-[#0B1F3A] p-6 sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="text-3xl font-extrabold">
            {strings.confirmCallTitle}
          </DialogTitle>
          <DialogDescription className="text-xl text-[#0B1F3A]">
            {strings.confirmCallBody(contact.name, relationship)}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <BigButton tone="call" onClick={() => onConfirm(contact)}>
            {strings.yesCall}
          </BigButton>
          <BigButton tone="muted" onClick={onClose}>
            {strings.noCancel}
          </BigButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
