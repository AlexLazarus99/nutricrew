/** True after DB migrations + seed; API routes except /ping and /health wait for this. */
export let apiReady = false;

export function setApiReady(ready: boolean): void {
  apiReady = ready;
}
