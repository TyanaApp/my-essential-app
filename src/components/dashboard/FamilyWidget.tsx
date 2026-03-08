import React from 'react';
import { useFamily } from '@/hooks/useFamily';
import { useTranslation } from '@/hooks/useTranslation';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const FamilyWidget: React.FC = () => {
  const { family, members, familyMode } = useFamily();
  const { t } = useTranslation();
  const f = (t as any).family || {};

  if (!familyMode || !family) return null;

  const displayMembers = members.slice(0, 4);
  const extraCount = members.length > 4 ? members.length - 4 : 0;

  return (
    <div
      className="p-4 rounded-2xl flex items-center gap-3"
      style={{ backgroundColor: 'white', boxShadow: '0 2px 16px rgba(124,58,237,0.08)', borderRadius: '20px' }}
    >
      <span className="text-2xl">👨‍👩‍👧</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: '#1E1B4B' }}>
          {f.familyLabel || 'Family'}: {family.name}
        </p>
        <p className="text-xs" style={{ color: '#9CA3AF' }}>
          {members.length} {f.members || 'members'}
        </p>
      </div>
      <div className="flex -space-x-2">
        {displayMembers.map((m) => (
          <Avatar key={m.user_id} className="w-7 h-7 border-2 border-white">
            <AvatarImage src={m.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
              {(m.display_name || '?').charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
        {extraCount > 0 && (
          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center border-2 border-white">
            +{extraCount}
          </div>
        )}
      </div>
    </div>
  );
};

export default FamilyWidget;
