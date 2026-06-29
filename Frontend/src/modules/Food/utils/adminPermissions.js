export const FEATURE_SETTINGS_OWNER_EMAIL = "badeadmin@gmail.com"

export function canAccessFeatureSettings(adminUser) {
  const type = String(adminUser?.adminType || "").trim().toLowerCase()
  if (type === "super_admin" || type === "admin") return true
  const email = String(adminUser?.email || "").trim().toLowerCase()
  return email === FEATURE_SETTINGS_OWNER_EMAIL || email === "admin@gmail.com"
}

export function canAccessSuperPowers(adminUser) {
  const type = String(adminUser?.adminType || "").trim().toLowerCase()
  if (type === "super_admin" || type === "admin") return true
  const email = String(adminUser?.email || "").trim().toLowerCase()
  return email === FEATURE_SETTINGS_OWNER_EMAIL || email === "admin@gmail.com"
}
