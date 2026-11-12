// What a person is called in the product. Business accounts show their
// business name; everyone else shows their personal name.
export type Named = { name: string; businessName?: string | null };

export const displayName = (user: Named) =>
  user.businessName?.trim() || user.name;
