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

export function shouldShowPostRegistrationOffer(profileComplete: boolean): boolean {
  return profileComplete && isPostRegistrationOfferPending();
}
