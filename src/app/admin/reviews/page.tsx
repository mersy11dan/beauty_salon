"use client";

import { EntityEditor } from "@/components/ops/entity-editor";
import { OpsTitle } from "@/components/ops/ops-shell";
import { formatDateShort, todayISO } from "@/lib/dates";
import { uid } from "@/lib/format";
import { useSalonStore } from "@/lib/store";
import type { Review } from "@/lib/types";

export default function AdminReviewsPage() {
  const reviews = useSalonStore((s) => s.reviews);
  const upsert = useSalonStore((s) => s.upsertReview);
  const remove = useSalonStore((s) => s.removeReview);
  const move = useSalonStore((s) => s.moveItem);

  return (
    <>
      <OpsTitle title="Reviews" intro="Quotes from clients, in the order shown here. The first three also appear on the homepage." />
      <EntityEditor<Review>
        items={reviews}
        fields={[
          { key: "author", label: "Name", type: "text", required: true, hint: "First name and initial is usual." },
          {
            key: "rating",
            label: "Rating",
            type: "select",
            options: [5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} star${n === 1 ? "" : "s"}` })),
          },
          { key: "text", label: "Quote", type: "textarea", required: true, span: 2 },
          { key: "date", label: "Date", type: "date", hint: "Optional. Leave blank to hide the date." },
        ]}
        blank={() => ({ id: uid("rv"), author: "", rating: 5, text: "", date: todayISO() })}
        title={(r) => `${r.author} · ${r.rating}★`}
        subtitle={(r) => `${r.date ? `${formatDateShort(r.date)} · ` : ""}${r.text.slice(0, 70)}${r.text.length > 70 ? "…" : ""}`}
        onSave={(r) => upsert({ ...r, rating: Number(r.rating) as Review["rating"] })}
        onRemove={remove}
        onMove={(id, dir) => move("reviews", id, dir)}
        addLabel="Add a review"
      />
    </>
  );
}
