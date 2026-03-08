import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/hooks/useTranslation';
import { useFamily, calculateCalories, type FamilySubMember } from '@/hooks/useFamily';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Users, Crown, Link, Copy, LogOut, UserPlus, Trash2, Edit, Plus } from 'lucide-react';

interface FamilySettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVATAR_EMOJIS = ['👨', '👩', '👦', '👧', '👴', '👵'];
const GENDER_OPTIONS = [
  { value: 'male', emoji: '👦', labelKey: 'boy' },
  { value: 'female', emoji: '👧', labelKey: 'girl' },
];
const ACTIVITY_OPTIONS = ['sedentary', 'moderate', 'active', 'veryActive'];

const AddMemberForm: React.FC<{
  onSave: (member: any) => void;
  onCancel: () => void;
  initial?: Partial<FamilySubMember>;
  t: any;
}> = ({ onSave, onCancel, initial, t }) => {
  const fm = (t as any).familyMembers || {};
  const [name, setName] = useState(initial?.name || '');
  const [emoji, setEmoji] = useState(initial?.avatar_emoji || '👤');
  const [gender, setGender] = useState(initial?.gender || '');
  const [age, setAge] = useState(initial?.age?.toString() || '');
  const [weight, setWeight] = useState(initial?.weight_kg?.toString() || '');
  const [height, setHeight] = useState(initial?.height_cm?.toString() || '');
  const [activity, setActivity] = useState(initial?.activity_level || 'moderate');
  const [allergies, setAllergies] = useState((initial?.allergies || []).join(', '));
  const [dietType, setDietType] = useState(initial?.diet_type || 'omnivore');
  const [saving, setSaving] = useState(false);

  const actLabels: Record<string, string> = {
    sedentary: '🛋 Low', moderate: '🚶 Normal', active: '🏃 Active', veryActive: '🔥 Very active',
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const ageNum = parseInt(age) || null;
    const weightNum = parseFloat(weight) || null;
    const heightNum = parseInt(height) || null;
    const allergiesArr = allergies.split(',').map(a => a.trim()).filter(Boolean);
    const calories = calculateCalories(weightNum, heightNum, ageNum, gender, activity, []);

    await onSave({
      name: name.trim(),
      avatar_emoji: emoji,
      gender,
      age: ageNum,
      weight_kg: weightNum,
      height_cm: heightNum,
      activity_level: activity,
      diet_type: dietType,
      allergies: allergiesArr,
      daily_calories_target: calories,
      is_owner: false,
      user_id: null,
    });
    setSaving(false);
  };

  return (
    <div className="space-y-4 p-1">
      {/* Avatar picker */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{fm.avatar || 'Avatar'}</label>
        <div className="flex gap-2">
          {AVATAR_EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`w-10 h-10 rounded-full text-xl flex items-center justify-center transition-all ${
                emoji === e ? 'bg-primary/20 ring-2 ring-primary' : 'bg-secondary/30 hover:bg-secondary/50'
              }`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{fm.whatName || 'Name'}</label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder={fm.namePlaceholder || 'Name'} />
      </div>

      {/* Gender chips */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{fm.gender || 'Gender'}</label>
        <div className="flex gap-2">
          {GENDER_OPTIONS.map(g => (
            <button
              key={g.value}
              onClick={() => setGender(g.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                gender === g.value ? 'bg-primary text-primary-foreground' : 'bg-secondary/30 text-foreground hover:bg-secondary/50'
              }`}
            >
              {g.emoji} {fm[g.labelKey] || g.value}
            </button>
          ))}
        </div>
      </div>

      {/* Age */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{fm.age || 'Age'}</label>
        <Input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="8" className="w-24" />
      </div>

      {/* Weight & Height (optional) */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{fm.weight || 'Weight (kg)'}</label>
          <Input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="30" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">{fm.height || 'Height (cm)'}</label>
          <Input type="number" value={height} onChange={e => setHeight(e.target.value)} placeholder="130" />
        </div>
      </div>

      {/* Activity */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{fm.activity || 'Activity'}</label>
        <div className="flex flex-wrap gap-1.5">
          {ACTIVITY_OPTIONS.map(a => (
            <button
              key={a}
              onClick={() => setActivity(a)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activity === a ? 'bg-primary text-primary-foreground' : 'bg-secondary/30 text-foreground hover:bg-secondary/50'
              }`}
            >
              {actLabels[a]}
            </button>
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1 block">{fm.allergies || 'Allergies'}</label>
        <Input value={allergies} onChange={e => setAllergies(e.target.value)} placeholder={fm.allergiesPlaceholder || 'nuts, dairy'} />
      </div>

      {/* Calculated calories */}
      {(age || weight) && (
        <div className="p-3 bg-primary/5 rounded-xl text-center">
          <p className="text-xs text-muted-foreground">{fm.calculatedTarget || 'Calculated target'}</p>
          <p className="text-lg font-bold text-primary">
            {calculateCalories(parseFloat(weight) || null, parseInt(height) || null, parseInt(age) || null, gender, activity, [])} {fm.kcal || 'kcal'}
          </p>
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={saving || !name.trim()} className="flex-1">
          {saving ? '...' : ((t as any).common?.save || 'Save')}
        </Button>
        <Button variant="outline" onClick={onCancel} className="flex-1">
          {(t as any).common?.cancel || 'Cancel'}
        </Button>
      </div>
    </div>
  );
};

const FamilySettingsModal: React.FC<FamilySettingsModalProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation();
  const { family, members, subMembers, isOwner, createFamily, joinFamily, leaveFamily, addSubMember, updateSubMember, deleteSubMember } = useFamily();
  const f = (t as any).family || {};
  const fm = (t as any).familyMembers || {};

  const [view, setView] = useState<'main' | 'create' | 'join' | 'confirmLeave' | 'addMember' | 'editMember'>('main');
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [createdCode, setCreatedCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilySubMember | null>(null);
  const [showAddAfterCreate, setShowAddAfterCreate] = useState(false);

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
      setShowAddAfterCreate(true);
      setView('addMember');
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

  const handleAddMember = async (memberData: any) => {
    const result = await addSubMember(memberData);
    if (result.error) {
      toast.error(fm.saveFailed || 'Failed to save');
    } else {
      toast.success(fm.memberAdded || 'Member added ✓');
    }
  };

  const handleUpdateMember = async (memberData: any) => {
    if (!editingMember) return;
    const result = await updateSubMember(editingMember.id, memberData);
    if (result.error) {
      toast.error(fm.saveFailed || 'Failed to save');
    } else {
      toast.success(fm.memberUpdated || 'Updated ✓');
      setEditingMember(null);
      setView('main');
    }
  };

  const handleDeleteMember = async (id: string) => {
    await deleteSubMember(id);
    toast.success(fm.memberDeleted || 'Deleted ✓');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-nasa text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            {f.title || 'Family'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* ADD / EDIT MEMBER */}
          {(view === 'addMember' || view === 'editMember') && (
            <>
              <h3 className="text-sm font-semibold text-foreground">
                {view === 'editMember' ? (fm.editMember || 'Edit member') : (fm.addMember || 'Add family member')}
              </h3>
              <AddMemberForm
                t={t}
                initial={view === 'editMember' ? editingMember || undefined : undefined}
                onSave={view === 'editMember' ? handleUpdateMember : handleAddMember}
                onCancel={() => {
                  setEditingMember(null);
                  setView('main');
                }}
              />
              {view === 'addMember' && (
                <Button variant="outline" className="w-full gap-2" onClick={() => setView('main')}>
                  {fm.done || 'Done'}
                </Button>
              )}
            </>
          )}

          {/* MAIN VIEW - Has family */}
          {view === 'main' && family && (
            <>
              {/* Family info */}
              <div className="p-4 bg-secondary/30 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">👨‍👩‍👧</span>
                  <div>
                    <p className="font-nasa text-foreground">{family.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {subMembers.length} {f.members || 'members'}
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

              {/* Sub-members list */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-foreground">{f.membersTitle || 'Members'}</h4>
                {subMembers.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/20">
                    <span className="text-2xl">{m.avatar_emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.age ? `${m.age} ${fm.years || 'y/o'}` : ''} 
                        {m.daily_calories_target ? ` · ${m.daily_calories_target} ${fm.kcal || 'kcal'}` : ''}
                      </p>
                    </div>
                    {m.is_owner && <Crown className="w-4 h-4 text-yellow-500" />}
                    {!m.is_owner && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditingMember(m); setView('editMember'); }}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(m.id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Add member button */}
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => setView('addMember')}
                >
                  <Plus className="w-4 h-4" />
                  {fm.addAnother || 'Add family member'}
                </Button>
              </div>

              {/* Leave button */}
              {view === 'main' && (
                <>
                  {view === 'main' && (
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
              )}
            </>
          )}

          {/* Confirm leave */}
          {view === 'confirmLeave' && (
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
          )}

          {/* No family */}
          {view === 'main' && !family && (
            <>
              {view === 'main' && (
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

          {/* Create form */}
          {view === 'create' && (
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
          )}

          {/* Join form */}
          {view === 'join' && (
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FamilySettingsModal;
