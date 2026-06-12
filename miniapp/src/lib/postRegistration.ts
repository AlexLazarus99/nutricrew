const STORAGE_KEY = "nutricrew_post_registration_offer";

export function markPostRegistrationOfferPending(): void {
  sessionStorage.setItem(STORAGE_KEY, "1");
}

export function clearPostRegistrationOfferPending(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function isPostRegistrationOfferPending(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) === "1";
}

/** Show wellness guide offer only after profile + at least 2 logged meals. */
export function shouldShowPostRegistrationOffer(
  profileComplete: boolean,
  mealLogCount: number,
): boolean {
  return profileComplete && mealLogCount >= 2 && isPostRegistrationOfferPending();
}

export function maybeScheduleGuideOffer(mealLogCount: number, profileComplete: boolean): void {
  if (profileComplete && mealLogCount >= 2) {
    markPostRegistrationOfferPending();
  }
}
