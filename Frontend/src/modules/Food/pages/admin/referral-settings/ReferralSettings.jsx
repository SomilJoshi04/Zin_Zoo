import { useEffect, useState } from "react"
import { Save, Loader2, Gift } from "lucide-react"
import { Button } from "@food/components/ui/button"
import { adminAPI } from "@food/api"
import { toast } from "sonner"

const debugError = (...args) => {}

export default function ReferralSettings() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    referralRewardUser: "",
    referralRewardDelivery: "",
    referralLimitUser: "",
    referralLimitDelivery: "",
    isActive: true,
  })

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await adminAPI.getReferralSettings()
      const s = res?.data?.data?.referralSettings
      if (res?.data?.success && s) {
        setSettings({
          referralRewardUser: s.referralRewardUser ?? "",
          referralRewardDelivery: s.referralRewardDelivery ?? "",
          referralLimitUser: s.referralLimitUser ?? "",
          referralLimitDelivery: s.referralLimitDelivery ?? "",
          isActive: s.isActive !== false,
        })
      } else {
        setSettings({
          referralRewardUser: "",
          referralRewardDelivery: "",
          referralLimitUser: "",
          referralLimitDelivery: "",
          isActive: true,
        })
      }
    } catch (e) {
      debugError("Error fetching referral settings:", e)
      toast.error("Failed to load referral settings")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async () => {
    try {
      setSaving(true)
      const body = {
        referralRewardUser: settings.referralRewardUser === "" ? 0 : Number(settings.referralRewardUser),
        referralRewardDelivery: settings.referralRewardDelivery === "" ? 0 : Number(settings.referralRewardDelivery),
        referralLimitUser: settings.referralLimitUser === "" ? 0 : Number(settings.referralLimitUser),
        referralLimitDelivery: settings.referralLimitDelivery === "" ? 0 : Number(settings.referralLimitDelivery),
        isActive: Boolean(settings.isActive),
      }
      const res = await adminAPI.createOrUpdateReferralSettings(body)
      if (res?.data?.success) {
        toast.success("Referral settings saved successfully")
        const saved = res?.data?.data?.referralSettings
        if (saved) {
          setSettings({
            referralRewardUser: saved.referralRewardUser ?? "",
            referralRewardDelivery: saved.referralRewardDelivery ?? "",
            referralLimitUser: saved.referralLimitUser ?? "",
            referralLimitDelivery: saved.referralLimitDelivery ?? "",
            isActive: saved.isActive !== false,
          })
        }
      } else {
        toast.error(res?.data?.message || "Failed to save referral settings")
      }
    } catch (e) {
      debugError("Error saving referral settings:", e)
      toast.error(e?.response?.data?.message || "Failed to save referral settings")
    } finally {
      setSaving(false)
    }
  }

  const onChange = (key) => (e) => {
    const v = String(e.target.value ?? "")
      .replace(/[^\d.]/g, "")
      .replace(/^0+(\d)/, "$1")
    setSettings((prev) => ({ ...prev, [key]: v }))
  }

  return (
    <div className="p-4 lg:p-6 bg-slate-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Referral Settings</h1>
        </div>
        <p className="text-sm text-slate-600">
          Configure referral reward amounts and maximum credits per referrer.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Configuration</h2>
              <p className="text-sm text-slate-500 mt-1">
                These values apply instantly to new referrals.
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
            </div>
          ) : (
            <div className="max-w-xl space-y-4">
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Referral Program Status</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Enable or disable all referral rewards globally.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.isActive}
                    onChange={(e) => setSettings((prev) => ({ ...prev, isActive: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                </label>
              </div>

              <div className="border border-slate-200 rounded-xl p-4">
                <h3 className="font-semibold text-slate-900 mb-3">User Referral Rewards</h3>
                <label className="block text-sm text-slate-600 mb-1">Reward amount (₹)</label>
                <input
                  value={settings.referralRewardUser}
                  onChange={onChange("referralRewardUser")}
                  inputMode="numeric"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-orange-500"
                  placeholder="e.g. 50"
                />
                <label className="block text-sm text-slate-600 mb-1 mt-3">Max credits per referrer</label>
                <input
                  value={settings.referralLimitUser}
                  onChange={onChange("referralLimitUser")}
                  inputMode="numeric"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-orange-500"
                  placeholder="e.g. 10"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

