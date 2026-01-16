export default function FormSelector({ selection, setSelection }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold mb-4">Create New Entry</h2>
      <div className="flex gap-4 bg-white border rounded-lg p-4">
        <div className="flex-1">
          <label className="block text-sm font-semibold mb-2">Warehouse Type</label>
          <select
            className="border px-4 py-2 w-full rounded"
            value={selection.warehouseType}
            onChange={(e) =>
              setSelection({ ...selection, warehouseType: e.target.value })
            }
          >
            <option value="domestic">Domestic</option>
            <option value="export">Export</option>
            <option value="online">Online</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-semibold mb-2">Form Type</label>
          <select
            className="border px-4 py-2 w-full rounded"
            value={selection.formType}
            onChange={(e) =>
              setSelection({ ...selection, formType: e.target.value })
            }
          >
            <option value="dispatch">Dispatch</option>
            <option value="production">Production</option>
            <option value="purchase">Purchase</option>
            <option value="transfer">Transfer</option>
            <option value="return">Return</option>
            <option value="sample">Sample</option>
            <option value="sales">Sales</option>
            <option value="import">Import</option>
          </select>
        </div>
      </div>
    </div>
  );
}
