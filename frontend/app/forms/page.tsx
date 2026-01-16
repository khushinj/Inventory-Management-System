"use client";

import { useState } from "react";
import FormSelector from "./../components/FormSelector";
import TransactionForm from "./../components/TransactionForm";

export default function FormsPage() {
  const [selection, setSelection] = useState({
    warehouseType: "domestic",
    formType: "dispatch",
  });

  return (
    <div className="pb-8">
      <FormSelector selection={selection} setSelection={setSelection} />
      <TransactionForm selection={selection} />
    </div>
  );
}