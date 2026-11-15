"use client";

import { useState } from "react";
import { toast } from "sonner";
import { KeyRound, Loader2, Pencil } from "lucide-react";
import AppDrawer from "@/shared/components/ui/AppDrawer";
import { changeOwnPassword, updateOwnProfile } from "@/server/actions/profileActions";
import { changePasswordSchema, updateOwnProfileSchema } from "@/lib/validations/profile";

const inputClass =
  "w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500";

function Field({
  id,
  label,
  children,
  hint,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-300 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function DrawerFooter({ formId, saving, label, onCancel }: { formId: string; saving: boolean; label: string; onCancel: () => void }) {
  return (
    <div className="flex gap-2 justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        form={formId}
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition cursor-pointer disabled:opacity-50"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        {label}
      </button>
    </div>
  );
}

interface ProfileFields {
  name: string;
  phone: string;
  emergencyContact: string;
  address: string;
  occupation: string;
}

export function EditProfileDrawer({
  isOpen,
  onClose,
  onSaved,
  initial,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial: ProfileFields;
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof ProfileFields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = updateOwnProfileSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await updateOwnProfile(form);
      if (res.error) {
        setError(res.error);
        return;
      }
      toast.success("Profile updated.");
      onSaved();
      onClose();
    } catch {
      setError("Could not update your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDrawer
      isOpen={isOpen}
      onClose={saving ? () => {} : onClose}
      title="Edit profile"
      subtitle="Rent, role and NID are managed by the mess manager."
      icon={<Pencil className="w-5 h-5" />}
      maxWidth="md"
      footer={<DrawerFooter formId="edit-profile-form" saving={saving} label="Save changes" onCancel={onClose} />}
    >
      <form id="edit-profile-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p role="alert" className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3.5 py-2.5">
            {error}
          </p>
        )}
        <Field id="profile-name" label="Full name *">
          <input id="profile-name" required value={form.name} onChange={set("name")} className={inputClass} autoComplete="name" />
        </Field>
        <Field id="profile-phone" label="Phone" hint="You can also sign in with this number.">
          <input id="profile-phone" type="tel" value={form.phone} onChange={set("phone")} className={inputClass} autoComplete="tel" />
        </Field>
        <Field id="profile-emergency" label="Emergency contact">
          <input id="profile-emergency" value={form.emergencyContact} onChange={set("emergencyContact")} placeholder="Name and phone" className={inputClass} />
        </Field>
        <Field id="profile-occupation" label="Occupation">
          <input id="profile-occupation" value={form.occupation} onChange={set("occupation")} className={inputClass} />
        </Field>
        <Field id="profile-address" label="Permanent address">
          <textarea id="profile-address" rows={3} value={form.address} onChange={set("address")} className={inputClass} autoComplete="street-address" />
        </Field>
      </form>
    </AppDrawer>
  );
}

const emptyPasswords = { currentPassword: "", newPassword: "", confirmPassword: "" };

export function ChangePasswordDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [form, setForm] = useState(emptyPasswords);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof emptyPasswords) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = changePasswordSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await changeOwnPassword(form);
      if (res.error) {
        setError(res.error);
        return;
      }
      toast.success("Password changed.");
      onClose();
    } catch {
      setError("Could not change your password. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppDrawer
      isOpen={isOpen}
      onClose={saving ? () => {} : onClose}
      title="Change password"
      subtitle="Use at least 6 characters."
      icon={<KeyRound className="w-5 h-5" />}
      maxWidth="md"
      footer={<DrawerFooter formId="change-password-form" saving={saving} label="Change password" onCancel={onClose} />}
    >
      <form id="change-password-form" onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p role="alert" className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3.5 py-2.5">
            {error}
          </p>
        )}
        <Field id="current-password" label="Current password *">
          <input id="current-password" type="password" required value={form.currentPassword} onChange={set("currentPassword")} className={inputClass} autoComplete="current-password" />
        </Field>
        <Field id="new-password" label="New password *">
          <input id="new-password" type="password" required minLength={6} value={form.newPassword} onChange={set("newPassword")} className={inputClass} autoComplete="new-password" />
        </Field>
        <Field id="confirm-password" label="Confirm new password *">
          <input id="confirm-password" type="password" required value={form.confirmPassword} onChange={set("confirmPassword")} className={inputClass} autoComplete="new-password" />
        </Field>
      </form>
    </AppDrawer>
  );
}
