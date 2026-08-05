import { useState, useEffect, useRef } from "react";
import { Loader } from '@googlemaps/js-api-loader';
import { getGoogleMapsApiKey } from "@food/utils/googleMapsApiKey";
import { adminAPI, uploadAPI } from "@food/api";
import { Button } from "@food/components/ui/button";
import { Input } from "@food/components/ui/input";
import { Label } from "@food/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@food/components/ui/card";
import { toast } from "sonner";
const geocodeAddressHelper = (address) => {
  return new Promise((resolve) => {
    if (!address || !window.google || !window.google.maps) return resolve(null);
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address }, (results, status) => {
      if (status === "OK" && results[0] && results[0].geometry) {
        resolve({
          lat: results[0].geometry.location.lat(),
          lng: results[0].geometry.location.lng()
        });
      } else {
        resolve(null);
      }
    });
  });
};

import { User, Mail, Phone, Save, Loader2, Upload, X, Pencil, Eye, EyeOff } from "lucide-react";
const debugLog = (...args) => {}
const debugWarn = (...args) => {}
const debugError = (...args) => {}
const ADMIN_EMAIL_REGEX = /^(?!.*\.\.)([A-Za-z0-9]+[._%+-]?)*[A-Za-z0-9]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}$/
const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/
const NAME_REGEX = /^[A-Za-z]+(?:\s+[A-Za-z]+)*$/

const hasSuspiciousEmailTld = (emailValue) => {
  const email = String(emailValue || "").trim().toLowerCase()
  const domain = email.split("@")[1] || ""
  const tld = domain.split(".").pop() || ""
  if (!tld) return true
  if (/^com+$/i.test(tld) && tld !== "com") return true
  if (/(.)\1{2,}/.test(tld)) return true
  return false
}


