import clsx from "clsx";
import type { AppointmentStatus, PaymentStatus } from "@/lib/types";

const statusStyles: Record<AppointmentStatus, string> = {
  requested: "bg-[#fff4dc] text-[#7a5200]",
  confirmed: "bg-[#e3f0e7] text-[#1f5c35]",
  completed: "bg-[#e9e7f3] text-[#3f3a73]",
  cancelled: "bg-[#f0eff1] text-[#6b6870] line-through decoration-[#6b6870]/50",
};

const statusLabel: Record<AppointmentStatus, string> = {
  requested: "Requested",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold tracking-[0.01em]", statusStyles[status])}>
      {statusLabel[status]}
    </span>
  );
}

export function PaidBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold",
        status === "paid" ? "bg-[#e3f0e7] text-[#1f5c35]" : "bg-[#fde8e4] text-[#8a2f1f]",
      )}
    >
      {status === "paid" ? "Paid" : "Unpaid"}
    </span>
  );
}
