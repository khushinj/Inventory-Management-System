"use client";

import { useState } from "react";
import FormSelector from "./../components/FormSelector";
import TransactionForm from "./../components/TransactionForm";

type Selection = {
  domain: "shop" | "warehouse";
  warehouseType: "domestic" | "export" | "online" | "";
  formType: string;
};

export default function FormsPage() {
  const [selection, setSelection] = useState<Selection>({
    domain: "shop",
    warehouseType: "",
    formType: "import",
  });

  return (
    <div className="pb-8">
      <FormSelector selection={selection} setSelection={setSelection} />
      <TransactionForm selection={selection} />
    </div>
  );
}