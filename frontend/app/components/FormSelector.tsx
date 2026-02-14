import { type Dispatch, type SetStateAction } from "react";

type Selection = {
  domain: "shop" | "warehouse";
  warehouseType: "domestic" | "online" | "";
  formType: string;
};

const warehouseFormOptions: Record<string, { value: string; label: string }[]> = {
  domestic: [
    { value: "dispatch", label: "Dispatch" },
    { value: "production", label: "Production" },
    { value: "purchase", label: "Purchase" },
    { value: "transfer", label: "Transfer" },
    { value: "return", label: "Return" },
    { value: "sample", label: "Sample" },
  ],
  online: [
    { value: "return", label: "Return" },
    { value: "sales", label: "Sales" },
    { value: "transfer", label: "Transfer" },
    { value: "purchase", label: "Purchase" },
  ],
};

export default function FormSelector({
  selection,
  setSelection,
}: {
  selection: Selection;
  setSelection: Dispatch<SetStateAction<Selection>>;
}) {
  const { domain, warehouseType, formType } = selection;

  const warehouseForms = warehouseFormOptions[warehouseType] || [];

  const handleWarehouseTypeChange = (
    nextWarehouse: Selection["warehouseType"]
  ) => {
    const allowedForms = warehouseFormOptions[nextWarehouse] ?? [];
    const nextForm =
      allowedForms.find((opt) => opt.value === formType)?.value ||
      allowedForms[0]?.value ||
      "";

    setSelection({ domain: "warehouse", warehouseType: nextWarehouse, formType: nextForm });
  };

  const setShopForm = (shopForm: "import" | "sales") => {
    setSelection({ domain: "shop", warehouseType: "", formType: shopForm });
  };

  return (
    <div className="mb-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Create New Entry</h2>

      {/* Domain toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          className={`px-4 py-2 rounded border ${domain === "shop" ? "bg-white text-black" : "bg-black text-white"
            }`}
          onClick={() => setSelection({ domain: "shop", warehouseType: "", formType: "import" })}
        >
          Shop
        </button>
        <button
          className={`px-4 py-2 rounded border ${domain === "warehouse" ? "bg-white text-black" : "bg-black text-white"
            }`}
          onClick={() =>
            setSelection({ domain: "warehouse", warehouseType: "domestic", formType: "dispatch" })
          }
        >
          Warehouse
        </button>
      </div>

      {domain === "shop" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border rounded-lg p-4">
          {[{ key: "import", label: "Import" }, { key: "sales", label: "Sales / Return" }].map(
            (btn) => (
              <button
                key={btn.key}
                onClick={() => setShopForm(btn.key as "import" | "sales")}
                className={`border rounded-lg p-4 text-left font-semibold transition ${formType === btn.key ? "bg-white text-black" : "bg-black text-white"
                  }`}
              >
                {btn.label}
              </button>
            )
          )}
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4 border rounded-lg p-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold mb-2">Warehouse Type</label>
            <select
              className="border px-4 py-2 bg-black w-full rounded"
              value={warehouseType}
              onChange={(e) => handleWarehouseTypeChange(e.target.value as Selection["warehouseType"])}
            >
              <option value="domestic">Domestic</option>
              <option value="online">Online</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-semibold mb-2">Form Type</label>
            <select
              className="border px-4 py-2 bg-black w-full rounded"
              value={formType}
              onChange={(e) => setSelection({ domain: "warehouse", warehouseType, formType: e.target.value })}
            >
              {warehouseForms.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
