import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';
import { useFamily } from '@/hooks/useFamily';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Users, Crown, Link, Copy, LogOut, UserPlus, Trash2 } from 'lucide-react';

interface FamilySettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FamilySettingsModal: React.FC<FamilySettingsModalProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const { family, members, isOwner, createFamily, joinFamily, leaveFamily } = useFamily();
  const f = (t as any).family || {};

  const [view, setView] = useState<'main' | 'create' | 'join' | 'confirmLeave'>('main');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!familyName.trim()) return;
    setSaving(true);
    const result = await createFamily(familyName.trim());
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      setCreatedCode(result.invite_code || '');
      toast.success(f.familyCreated || 'Family created! 🎉');
      setView('main');
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setSaving(true);
    const result = await joinFamily(inviteCode.trim());
    setSaving(false);
    if (result.error) {
      toast.error(f.invalidCode || 'Invalid invite code');
    } else {
      toast.success((f.joinedFamily || 'Joined {name}! 🎉').replace('{name}', result.familyName));
      setView('main');
    }
  };

  const handleLeave = async () => {
    await leaveFamily();
    toast.success(f.leftFamily || 'Left family');
    setView('main');
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(f.codeCopied || 'Code copied! 📋');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-nasa text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {f.title || 'Family'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Has family */}
          {family ? (
            <>
              {/* Family info */}
              <div className="p-4 bg-secondary/30 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👨‍👩‍👧</span>
                  <div>
                    <p className="font-nasa text-foreground">{family.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {members.length} {f.members || 'members'}
                    </p>
                  </div>
                </div>

                {/* Invite code */}
                <div className="flex items-center gap-2 bg-background/50 rounded-lg p-2">
                  <Link className="w-4 h-4 text-primary" />
                  <span className="font-mono text-sm text-foreground flex-1">{family.invite_code}</span>
                  <Button variant="ghost" size="sm" onClick={() => copyCode(family.invite_code)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{f.shareCode || 'Share this code with family members'}</p>
              </div>

              {/* Members list */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">{f.membersTitle || 'Members'}</h4>
                {members.map((m) => (
                  <div key={m.user_id} className="flex items-center gap-3 p-2 rounded-lg bg-secondary/20">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={m.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs">
                        {(m.display_name || '?').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground flex-1">{m.display_name || '?'}</span>
                    {m.family_role === 'owner' && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                ))}
              </div>

              {/* Leave button */}
              {view === 'confirmLeave' ? (
                <div className="space-y-2 p-3 bg-destructive/10 rounded-xl">
                  <p className="text-sm text-foreground">
                    {isOwner
                      ? (f.dissolveConfirm || 'This will remove the family for everyone. Are you sure?')
                      : (f.leaveConfirm || 'Are you sure you want to leave?')
                    }
                  </p>
                  <div className="flex gap-2">
                    <Button variant="destructive" className="flex-1" onClick={handleLeave}>
                      {isOwner ? (f.dissolve || 'Dissolve') : (f.leave || 'Leave')}
                    </Button>
                    <Button variant="outline" className="flex-1" onClick={() => setView('main')}>
                      {f.cancel || 'Cancel'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full text-destructive border-destructive/30"
                  onClick={() => setView('confirmLeave')}
                >
                  {isOwner ? (
                    <><Trash2 className="w-4 h-4 mr-2" />{f.dissolveFamily || 'Dissolve family'}</>
                  ) : (
                    <><LogOut className="w-4 h-4 mr-2" />{f.leaveFamily || 'Leave family'}</>
                  )}
                </Button>
              )}
            </>
          ) : (
            <>
              {/* No family - show create/join */}
              {view === 'create' ? (
                <div className="space-y-3">
                  <Input
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    placeholder={f.familyNamePlaceholder || 'Family name'}
                    className="bg-secondary/50"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleCreate} disabled={saving || !familyName.trim()} className="flex-1 font-nasa">
                      {saving ? '...' : (f.create || 'Create')}
                    </Button>
                    <Button variant="outline" onClick={() => setView('main')} className="flex-1">
                      {f.cancel || 'Cancel'}
                    </Button>
                  </div>
                </div>
              ) : view === 'join' ? (
                <div className="space-y-3">
                  <Input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="TYA-XXX"
                    className="bg-secondary/50 font-mono text-center text-lg tracking-wider"
                    maxLength={7}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleJoin} disabled={saving || !inviteCode.trim()} className="flex-1 font-nasa">
                      {saving ? '...' : (f.join || 'Join')}
                    </Button>
                    <Button variant="outline" onClick={() => setView('main')} className="flex-1">
                      {f.cancel || 'Cancel'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {f.description || 'Share your fridge and shopping list with family members.'}
                  </p>
                  <Button
                    className="w-full gap-2 font-nasa"
                    onClick={() => setView('create')}
                  >
                    <Crown className="w-4 h-4" />
                    {f.createFamily || 'Create family'}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 font-exo"
                    onClick={() => setView('join')}
                  >
                    <UserPlus className="w-4 h-4" />
                    {f.joinFamily || 'Join family'}
                  </Button>
                </div>
              )}

              {/* Show created code if just created */}
              {createdCode && (
                <div className="flex items-center gap-2 bg-primary/10 rounded-lg p-3">
                  <span className="font-mono text-lg text-primary">{createdCode}</span>
                  <Button variant="ghost" size="sm" onClick={() => copyCode(createdCode)}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FamilySettingsModal;
