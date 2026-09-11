"use client";

import { useState } from "react";
import { universities, UniversityMark } from "@/components/university-mark";

export function UniversityPicker({ defaultValue = "UNSW" }: { defaultValue?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  return <div className="university-picker">
    <input type="hidden" name="university" value={value}/>
    <button type="button" className="university-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}><UniversityMark university={value} label/><span aria-hidden="true">⌄</span></button>
    {open ? <div className="university-options" role="listbox" aria-label="Australian university">{universities.map((university) => <button type="button" role="option" aria-selected={value === university.value} key={university.value} onClick={() => { setValue(university.value); setOpen(false); }}><UniversityMark university={university.value} label/></button>)}</div> : null}
  </div>;
}
