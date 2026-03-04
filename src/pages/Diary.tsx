import { usePageTitle } from '@/hooks/usePageTitle';

const Diary = () => {
  usePageTitle('Diary');
  return (
    <div className="min-h-screen p-6 pb-24">
      <h1 className="text-2xl font-bold text-foreground mb-4">Diary</h1>
      <p className="text-muted-foreground">Daily kitchen operations log</p>
    </div>
  );
};

export default Diary;
