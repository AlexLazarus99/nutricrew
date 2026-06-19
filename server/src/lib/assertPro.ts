import { isUserPro } from "../services/userPro.js";

export async function assertUserPro(userId: number): Promise<void> {
  if (!(await isUserPro(userId))) {
    throw new Error("PRO_REQUIRED");
  }
}
