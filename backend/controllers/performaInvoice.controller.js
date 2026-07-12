import { join } from "path";
import { promises as fs } from "fs";

const DATA_PATH = join(process.cwd(), "backend", "data");
const FILE = join(DATA_PATH, "proforma_invoices.json");

export const saveProformaInvoice = async (req, res) => {
  try {
    const payload = req.body || {};

    // Ensure data directory exists
    await fs.mkdir(DATA_PATH, { recursive: true });

    let existing = [];
    try {
      const content = await fs.readFile(FILE, "utf8");
      existing = JSON.parse(content || "[]");
    } catch (err) {
      existing = [];
    }

    const entry = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      ...payload,
    };

    existing.push(entry);

    await fs.writeFile(FILE, JSON.stringify(existing, null, 2), "utf8");

    return res.json({ success: true, data: entry });
  } catch (err) {
    console.error("Failed to save proforma invoice:", err);
    return res.status(500).json({ success: false, error: String(err) });
  }
};
