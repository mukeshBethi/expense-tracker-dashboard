import { Download } from "lucide-react";
import Input from "../components/ui/Input.jsx";
import Select from "../components/ui/Select.jsx";
import Switch from "../components/ui/Switch.jsx";
import Button from "../components/ui/Button.jsx";

const CURRENCY_OPTIONS = [
  { value: "$", label: "$ USD" },
  { value: "€", label: "€ EUR" },
  { value: "£", label: "£ GBP" },
  { value: "₹", label: "₹ INR" },
];

export default function SettingsPage({ state, theme, toggleTheme, setCurrency, setDisplayName, setBudgetAlertsEnabled, setWeeklySummaryEnabled, handleExport }) {
  const { settings } = state;

  return (
    <div className="flex flex-col gap-6 p-6 lg:p-8 max-w-2xl">
      <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-pr-primary">Profile</h2>
        <Input
          label="Display Name" placeholder="Your name" maxLength={60}
          defaultValue={settings.displayName || ""}
          onBlur={e => setDisplayName(e.target.value.trim())}
        />
        <Select
          label="Currency"
          value={settings.currency}
          onChange={e => setCurrency(e.target.value)}
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
          <Switch checked={settings.budgetAlertsEnabled} onChange={setBudgetAlertsEnabled} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-pr-primary">Weekly Summary</p>
            <p className="text-xs text-pr-tertiary">Preference only — no email is sent yet.</p>
          </div>
          <Switch checked={settings.weeklySummaryEnabled} onChange={setWeeklySummaryEnabled} />
        </div>
      </div>

      <div className="bg-pr-card shadow-pr-sm rounded-pr-card p-5 flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-pr-primary">Export Data</h2>
        <p className="text-xs text-pr-tertiary">Download all your expenses as a CSV file.</p>
        <Button icon={Download} onClick={handleExport} className="self-start">Export CSV</Button>
      </div>
    </div>
  );
}