export default function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    profileImage: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAdminProfile();
      const adminData = response?.data?.data?.admin || response?.data?.admin;
      
      if (adminData) {
        setProfile(adminData);
        setFormData({
          name: adminData.name || "",
          email: adminData.email || "",
          phone: adminData.phone || "",
          profileImage: adminData.profileImage || "",
          address: adminData.address || "",
          city: adminData.city || "",
          state: adminData.state || "",
          pincode: adminData.pincode || "",
          latitude: adminData.latitude !== undefined && adminData.latitude !== null ? String(adminData.latitude) : "",
          longitude: adminData.longitude !== undefined && adminData.longitude !== null ? String(adminData.longitude) : "",
          locationMode: "map",
        });
        return;
      }
      throw new Error("No admin data in response");
    } catch (error) {
      debugError("Error fetching admin profile:", error);
      // Fallback: show data from localStorage (login) so page still shows real name/email
      try {
        const adminUserStr = localStorage.getItem("admin_user");
        if (adminUserStr) {
          const localAdmin = JSON.parse(adminUserStr);
          const fallback = {
            name: localAdmin.name || "Admin User",
            email: localAdmin.email || "",
            phone: localAdmin.phone || "",
            profileImage: localAdmin.profileImage || "",
            role: localAdmin.role || "admin",
            isActive: localAdmin.isActive !== false,
          };
          setProfile(fallback);
          setFormData({
            name: fallback.name || "",
            email: fallback.email || "",
            phone: fallback.phone || "",
            profileImage: fallback.profileImage || "",
            address: fallback.address || "",
            city: fallback.city || "",
            state: fallback.state || "",
            pincode: fallback.pincode || "",
            latitude: fallback.latitude !== undefined && fallback.latitude !== null ? String(fallback.latitude) : "",
            longitude: fallback.longitude !== undefined && fallback.longitude !== null ? String(fallback.longitude) : "",
            locationMode: "map",
          });
          toast.info("Showing saved profile. Backend disconnected — updates may not persist.");
          return;
        }
      } catch (_) {}
      toast.error(
        error?.response?.data?.message || "Failed to load profile"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload PNG, JPG, JPEG, or WEBP.");
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("File size exceeds 5MB limit.");
      return;
    }

    // Set file and create preview
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetPasswordFields = () => {
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPasswords({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const name = String(formData.name || "").trim();
      if (!name || !NAME_REGEX.test(name)) {
        toast.error("Name should contain only letters and spaces");
        return;
      }

      const email = String(formData.email || "").trim();
      if (!email) {
        toast.error("Email is required");
        return;
      }

      if (!ADMIN_EMAIL_REGEX.test(email) || hasSuspiciousEmailTld(email)) {
        toast.error("Please enter a valid email address");
        return;
      }

      const phone = String(formData.phone || "").trim();
      if (phone && !INDIAN_MOBILE_REGEX.test(phone)) {
        toast.error("Please enter a valid 10-digit Indian mobile number");
        return;
      }

      const currentPassword = String(passwordData.currentPassword || "").trim();
      const newPassword = String(passwordData.newPassword || "").trim();
      const confirmPassword = String(passwordData.confirmPassword || "").trim();
      const wantsPasswordChange =
        !!currentPassword || !!newPassword || !!confirmPassword;

      if (wantsPasswordChange) {
        if (!currentPassword || !newPassword || !confirmPassword) {
          toast.error("Please fill Old, New, and Confirm password fields.");
          return;
        }
        if (newPassword.length < 6) {
          toast.error("New password must be at least 6 characters.");
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error("New password and Confirm password do not match.");
          return;
        }
      }

      setSaving(true);
      let profileImageUrl = formData.profileImage;

      // Upload image if a new file is selected
      if (selectedFile) {
        try {
          setUploading(true);
          const uploadResponse = await uploadAPI.uploadMedia(selectedFile, {
            folder: 'admin-profiles'
          });
          profileImageUrl = uploadResponse?.data?.data?.url || uploadResponse?.data?.url;
          
          if (!profileImageUrl) {
            throw new Error("Failed to get uploaded image URL");
          }
        } catch (uploadError) {
          debugError("Error uploading image:", uploadError);
          toast.error(
            uploadError?.response?.data?.message || "Failed to upload image"
          );
          setUploading(false);
          setSaving(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      // Validate store location coordinates if provided
      let latNum = parseFloat(formData.latitude);
      let lngNum = parseFloat(formData.longitude);
      
      if ((isNaN(latNum) || isNaN(lngNum) || (latNum === 0 && lngNum === 0)) && formData.address) {
        const coords = await geocodeAddressHelper(formData.address);
        if (coords) {
          latNum = coords.lat;
          lngNum = coords.lng;
          setFormData(prev => ({ ...prev, latitude: latNum, longitude: lngNum }));
        }
      }

      if (formData.latitude || formData.longitude || formData.address || formData.city || formData.state || formData.pincode) {
        if (!formData.address || !formData.city || !formData.state || !formData.pincode) {
          toast.error("Complete store address (Address, City, State, Pincode) is required");
          return;
        }
        if (isNaN(latNum) || isNaN(lngNum)) {
          toast.error("Valid store coordinates (Latitude and Longitude) are required");
          return;
        }
        if (latNum < -90 || latNum > 90) {
          toast.error("Latitude must be between -90 and 90 degrees");
          return;
        }
        if (lngNum < -180 || lngNum > 180) {
          toast.error("Longitude must be between -180 and 180 degrees");
          return;
        }
      }

      // Update profile with uploaded image URL
      const response = await adminAPI.updateAdminProfile({
        name,
        email,
        phone: phone || undefined,
        profileImage: profileImageUrl || undefined,
        address: formData.address || "",
        city: formData.city || "",
        state: formData.state || "",
        pincode: formData.pincode || "",
        latitude: latNum ? Number(latNum) : null,
        longitude: lngNum ? Number(lngNum) : null,
      });

      const updatedAdmin = response?.data?.data?.user ?? response?.data?.data?.admin ?? response?.data?.admin;
      
      if (updatedAdmin) {
        setProfile(updatedAdmin);
        setFormData({
          name: updatedAdmin.name || "",
          email: updatedAdmin.email || "",
          phone: updatedAdmin.phone || "",
          profileImage: updatedAdmin.profileImage || "",
          address: updatedAdmin.address || "",
          city: updatedAdmin.city || "",
          state: updatedAdmin.state || "",
          pincode: updatedAdmin.pincode || "",
          latitude: updatedAdmin.latitude !== undefined && updatedAdmin.latitude !== null ? String(updatedAdmin.latitude) : "",
          longitude: updatedAdmin.longitude !== undefined && updatedAdmin.longitude !== null ? String(updatedAdmin.longitude) : "",
          locationMode: "map",
        });
        // Clear selected file and preview
        setSelectedFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Update localStorage with new admin data
        localStorage.setItem('admin_user', JSON.stringify(updatedAdmin));
        // Dispatch event to notify other components
        window.dispatchEvent(new Event('adminAuthChanged'));

        if (wantsPasswordChange) {
          try {
            await adminAPI.changePassword(currentPassword, newPassword);
            resetPasswordFields();
            toast.success("Profile and password updated successfully");
            setIsEditMode(false);
          } catch (passwordError) {
            debugError("Error updating admin password:", passwordError);
            toast.error(
              passwordError?.response?.data?.message || "Profile updated, but password change failed"
            );
            return;
          }
        } else {
          resetPasswordFields();
          toast.success("Profile updated successfully");
          setIsEditMode(false);
        }
      }
    } catch (error) {
      debugError("Error updating profile:", error);
      toast.error(
        error?.response?.data?.message || "Failed to update profile"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStartEditing = () => {
    setFormData({
      name: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      profileImage: profile?.profileImage || "",
      address: profile?.address || "",
      city: profile?.city || "",
      state: profile?.state || "",
      pincode: profile?.pincode || "",
      latitude: profile?.latitude !== undefined && profile?.latitude !== null ? String(profile?.latitude) : "",
      longitude: profile?.longitude !== undefined && profile?.longitude !== null ? String(profile?.longitude) : "",
      locationMode: "map",
    });
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    resetPasswordFields();
    setIsEditMode(true);
  };

  const handleCancelEditing = () => {
    setFormData({
      name: profile?.name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      profileImage: profile?.profileImage || "",
      address: profile?.address || "",
      city: profile?.city || "",
      state: profile?.state || "",
      pincode: profile?.pincode || "",
      latitude: profile?.latitude !== undefined && profile?.latitude !== null ? String(profile?.latitude) : "",
      longitude: profile?.longitude !== undefined && profile?.longitude !== null ? String(profile?.longitude) : "",
      locationMode: "map",
    });
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    resetPasswordFields();
    setIsEditMode(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-neutral-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-neutral-600">Failed to load profile data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Mask email for display
  const maskEmail = (email) => {
    if (!email) return "";
    const [localPart, domain] = email.split("@");
    if (localPart.length <= 2) return email;
    const masked = localPart[0] + "*".repeat(Math.min(localPart.length - 1, 5)) + "@" + domain;
    return masked;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Profile</h1>
        <p className="text-neutral-600 mt-1">Manage your admin profile information</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                {isEditMode ? "Update your profile details below" : "View your admin profile details"}
              </CardDescription>
            </div>
            {!isEditMode ? (
              <Button
                type="button"
                onClick={handleStartEditing}
                className="bg-[#F84E04] text-white hover:bg-[#D94203] font-semibold"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEditing}
                  disabled={saving || uploading}
                  className="h-10 px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="admin-profile-form"
                  disabled={saving || uploading}
                  className="bg-[#F84E04] text-white hover:bg-[#D94203] h-10 px-6 font-semibold"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading image...
                    </>
                  ) : saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form id="admin-profile-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex items-center gap-6 pb-6 border-b border-neutral-200">
              <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden border-2 border-neutral-300">
                {profile.profileImage ? (
                  <img
                    src={profile.profileImage}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-semibold text-neutral-600">
                    {getInitials(profile.name)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-neutral-900">{profile.name}</p>
                <p className="text-xs text-neutral-500 mt-1">{maskEmail(profile.email)}</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Role: <span className="font-medium capitalize">{profile.role || "admin"}</span>
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Full Name
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    handleInputChange(
                      "name",
                      e.target.value.replace(/[^A-Za-z\s]/g, "").replace(/\s{2,}/g, " "),
                    )
                  }
                  placeholder="Enter your full name"
                  required
                  disabled={!isEditMode || saving || uploading}
                  className={`h-11 ${!isEditMode ? "bg-neutral-50 cursor-not-allowed" : ""}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="Enter your email address"
                  required
                  disabled={!isEditMode || saving || uploading}
                  className={`h-11 ${!isEditMode ? "bg-neutral-50 cursor-not-allowed" : ""}`}
                />
                <p className="text-xs text-neutral-500">Email can be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    handleInputChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
                  }
                  maxLength={10}
                  placeholder="Enter phone number (optional)"
                  disabled={!isEditMode || saving || uploading}
                  className={`h-11 ${!isEditMode ? "bg-neutral-50 cursor-not-allowed" : ""}`}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="profileImage">Profile Image</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="profileImage"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleFileSelect}
                  disabled={!isEditMode || saving || uploading}
                  className="hidden"
                />
                {imagePreview || profile.profileImage ? (
                  <div className="relative w-48 h-48 border-2 border-neutral-300 rounded-lg overflow-hidden group">
                    <img
                      src={imagePreview || profile.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                    {isEditMode && (
                      <>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <label
                            htmlFor="profileImage"
                            className="cursor-pointer bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-100 transition-colors"
                          >
                            Change Image
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg z-10"
                          title="Remove image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <label
                    htmlFor="profileImage"
                    className={`flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-neutral-300 rounded-lg transition-colors bg-neutral-50 ${
                      isEditMode ? "cursor-pointer hover:border-neutral-400" : "cursor-not-allowed opacity-70"
                    }`}
                  >
                    <Upload className="w-8 h-8 text-neutral-400 mb-2" />
                    <p className="text-sm text-neutral-600">
                      {isEditMode ? "Click to upload" : "No profile image"}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">PNG, JPG, WEBP (max 5MB)</p>
                  </label>
                )}
                {isEditMode && imagePreview && (
                  <p className="text-xs text-green-600 mt-1">
                    New image selected. Click "Save Changes" to upload.
                  </p>
                )}
                {isEditMode && profile.profileImage && !imagePreview && (
                  <p className="text-xs text-neutral-500 mt-1">
                    Hover over the image to change it
                  </p>
                )}
              </div>

            {/* Store Location Details section */}
            <div className="md:col-span-2 border-t border-neutral-200 pt-6 mt-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Store / Admin Address Location</h3>
                <p className="text-xs text-neutral-500 mt-1">This address serves as the delivery origin for Grocery and Accessories orders.</p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                  <Label className="text-sm font-semibold text-slate-900 dark:text-white">Store Location Details</Label>
                  <div className="flex bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-xs font-semibold">
                    <button
                      type="button"
                      disabled={!isEditMode}
                      onClick={() => setFormData(p => ({ ...p, locationMode: 'map' }))}
                      className={`px-3 py-1 rounded-md transition-colors ${formData.locationMode !== 'manual' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'} ${!isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Option A: Map Picker
                    </button>
                    <button
                      type="button"
                      disabled={!isEditMode}
                      onClick={() => setFormData(p => ({ ...p, locationMode: 'manual' }))}
                      className={`px-3 py-1 rounded-md transition-colors ${formData.locationMode === 'manual' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'} ${!isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      Option B: Manual Address
                    </button>
                  </div>
                </div>

                {isEditMode && formData.locationMode !== 'manual' ? (
                  <MapPicker form={formData} setForm={setFormData} />
                ) : (
                  formData.locationMode !== 'manual' && !isEditMode && (
                    <div className="relative w-full h-64 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50">
                      <StaticMap form={formData} />
                    </div>
                  )
                )}

                {formData.locationMode === 'manual' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Latitude</Label>
                      <Input
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => setFormData(p => ({ ...p, latitude: e.target.value }))}
                        placeholder="e.g. 28.6139"
                        disabled={!isEditMode}
                        className={`h-11 ${!isEditMode ? "bg-neutral-50 cursor-not-allowed" : ""}`}
                      />
                    </div>
                    <div>
                      <Label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Longitude</Label>
                      <Input
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => setFormData(p => ({ ...p, longitude: e.target.value }))}
                        placeholder="e.g. 77.2090"
                        disabled={!isEditMode}
                        className={`h-11 ${!isEditMode ? "bg-neutral-50 cursor-not-allowed" : ""}`}
                      />
                    </div>
                  </div>
                )}

                {/* Coordinates Read-Only view for Option A under Edit Mode */}
                {isEditMode && formData.locationMode !== 'manual' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="block text-xs font-semibold text-slate-500 tracking-wider mb-1">Selected Latitude</Label>
                      <Input
                        type="text"
                        value={formData.latitude}
                        disabled
                        className="h-11 bg-neutral-50 cursor-not-allowed text-neutral-500"
                      />
                    </div>
                    <div>
                      <Label className="block text-xs font-semibold text-slate-500 tracking-wider mb-1">Selected Longitude</Label>
                      <Input
                        type="text"
                        value={formData.longitude}
                        disabled
                        className="h-11 bg-neutral-50 cursor-not-allowed text-neutral-500"
                      />
                    </div>
                  </div>
                )}

                {/* Shared address fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="sm:col-span-2">
                    <Label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Store Address / Landmark</Label>
                    <Input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                      placeholder="Shop No, Building, Area"
                      disabled={!isEditMode}
                      className={`h-11 ${!isEditMode ? "bg-neutral-50 cursor-not-allowed" : ""}`}
                    />
                  </div>
                  <div>
                    <Label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">City</Label>
                    <Input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))}
                      placeholder="City"
                      disabled={!isEditMode}
                      className={`h-11 ${!isEditMode ? "bg-neutral-50 cursor-not-allowed" : ""}`}
                    />
                  </div>
                  <div>
                    <Label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">State</Label>
                    <Input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData(p => ({ ...p, state: e.target.value }))}
                      placeholder="State"
                      disabled={!isEditMode}
                      className={`h-11 ${!isEditMode ? "bg-neutral-50 cursor-not-allowed" : ""}`}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Pincode</Label>
                    <Input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData(p => ({ ...p, pincode: e.target.value }))}
                      placeholder="6-digit Pincode"
                      disabled={!isEditMode}
                      className={`h-11 ${!isEditMode ? "bg-neutral-50 cursor-not-allowed" : ""}`}
                    />
                  </div>
                </div>
              </div>
            </div>

              <div className="space-y-2">
                <Label htmlFor="currentPassword">Old Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPasswords.currentPassword ? "text" : "password"}
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter old password"
                    disabled={!isEditMode || saving || uploading}
                    className={`h-11 pr-11 ${!isEditMode ? "bg-neutral-50 cursor-not-allowed" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        currentPassword: !prev.currentPassword,
                      }))
                    }
                    disabled={!isEditMode || saving || uploading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 disabled:opacity-50"
                    aria-label={showPasswords.currentPassword ? "Hide old password" : "Show old password"}
                  >
                    {showPasswords.currentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords.newPassword ? "text" : "password"}
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter new password"
                    disabled={!isEditMode || saving || uploading}
                    className={`h-11 pr-11 ${!isEditMode ? "bg-neutral-50 cursor-not-allowed" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        newPassword: !prev.newPassword,
                      }))
                    }
                    disabled={!isEditMode || saving || uploading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 disabled:opacity-50"
                    aria-label={showPasswords.newPassword ? "Hide new password" : "Show new password"}
                  >
                    {showPasswords.newPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showPasswords.confirmPassword ? "text" : "password"}
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    placeholder="Confirm new password"
                    disabled={!isEditMode || saving || uploading}
                    className={`h-11 pr-11 ${!isEditMode ? "bg-neutral-50 cursor-not-allowed" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswords((prev) => ({
                        ...prev,
                        confirmPassword: !prev.confirmPassword,
                      }))
                    }
                    disabled={!isEditMode || saving || uploading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 disabled:opacity-50"
                    aria-label={showPasswords.confirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showPasswords.confirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="pt-4 border-t border-neutral-200 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">Account Status</span>
                <span className={`font-medium ${profile.isActive !== false ? "text-green-600" : "text-red-600"}`}>
                  {profile.isActive !== false ? "Active" : "Inactive"}
                </span>
              </div>
              {profile.lastLogin && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Last Login</span>
                  <span className="text-neutral-900">
                    {new Date(profile.lastLogin).toLocaleString()}
                  </span>
                </div>
              )}
              {profile.loginCount !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Total Logins</span>
                  <span className="text-neutral-900">{profile.loginCount}</span>
                </div>
              )}
              {profile.createdAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-600">Member Since</span>
                  <span className="text-neutral-900">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  );
}

const MapPicker = ({ form, setForm }) => {
  const mapContainerRef = useRef(null)
  const autocompleteInputRef = useRef(null)
  const [mapLoading, setMapLoading] = useState(false)
  const mapRef = useRef(null)
  const markerRef = useRef(null)
  const autocompleteRef = useRef(null)
  const [apiKey, setApiKey] = useState("")

  useEffect(() => {
    getGoogleMapsApiKey().then((key) => {
      setApiKey(key || "")
    })
  }, [])

  useEffect(() => {
    if (autocompleteInputRef.current && form.address) {
      autocompleteInputRef.current.value = form.address;
    }
  }, [form.address]);

  useEffect(() => {
    if (!apiKey || !mapContainerRef.current) return
    let isMounted = true
    setMapLoading(true)

    const initializeMap = async () => {
      try {
        const loader = new Loader({
          apiKey: apiKey,
          version: "weekly",
          libraries: ["places"],
        })
        const google = await loader.load()
        if (!isMounted || !mapContainerRef.current) {
          return
        }

        const initialLat = parseFloat(form.latitude)
        const initialLng = parseFloat(form.longitude)
        const hasCoords = !isNaN(initialLat) && !isNaN(initialLng) && (initialLat !== 0 || initialLng !== 0)
        const initialPos = hasCoords ? { lat: initialLat, lng: initialLng } : { lat: 28.6139, lng: 77.2090 }

        const map = new google.maps.Map(mapContainerRef.current, {
          center: initialPos,
          zoom: hasCoords ? 16 : 5,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        })
        mapRef.current = map

        const marker = new google.maps.Marker({
          position: initialPos,
          map: map,
          draggable: true,
          animation: google.maps.Animation.DROP,
        })
        markerRef.current = marker

        // Geocoding Fallback if coordinates are 0,0 or missing but address is present
        if (!hasCoords && form.address) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ address: form.address }, (results, status) => {
            if (status === "OK" && results[0] && results[0].geometry) {
              const pos = results[0].geometry.location;
              map.setCenter(pos);
              map.setZoom(16);
              marker.setPosition(pos);
              setForm(prev => ({
                ...prev,
                latitude: pos.lat(),
                longitude: pos.lng()
              }));
            } else {
            }
          });
        }

        if (autocompleteInputRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
            types: ["geocode", "establishment"],
          })
          autocompleteRef.current = autocomplete

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace()
            if (!place.geometry || !place.geometry.location) return

            const lat = place.geometry.location.lat()
            const lng = place.geometry.location.lng()
            const pos = { lat, lng }

            map.setCenter(pos)
            map.setZoom(16)
            marker.setPosition(pos)

            let streetAddress = place.formatted_address || ""
            let city = ""
            let state = ""
            let pincode = ""

            if (place.address_components) {
              for (const component of place.address_components) {
                const types = component.types
                if (types.includes("locality")) city = component.long_name
                if (types.includes("administrative_area_level_1")) state = component.long_name
                if (types.includes("postal_code")) pincode = component.long_name
              }
            }

            setForm(prev => ({
              ...prev,
              address: streetAddress,
              city,
              state,
              pincode,
              latitude: lat,
              longitude: lng
            }))
          })
        }

        marker.addListener("dragend", () => {
          const pos = marker.getPosition()
          const lat = pos.lat()
          const lng = pos.lng()

          const geocoder = new google.maps.Geocoder()
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results[0]) {
              const place = results[0]
              let streetAddress = place.formatted_address || ""
              let city = ""
              let state = ""
              let pincode = ""

              if (place.address_components) {
                for (const component of place.address_components) {
                  const types = component.types
                  if (types.includes("locality")) city = component.long_name
                  if (types.includes("administrative_area_level_1")) state = component.long_name
                  if (types.includes("postal_code")) pincode = component.long_name
                }
              }

              setForm(prev => ({
                ...prev,
                address: streetAddress,
                city,
                state,
                pincode,
                latitude: lat,
                longitude: lng
              }))
            } else {
              setForm(prev => ({
                ...prev,
                latitude: lat,
                longitude: lng
              }))
            }
          })
        })

        setMapLoading(false)
      } catch (err) {
        setMapLoading(false)
      }
    }

    initializeMap()
    return () => {
      isMounted = false
    }
  }, [apiKey])

  return (
    <div className="space-y-3 col-span-1 sm:col-span-2">
      <div className="relative w-full h-64 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50">
        <div ref={mapContainerRef} className="w-full h-full" />
        {mapLoading && (
          <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
              <span className="text-xs text-slate-600">Loading map...</span>
            </div>
          </div>
        )}
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Search Address on Map</label>
        <input
          ref={autocompleteInputRef}
          type="text"
          className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[#F84E04]"
          placeholder="Search location or establishment..."
        />
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500">Drag the pin to refine the exact location coordinates.</p>
    </div>
  )
}

const StaticMap = ({ form }) => {
  const mapContainerRef = useRef(null)
  const [apiKey, setApiKey] = useState("")

  useEffect(() => {
    getGoogleMapsApiKey().then((key) => {
      setApiKey(key || "")
    })
  }, [])

  useEffect(() => {
    if (!apiKey || !mapContainerRef.current) return
    const initializeMap = async () => {
      try {
        const loader = new Loader({
          apiKey: apiKey,
          version: "weekly",
        })
        const google = await loader.load()
        const lat = parseFloat(form.latitude) || 28.6139
        const lng = parseFloat(form.longitude) || 77.2090
        const pos = { lat, lng }

        const map = new google.maps.Map(mapContainerRef.current, {
          center: pos,
          zoom: form.latitude ? 16 : 5,
          zoomControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "none",
        })

        new google.maps.Marker({
          position: pos,
          map: map,
        })
      } catch (err) {
        console.error("Static map load failed:", err)
      }
    }
    initializeMap()
  }, [apiKey, form.latitude, form.longitude])

  return <div ref={mapContainerRef} className="w-full h-full" />
}