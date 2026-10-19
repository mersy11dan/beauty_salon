"use client";

import { EntityEditor } from "@/components/ops/entity-editor";
import { OpsTitle } from "@/components/ops/ops-shell";
import { addDays, formatDateShort, todayISO } from "@/lib/dates";
import { uid } from "@/lib/format";
import { useSalonStore } from "@/lib/store";
import type { Offer } from "@/lib/types";

export default function AdminOffersPage() {
  const offers = useSalonStore((s) => s.offers);
  const upsert = useSalonStore((s) => s.upsertOffer);
  const remove = useSalonStore((s) => s.removeOffer);
  const move = useSalonStore((s) => s.moveItem);

  return (
    <>
      <OpsTitle title="Offers" intro="Promotions, in the order shown here. Expired or paused offers disappear from the site on their own; the first one also gets a band on the homepage." />
      <EntityEditor<Offer>
        items={offers}
        fields={[
          { key: "title", label: "Title", type: "text", required: true, span: 2 },
          { key: "detail", label: "Detail", type: "textarea", required: true, span: 2 },
          { key: "until", label: "Valid until", type: "date", hint: "Leave blank for an offer with no end date." },
          { key: "active", label: "Showing on the site", type: "checkbox" },
        ]}
        blank={() => ({ id: uid("of"), title: "", detail: "", until: addDays(todayISO(), 30), active: true })}
        title={(o) => o.title}
        subtitle={(o) => `${o.active ? "Showing" : "Paused"} · ${o.until ? `until ${formatDateShort(o.until)}` : "no end date"}`}
        onSave={upsert}
        onRemove={remove}
        onMove={(id, dir) => move("offers", id, dir)}
        addLabel="Add an offer"
      />
    </>
  );
}
