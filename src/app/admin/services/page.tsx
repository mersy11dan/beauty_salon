"use client";

import { EntityEditor } from "@/components/ops/entity-editor";
import { OpsTitle } from "@/components/ops/ops-shell";
import { formatDuration } from "@/lib/dates";
import { formatMoney, uid } from "@/lib/format";
import { useSalonStore } from "@/lib/store";
import type { Service } from "@/lib/types";

export default function AdminServicesPage() {
  const services = useSalonStore((s) => s.services);
  const upsert = useSalonStore((s) => s.upsertService);
  const remove = useSalonStore((s) => s.removeService);

  return (
    <>
      <OpsTitle title="Services" intro="The public price list. Duration decides which booking times are offered." />
      <EntityEditor<Service>
        items={services}
        fields={[
          { key: "name", label: "Name", type: "text", required: true },
          { key: "category", label: "Category", type: "text", required: true, hint: "Nails, Hair, Makeup… groups the list." },
          { key: "durationMin", label: "Duration (minutes)", type: "number", required: true },
          { key: "price", label: "Price", type: "number", required: true },
          { key: "note", label: "Note", type: "text", span: 2, hint: "Optional, shown under the name." },
        ]}
        blank={() => ({ id: uid("svc"), name: "", category: "", durationMin: 60, price: 0 })}
        title={(s) => s.name}
        subtitle={(s) => `${s.category} · ${formatDuration(s.durationMin)} · ${formatMoney(s.price)}`}
        onSave={upsert}
        onRemove={remove}
        addLabel="Add a service"
      />
    </>
  );
}
