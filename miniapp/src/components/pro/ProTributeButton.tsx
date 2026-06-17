import type { ReactNode } from "react";
import { useMe } from "../../hooks/useMe";
import { openTributePro } from "../../lib/openTributePro";
import { resolveTributeProUrls } from "../../lib/tributeProUrls";
import { ProSubscribeButton } from "./ProSubscribeButton";

type Size = "default" | "compact" | "pill";

type Props = {
  children: ReactNode;
  size?: Size;
  source?: string;
  className?: string;
  url?: string;
  urlIndex?: number;
};

export function ProTributeButton({
  children,
  size = "default",
  source,
  className,
  url,
  urlIndex = 0,
}: Props) {
  const { me } = useMe();
  const urls = resolveTributeProUrls(me.tributeProUrls ?? me.tributeProUrl);
  const target = url ?? urls[urlIndex] ?? urls[0];

  return (
    <ProSubscribeButton
      size={size}
      className={className}
      onClick={() => openTributePro(target, source)}
    >
      {children}
    </ProSubscribeButton>
  );
}
