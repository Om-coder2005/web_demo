-- Machine passwords must never be stored in plaintext. The owner receives a
-- newly generated password only at rotation time (and by their verified email).
ALTER TABLE "MachineCredential"
  ADD COLUMN "passwordLastRotatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "MachineCredential"
  DROP COLUMN "plainPassword";
