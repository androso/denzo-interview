import { z } from "zod";

const clerkEmailSchema = z.looseObject({
  id: z.string(),
  email_address: z.string(),
});

const clerkUserSchema = z.looseObject({
  id: z.string(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  username: z.string().nullable().optional(),
  primary_email_address_id: z.string().nullable().optional(),
  email_addresses: z.array(clerkEmailSchema).optional(),
  phone_numbers: z.array(z.looseObject({})).optional(),
});

type ClerkEmail = {
  id: string;
  email_address: string;
};

type ParsedClerkUser = {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  primary_email_address_id?: string | null;
  email_addresses?: ClerkEmail[];
  phone_numbers?: Array<Record<string, unknown>>;
};

export type ClerkProfile = Omit<ParsedClerkUser, "phone_numbers"> & {
  phone_numbers?: Array<Record<string, unknown>>;
};

export type UserDto = {
  name: string;
};

export type StoredUser = {
  id: string;
  name: string;
  email: string | null;
  profile: ClerkProfile;
};

export function clerkUserRecord(raw: unknown): StoredUser {
  const parsed = clerkUserSchema.parse(raw) as ParsedClerkUser;
  const profile: ClerkProfile = {
    ...parsed,
    phone_numbers: parsed.phone_numbers?.map((phone) =>
      Object.fromEntries(
        Object.entries(phone).filter(([key]) => key !== "backup_codes"),
      ),
    ),
  };

  return {
    id: profile.id,
    name: displayName(profile),
    email: primaryEmail(profile),
    profile,
  };
}

function displayName(profile: ClerkProfile): string {
  const fullName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ");
  return fullName || profile.username || primaryEmail(profile) || "User";
}

function primaryEmail(profile: ClerkProfile): string | null {
  const emails = profile.email_addresses ?? [];
  const primary = emails.find(
    (email) => email.id === profile.primary_email_address_id,
  );
  return primary?.email_address ?? emails[0]?.email_address ?? null;
}
