"use client";

import { EntityEditor } from "@/components/ops/entity-editor";
import { OpsTitle } from "@/components/ops/ops-shell";
import { uid } from "@/lib/format";
import { useSalonStore } from "@/lib/store";
import type { StaffMember } from "@/lib/types";

export default function AdminTeamPage() {
  const staff = useSalonStore((s) => s.staff);
  const services = useSalonStore((s) => s.services);
  const upsert = useSalonStore((s) => s.upsertStaff);
  const remove = useSalonStore((s) => s.removeStaff);

  return (
    <>
      <OpsTitle title="Team" intro="People guests can book with. Assign services so the booking page only offers the right person." />
      <EntityEditor<StaffMember>
        items={staff}
        fields={[
          { key: "name", label: "Name", type: "text", required: true },
          { key: "role", label: "Role", type: "text", required: true },
          { key: "bio", label: "Short bio", type: "textarea", span: 2 },
          { key: "photo", label: "Photo", type: "image", span: 2 },
          {
            key: "serviceIds",
            label: "Does these services",
            type: "multiselect",
            span: 2,
            options: services.map((s) => ({ value: s.id, label: s.name })),
            hint: "Leave all unselected to allow every service.",
          },
        ]}
        blank={() => ({ id: uid("stf"), name: "", role: "", bio: "", photo: null, serviceIds: [] })}
        title={(m) => m.name}
        subtitle={(m) => m.role}
        thumb={(m) => m.photo}
        onSave={upsert}
        onRemove={remove}
        addLabel="Add a person"
      />
    </>
  );
}
