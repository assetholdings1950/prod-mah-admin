"use client";

import { Percent, Plus, Trash2 } from "lucide-react";
import { cls, type ChargeRow } from "./types";
import Section from "./Section";
import Field from "./Field";

type Props = {
    charges:  ChargeRow[];
    onChange: (charges: ChargeRow[]) => void;
};

const ChargesSection = ({ charges, onChange }: Props) => {
    const add    = () => onChange([...charges, { particular: "", chargePercent: "" }]);
    const remove = (i: number) => onChange(charges.filter((_, idx) => idx !== i));
    const update = (i: number, key: keyof ChargeRow, value: string) => {
        const next = [...charges];
        next[i] = { ...next[i], [key]: value };
        onChange(next);
    };

    return (
        <Section icon={<Percent size={14} />} title="Charges">
            <div className="flex flex-col gap-3">
                {charges.length === 0 && (
                    <p className="text-xs text-slate-400 py-1">
                        No charges configured. These deductions apply when a client claims or exits.
                    </p>
                )}

                {charges.map((c, i) => (
                    <div key={i} className="flex items-end gap-3">
                        <div className="flex-1">
                            <Field label={i === 0 ? "Particular" : ""}>
                                <input
                                    type="text"
                                    placeholder="e.g. Platform Fee"
                                    value={c.particular}
                                    onChange={(e) => update(i, "particular", e.target.value)}
                                    className={cls.input}
                                />
                            </Field>
                        </div>

                        <div className="w-32">
                            <Field label={i === 0 ? "Charge %" : ""}>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        placeholder="1"
                                        value={c.chargePercent}
                                        onChange={(e) => update(i, "chargePercent", e.target.value)}
                                        className={[cls.input, "pr-7"].join(" ")}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">%</span>
                                </div>
                            </Field>
                        </div>

                        <button
                            type="button"
                            onClick={() => remove(i)}
                            className="mb-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-rose-200 text-rose-400 hover:bg-rose-50 transition"
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={add}
                    className="flex w-fit items-center gap-1.5 text-[12px] font-semibold text-navy hover:text-navy/70 transition"
                >
                    <Plus size={14} />
                    Add Charge
                </button>
            </div>
        </Section>
    );
};

export default ChargesSection;
