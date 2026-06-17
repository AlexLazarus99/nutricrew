import type { ReactNode } from "react";
import { useMe } from "../../hooks/useMe";
import { openTributePro } from "../../lib/openTributePro";
import { ProSubscribeButton } from "./ProSubscribeButton";

type Size = "default" | "compact" | "pill";

type Props = {
  children: ReactNode;
  size?: Size;
  source?: string;
  className?: string;
};

export function ProTributeButton({ children, size = "default", source, className }: Props) {
  const { me } = useMe();

  return (
    <ProSubscribeButton
      size={size}
      className={className}
      onClick={() => openTributePro(me.tributeProUrl, source)}
    >
      {children}
    </ProSubscribeButton>
  );
}
