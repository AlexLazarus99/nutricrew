import { TeamChat } from "../components/chat/TeamChat";
import { useMe } from "../hooks/useMe";

export function ChatPage() {
  const { me } = useMe();

  return (
    <section className="stack chat-page">
      <TeamChat hasTeam={Boolean(me.teamId)} />
    </section>
  );
}
