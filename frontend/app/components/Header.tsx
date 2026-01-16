"use client";

type HeaderProps = {
  onMenuClick?: () => void;
};

export default function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-black text-white shadow p-4">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden rounded border border-white/20 px-3 py-2 hover:bg-white/10"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          ☰
        </button>
        <h1 className="text-lg font-semibold">Inventory Management System</h1>
      </div>
    </header>
  );
}