import { useEffect } from 'react';

import { useAuth } from '@/features/auth/store';
import { useAvatarChoice } from '@/features/auth/avatar-choice';

import { Avatar, type AvatarSize } from './avatar';

/** The signed-in member's avatar: their pick, their photograph, or a default. */
export function MemberAvatar({ size = 'md' }: { size?: AvatarSize }) {
  const member = useAuth((state) => state.member);
  const choice = useAvatarChoice((state) => state.choice);
  const hydrate = useAvatarChoice((state) => state.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!member) return null;

  return <Avatar name={member.name} uri={member.avatar_url} choice={choice} size={size} />;
}
