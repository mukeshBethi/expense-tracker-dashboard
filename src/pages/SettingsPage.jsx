import { useState } from "react";
import { Download } from "lucide-react";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import Switch from "../components/ui/Switch.jsx";
import Button from "../components/ui/Button.jsx";
import Toast from "../components/ui/Toast.jsx";

const CURRENCY_OPTIONS = [
  { value: "$", label: "$ USD" },
  { value: "€", label: "€ EUR" },
  { value: "£", label: "£ GBP" },
  { value: "₹", label: "₹ INR" },
];

export default function SettingsPage({
  state, theme, toggleTheme, setCurrency, setDisplayName, setBudgetAlertsEnabled, setWeeklySummaryEnabled, handleExport,
  toastMessage, dismissToast, setToastMessage,
}) {
  const { settings } = state;
  const [displayNameInput, setDisplayNameInput] = useState(settings.displayName || "");

  function handleSaveDisplayName() {
    setDisplayName(displayNameInput.trim());
    setToastMessage("Display name updated.");
  }

  const displayNameDirty = displayNameInput.trim() !== (settings.displayName || "");

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-2xl">
      <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-pr-primary">Profile</h2>
        <div className="flex items-end gap-3">
          <Input
            label="Display Name" placeholder="Your name" maxLength={60}
            value={displayNameInput}
            onChange={e => setDisplayNameInput(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSaveDisplayName} disabled={!displayNameDirty}>Save</Button>
        </div>
        <Select
          label="Currency"
          value={settings.currency}
          onChange={e => { setCurrency(e.target.value); setToastMessage("Currency updated."); }}
          options={CURRENCY_OPTIONS}
        />
      </div>

      <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-pr-primary">Preferences</h2>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-pr-primary">Dark Mode</p>
            <p className="text-xs text-pr-tertiary">Switch between light and dark themes.</p>
          </div>
          <Switch checked={theme === "dark"} onChange={() => toggleTheme()} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-pr-primary">Budget Alerts</p>
            <p className="text-xs text-pr-tertiary">Saved preference only — doesn't affect the Dashboard's over-budget banner yet.</p>
          </div>
          <Switch checked={settings.budgetAlertsEnabled} onChange={v => { setBudgetAlertsEnabled(v); setToastMessage("Budget alerts preference saved."); }} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-pr-primary">Weekly Summary</p>
            <p className="text-xs text-pr-tertiary">Preference only — no email is sent yet.</p>
          </div>
          <Switch checked={settings.weeklySummaryEnabled} onChange={v => { setWeeklySummaryEnabled(v); setToastMessage("Weekly summary preference saved."); }} />
        </div>
      </div>

      <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-pr-primary">Export Data</h2>
        <p className="text-xs text-pr-tertiary">Download all your expenses as a CSV file.</p>
        <Button icon={Download} onClick={handleExport} className="self-start">Export CSV</Button>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast tone="success" title={toastMessage} onClose={dismissToast} />
        </div>
      )}
    </div>
  );
}
