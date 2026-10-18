"use client";

import { Card, OpsTitle } from "@/components/ops/ops-shell";
import { Field, Input, Select } from "@/components/ui/field";
import { formatTime, WEEKDAY_NAMES } from "@/lib/dates";
import { formatMoney, isValidUrl } from "@/lib/format";
import { useSalonStore } from "@/lib/store";
import type { Clock, Weekday } from "@/lib/types";

const ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0];

const CURRENCIES = [
  ["USD", "US dollar"],
  ["EUR", "Euro"],
  ["GBP", "British pound"],
  ["CAD", "Canadian dollar"],
  ["AUD", "Australian dollar"],
  ["NZD", "New Zealand dollar"],
  ["CHF", "Swiss franc"],
  ["SEK", "Swedish krona"],
  ["NOK", "Norwegian krone"],
  ["DKK", "Danish krone"],
  ["PLN", "Polish zloty"],
  ["CZK", "Czech koruna"],
  ["HUF", "Hungarian forint"],
  ["RON", "Romanian leu"],
  ["TRY", "Turkish lira"],
  ["AED", "UAE dirham"],
  ["SAR", "Saudi riyal"],
  ["QAR", "Qatari riyal"],
  ["ILS", "Israeli shekel"],
  ["EGP", "Egyptian pound"],
  ["NGN", "Nigerian naira"],
  ["GHS", "Ghanaian cedi"],
  ["KES", "Kenyan shilling"],
  ["ZAR", "South African rand"],
  ["INR", "Indian rupee"],
  ["PKR", "Pakistani rupee"],
  ["BDT", "Bangladeshi taka"],
  ["LKR", "Sri Lankan rupee"],
  ["SGD", "Singapore dollar"],
  ["MYR", "Malaysian ringgit"],
  ["IDR", "Indonesian rupiah"],
  ["THB", "Thai baht"],
  ["VND", "Vietnamese dong"],
  ["PHP", "Philippine peso"],
  ["HKD", "Hong Kong dollar"],
  ["CNY", "Chinese yuan"],
  ["JPY", "Japanese yen"],
  ["KRW", "South Korean won"],
  ["MXN", "Mexican peso"],
  ["BRL", "Brazilian real"],
  ["ARS", "Argentine peso"],
  ["CLP", "Chilean peso"],
  ["COP", "Colombian peso"],
  ["PEN", "Peruvian sol"],
  ["JMD", "Jamaican dollar"],
  ["TTD", "Trinidad and Tobago dollar"],
] as const;

export default function ContactPage() {
  const settings = useSalonStore((s) => s.settings);
  const update = useSalonStore((s) => s.updateSettings);
  const { contact, hours } = settings;
  const setContact = (patch: Partial<typeof contact>) => update({ contact: { ...contact, ...patch } });
  const known = CURRENCIES.some(([c]) => c === settings.currency);

  return (
    <>
      <OpsTitle title="Contact and hours" intro="How guests reach the salon, when it is open, and how prices and times are written." />

      <div className="flex flex-col gap-6">
        <Card className="p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-ops-ink">Contact</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" htmlFor="phone" hint="Leave blank to hide.">
              <Input id="phone" value={contact.phone} onChange={(e) => setContact({ phone: e.target.value })} />
            </Field>
            <Field label="Email" htmlFor="email" hint="Leave blank to hide.">
              <Input id="email" type="email" value={contact.email} onChange={(e) => setContact({ email: e.target.value })} />
            </Field>
            <Field label="Address" htmlFor="address" className="sm:col-span-2">
              <Input id="address" value={contact.address} onChange={(e) => setContact({ address: e.target.value })} />
            </Field>
            <Field
              label="Map link"
              htmlFor="map"
              hint="Paste a Google Maps share link. Leave blank to hide."
              error={isValidUrl(contact.mapUrl) ? undefined : "Use a full link starting with https://"}
              className="sm:col-span-2"
            >
              <Input id="map" inputMode="url" value={contact.mapUrl} onChange={(e) => setContact({ mapUrl: e.target.value })} />
            </Field>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-1 text-[15px] font-semibold text-ops-ink">Opening hours</h2>
          <p className="mb-4 text-[13.5px] text-ops-muted">Booking only offers times inside these hours.</p>
          <ul className="divide-y divide-ops-line">
            {ORDER.map((d) => {
              const h = hours[d];
              return (
                <li key={d} className="flex flex-wrap items-center gap-3 py-3">
                  <span className="w-28 text-[14.5px] text-ops-ink">{WEEKDAY_NAMES[d]}</span>
                  <label className="flex items-center gap-2 text-[13.5px] text-ops-muted">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-ops-accent"
                      checked={!!h}
                      onChange={(e) =>
                        update({ hours: { ...hours, [d]: e.target.checked ? { open: "09:00", close: "18:00" } : null } })
                      }
                    />
                    Open
                  </label>
                  {h && (
                    <span className="flex items-center gap-2">
                      <Input type="time" aria-label={`${WEEKDAY_NAMES[d]} opens`} value={h.open} onChange={(e) => update({ hours: { ...hours, [d]: { ...h, open: e.target.value } } })} className="w-32" />
                      <span className="text-ops-muted">to</span>
                      <Input type="time" aria-label={`${WEEKDAY_NAMES[d]} closes`} value={h.close} onChange={(e) => update({ hours: { ...hours, [d]: { ...h, close: e.target.value } } })} className="w-32" />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          <div className="mt-5 max-w-xs">
            <Field label="Bookings at the same time" htmlFor="capacity" hint="Used when guests book without choosing a person. Usually the number of chairs.">
              <Input
                id="capacity"
                inputMode="numeric"
                value={String(settings.capacity)}
                onChange={(e) => update({ capacity: Math.min(50, Math.max(1, Number(e.target.value) || 1)) })}
              />
            </Field>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 text-[15px] font-semibold text-ops-ink">Prices and times</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Currency" htmlFor="currency" hint={`A 55 service shows as ${formatMoney(55, settings.currency)}.`}>
              <Select id="currency" value={settings.currency} onChange={(e) => update({ currency: e.target.value })}>
                {!known && <option value={settings.currency}>{settings.currency}</option>}
                {CURRENCIES.map(([code, name]) => (
                  <option key={code} value={code}>
                    {name} ({code})
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Clock" htmlFor="clock" hint={`Half past two shows as ${formatTime("14:30", settings.clock)}.`}>
              <Select id="clock" value={settings.clock} onChange={(e) => update({ clock: e.target.value as Clock })}>
                <option value="12h">12-hour (2:30 pm)</option>
                <option value="24h">24-hour (14:30)</option>
              </Select>
            </Field>
          </div>
        </Card>
      </div>
    </>
  );
}
