export function openTelegramInvoice(
  createLink: () => Promise<{ invoiceLink: string }>,
  onPaid?: () => void,
): Promise<void> {
  return createLink().then(({ invoiceLink }) => {
    const tg = window.Telegram?.WebApp as
      | { openInvoice?: (url: string, cb?: (status: string) => void) => void }
      | undefined;
    if (tg?.openInvoice) {
      tg.openInvoice(invoiceLink, (status) => {
        if (status === "paid") onPaid?.();
      });
      return;
    }
    window.open(invoiceLink, "_blank");
  });
}
