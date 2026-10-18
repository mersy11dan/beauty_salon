"use client";

import { EntityEditor } from "@/components/ops/entity-editor";
import { OpsTitle } from "@/components/ops/ops-shell";
import { uid } from "@/lib/format";
import { useSalonStore } from "@/lib/store";
import type { PortfolioItem } from "@/lib/types";

export default function AdminPortfolioPage() {
  const portfolio = useSalonStore((s) => s.portfolio);
  const upsert = useSalonStore((s) => s.upsertPortfolio);
  const remove = useSalonStore((s) => s.removePortfolio);

  return (
    <>
      <OpsTitle title="Portfolio" intro="Photos of finished work. The first five also appear on the homepage." />
      <EntityEditor<PortfolioItem>
        items={portfolio}
        fields={[
          { key: "src", label: "Photo", type: "image", required: true, span: 2 },
          { key: "caption", label: "Caption", type: "text", required: true },
          { key: "category", label: "Category", type: "text", required: true },
          { key: "alt", label: "Description for screen readers", type: "text", span: 2, hint: "What is in the photo, in a few words." },
        ]}
        blank={() => ({ id: uid("pf"), src: "", caption: "", category: "", alt: "" })}
        title={(p) => p.caption}
        subtitle={(p) => p.category}
        thumb={(p) => p.src}
        onSave={upsert}
        onRemove={remove}
        addLabel="Add a photo"
      />
    </>
  );
}
