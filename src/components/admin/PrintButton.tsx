"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="adm-btn adm-btn-primary">
      Print / save as PDF
    </button>
  );
}
