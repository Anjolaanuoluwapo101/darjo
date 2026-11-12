-- Business accounts (PayPal sandbox businesses) show their business name in the UI.
ALTER TABLE "User" ADD COLUMN "businessName" TEXT;
