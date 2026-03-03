
-- Remove old health tracker tables
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.life_events CASCADE;

-- Update profiles table (add kitchen fields)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS subscription_plan text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS trial_end timestamptz DEFAULT (now() + interval '7 days'),
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- User goals & preferences
CREATE TABLE IF NOT EXISTS public.user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  goals text[] DEFAULT '{}',
  diet_type text DEFAULT 'omnivore',
  allergies text[] DEFAULT '{}',
  disliked_foods text[] DEFAULT '{}',
  household_size int DEFAULT 1,
  monthly_budget decimal(10,2),
  weight_kg decimal(5,2),
  height_cm int,
  age int,
  activity_level text DEFAULT 'moderate',
  daily_calories_target int DEFAULT 2000,
  stores text[] DEFAULT '{}',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Inventory
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  category text,
  quantity decimal(10,2) DEFAULT 1,
  unit text DEFAULT 'pcs',
  storage_location text DEFAULT 'fridge',
  expires_at date,
  price_per_unit decimal(10,2),
  added_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Recipes
CREATE TABLE IF NOT EXISTS public.recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  ingredients jsonb,
  instructions text[],
  nutrition jsonb,
  prep_time int,
  estimated_cost decimal(10,2),
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Meal diary
CREATE TABLE IF NOT EXISTS public.meal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  meal_type text,
  recipe_id uuid REFERENCES public.recipes(id),
  custom_name text,
  total_calories int,
  total_protein decimal(5,2),
  total_fat decimal(5,2),
  total_carbs decimal(5,2),
  created_at timestamptz DEFAULT now()
);

-- Shopping list
CREATE TABLE IF NOT EXISTS public.shopping_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  quantity decimal(10,2),
  unit text,
  category text,
  estimated_price decimal(10,2),
  is_purchased boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Savings log
CREATE TABLE IF NOT EXISTS public.savings_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text,
  amount decimal(10,2),
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_log ENABLE ROW LEVEL SECURITY;

-- RLS policies (using auth.uid() directly — user_id stores auth user id)
CREATE POLICY "own_goals_select" ON public.user_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_goals_insert" ON public.user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_goals_update" ON public.user_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_goals_delete" ON public.user_goals FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own_inventory_select" ON public.inventory_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_inventory_insert" ON public.inventory_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_inventory_update" ON public.inventory_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_inventory_delete" ON public.inventory_items FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own_recipes_select" ON public.recipes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_recipes_insert" ON public.recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_recipes_update" ON public.recipes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_recipes_delete" ON public.recipes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own_diary_select" ON public.meal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_diary_insert" ON public.meal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_diary_update" ON public.meal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_diary_delete" ON public.meal_entries FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own_shopping_select" ON public.shopping_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_shopping_insert" ON public.shopping_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_shopping_update" ON public.shopping_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_shopping_delete" ON public.shopping_items FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "own_savings_select" ON public.savings_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own_savings_insert" ON public.savings_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_savings_update" ON public.savings_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own_savings_delete" ON public.savings_log FOR DELETE USING (auth.uid() = user_id);
