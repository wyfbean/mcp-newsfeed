import { Header } from "@/components/layout/Header";
import { SettingsPanel } from "@/components/settings/SettingsPanel";

export default function SettingsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">⚙️ Settings</h1>
        <SettingsPanel />
      </main>
    </div>
  );
}
