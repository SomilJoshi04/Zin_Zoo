import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Share2, Users, Wallet, CircleCheck, Clock3, CircleX, Copy, Check } from "lucide-react";
import AnimatedPage from "@food/components/user/AnimatedPage";
import { Button } from "@food/components/ui/button";
import { Card, CardContent } from "@food/components/ui/card";
import { useCompanyName } from "@food/hooks/useCompanyName";
import { useProfile } from "@food/context/ProfileContext";
import { toast } from "sonner";
import { userAPI } from "@food/api";

const statusMeta = {
  credited: {
    label: "Credited",
    icon: CircleCheck,
    className: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300",
  },
  pending: {
    label: "Pending",
    icon: Clock3,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  },
  rejected: {
    label: "Rejected",
    icon: CircleX,
    className: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300",
  },
};

export default function ReferEarn() {
  const { userProfile } = useProfile();
  const companyName = useCompanyName() || "ZinZooX";
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    referralCode: "",
    referralCount: 0,
    totalReferralEarnings: 0,
    rewardAmount: 0,
    totalInvited: 0,
    creditedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
  });
  const [invitedFriends, setInvitedFriends] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        const res = await userAPI.getReferralDetails();
        const nextStats = res?.data?.data?.stats || {};
        const nextInvited = res?.data?.data?.invitedFriends || [];
        if (!cancelled) {
          setStats({
            referralCode: String(nextStats.referralCode || userProfile?.referralCode || "").toUpperCase(),
            referralCount: Number(nextStats.referralCount) || 0,
            totalReferralEarnings: Number(nextStats.totalReferralEarnings) || 0,
            rewardAmount: Number(nextStats.rewardAmount) || 0,
            totalInvited: Number(nextStats.totalInvited) || 0,
            creditedCount: Number(nextStats.creditedCount) || 0,
            pendingCount: Number(nextStats.pendingCount) || 0,
            rejectedCount: Number(nextStats.rejectedCount) || 0,
          });
          setInvitedFriends(Array.isArray(nextInvited) ? nextInvited : []);
        }
      } catch (error) {
        if (!cancelled) {
          setStats((prev) => ({
            ...prev,
            referralCode: String(userProfile?.referralCode || "").toUpperCase()
          }));
          setInvitedFriends([]);
          toast.error("Failed to load referral details");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [userProfile?.referralCode]);

  const activeReferralCode = stats.referralCode || String(userProfile?.referralCode || "").toUpperCase();

  const shareMessage = useMemo(() => {
    return `🎉 Join me on ${companyName}!\n\nOrder your favorite food easily and enjoy a great food experience with ${companyName} 🍔🍕🛍️\n\nDownload the ${companyName} app and use my referral code during signup:\n\n👉 Referral Code: ${activeReferralCode}\n\nJoin ${companyName} today! ❤️`;
  }, [companyName, activeReferralCode]);

  const handleCopyCode = async () => {
    if (!activeReferralCode) {
      toast.error("Referral code unavailable");
      return;
    }
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(activeReferralCode);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = activeReferralCode;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      toast.success("Referral code copied to clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const handleShare = async () => {
    if (!activeReferralCode) {
      toast.error("Referral code unavailable");
      return;
    }
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${companyName} Referral`,
          text: shareMessage,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareMessage);
        toast.success("Referral message copied to clipboard!");
      }

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      if (error?.name !== "AbortError") {
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }
    }
  };

  return (
    <AnimatedPage className="min-h-screen bg-[#f5f5f5] dark:bg-[#0a0a0a]">
      <div className="max-w-md md:max-w-3xl lg:max-w-5xl mx-auto px-4 py-4 pb-24">
        <div className="flex items-center gap-3 mb-5">
          <Link to="/food/user/profile">
            <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
              <ArrowLeft className="h-5 w-5 text-black dark:text-white" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold text-black dark:text-white">Refer & Earn</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Share and Stats */}
          <div className="space-y-4">
            <Card className="bg-white dark:bg-[#1a1a1a] rounded-2xl border-0 dark:border-gray-800 shadow-sm overflow-hidden">
              <CardContent className="p-5">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Invite your friends to {companyName} and earn rewards!
                </p>
                
                {/* Referral Code Box */}
                <div className="mt-4 p-4 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                      Your Referral Code
                    </p>
                    <p className="text-2xl font-black tracking-widest text-gray-900 dark:text-white mt-0.5">
                      {activeReferralCode || "..."}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCopyCode}
                    disabled={!activeReferralCode}
                    className="h-9 px-3 rounded-lg border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400 hover:bg-orange-100/50 flex items-center gap-1.5 font-bold"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    <span>{copied ? "Copied" : "Copy Code"}</span>
                  </Button>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Reward per new user</p>
                    <p className="text-lg font-bold text-[#F84E04]">{"\u20B9"}{stats.rewardAmount}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">Referral earnings</p>
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      {"\u20B9"}{stats.totalReferralEarnings}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleShare}
                  disabled={!activeReferralCode}
                  className="w-full mt-4 h-12 rounded-xl bg-[#FF5E00] hover:bg-[#e05300] text-white font-bold shadow-md shadow-orange-500/20"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Referral
                </Button>
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-2">
              <Card className="border-0 shadow-sm bg-white dark:bg-[#1a1a1a]">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[11px] font-semibold">
                    <Users className="h-3.5 w-3.5" />
                    Total Invites
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.totalInvited}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-white dark:bg-[#1a1a1a]">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[11px] font-semibold">
                    <CircleCheck className="h-3.5 w-3.5" />
                    Successful
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{stats.creditedCount}</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-white dark:bg-[#1a1a1a]">
                <CardContent className="p-3">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[11px] font-semibold">
                    <Wallet className="h-3.5 w-3.5" />
                    Total Earned
                  </div>
                  <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">{"\u20B9"}{stats.totalReferralEarnings}</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right Column: Status Tracker */}
          <div>
            <Card className="bg-white dark:bg-[#1a1a1a] rounded-2xl border-0 dark:border-gray-800 shadow-sm h-full">
              <CardContent className="p-4">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Referral History & Status</h2>

                {loading ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">Loading referral records...</p>
                ) : invitedFriends.length === 0 ? (
                  <div className="py-10 text-center">
                    <Users className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      No referrals yet
                    </p>
                    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
                      Share your referral code with friends and start earning rewards when they register!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                    {invitedFriends.map((item) => {
                      const meta = statusMeta[item?.status] || statusMeta.pending;
                      const StatusIcon = meta.icon;
                      const invitedDate = item?.invitedAt ? new Date(item.invitedAt) : null;
                      const dateText =
                        invitedDate && !Number.isNaN(invitedDate.getTime())
                          ? invitedDate.toLocaleDateString()
                          : "-";

                      return (
                        <div
                          key={item?.id || item?.refereeId}
                          className="rounded-xl border border-gray-100 dark:border-gray-800/80 p-3 bg-gray-50/50 dark:bg-gray-900/30"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {item?.name || "Friend"}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {item?.phone || "Phone hidden"}
                              </p>
                              <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Joined on {dateText}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span
                                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${meta.className}`}
                              >
                                <StatusIcon className="h-3 w-3" />
                                {meta.label}
                              </span>
                              <p className="text-xs font-semibold mt-1.5 text-gray-800 dark:text-gray-200">
                                Reward: {"\u20B9"}{Number(item?.earnedAmount) || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
}
