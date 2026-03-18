export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      calorie_history: {
        Row: {
          adjustment: number
          avg_last_7_days: number | null
          base_tdee: number
          created_at: string
          date: string
          id: string
          target: number
          user_id: string
        }
        Insert: {
          adjustment?: number
          avg_last_7_days?: number | null
          base_tdee: number
          created_at?: string
          date: string
          id?: string
          target: number
          user_id: string
        }
        Update: {
          adjustment?: number
          avg_last_7_days?: number | null
          base_tdee?: number
          created_at?: string
          date?: string
          id?: string
          target?: number
          user_id?: string
        }
        Relationships: []
      }
      families: {
        Row: {
          created_at: string
          id: string
          invite_code: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code: string
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      family_members: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string[] | null
          avatar_emoji: string
          created_at: string
          daily_calories_target: number | null
          diet_type: string | null
          family_id: string
          gender: string | null
          goals: string[] | null
          height_cm: number | null
          id: string
          is_owner: boolean
          name: string
          user_id: string | null
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          avatar_emoji?: string
          created_at?: string
          daily_calories_target?: number | null
          diet_type?: string | null
          family_id: string
          gender?: string | null
          goals?: string[] | null
          height_cm?: number | null
          id?: string
          is_owner?: boolean
          name: string
          user_id?: string | null
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          avatar_emoji?: string
          created_at?: string
          daily_calories_target?: number | null
          diet_type?: string | null
          family_id?: string
          gender?: string | null
          goals?: string[] | null
          height_cm?: number | null
          id?: string
          is_owner?: boolean
          name?: string
          user_id?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string | null
          id: string
          importance_rating: number | null
          rating: number | null
          suggestion: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          importance_rating?: number | null
          rating?: number | null
          suggestion?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          importance_rating?: number | null
          rating?: number | null
          suggestion?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          added_at: string | null
          category: string | null
          consumption_rate: string | null
          expires_at: string | null
          id: string
          is_opened: boolean | null
          name: string
          opened_at: string | null
          price_per_unit: number | null
          quantity: number | null
          storage_location: string | null
          tracking_mode: string | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          category?: string | null
          consumption_rate?: string | null
          expires_at?: string | null
          id?: string
          is_opened?: boolean | null
          name: string
          opened_at?: string | null
          price_per_unit?: number | null
          quantity?: number | null
          storage_location?: string | null
          tracking_mode?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          category?: string | null
          consumption_rate?: string | null
          expires_at?: string | null
          id?: string
          is_opened?: boolean | null
          name?: string
          opened_at?: string | null
          price_per_unit?: number | null
          quantity?: number | null
          storage_location?: string | null
          tracking_mode?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meal_entries: {
        Row: {
          created_at: string | null
          custom_name: string | null
          date: string
          id: string
          meal_type: string | null
          recipe_id: string | null
          total_calories: number | null
          total_carbs: number | null
          total_fat: number | null
          total_protein: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          custom_name?: string | null
          date: string
          id?: string
          meal_type?: string | null
          recipe_id?: string | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          custom_name?: string | null
          date?: string
          id?: string
          meal_type?: string | null
          recipe_id?: string | null
          total_calories?: number | null
          total_carbs?: number | null
          total_fat?: number | null
          total_protein?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_entries_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          created_at: string
          generated_at: string
          id: string
          plan_data: Json
          status: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          created_at?: string
          generated_at?: string
          id?: string
          plan_data?: Json
          status?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          created_at?: string
          generated_at?: string
          id?: string
          plan_data?: Json
          status?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
      product_price_history: {
        Row: {
          created_at: string
          currency: string
          id: string
          price: number
          price_per_unit: number
          product_name: string
          quantity: number
          store_name: string | null
          unit: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          price: number
          price_per_unit: number
          product_name: string
          quantity?: number
          store_name?: string | null
          unit?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          price?: number
          price_per_unit?: number
          product_name?: string
          quantity?: number
          store_name?: string | null
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          barcode_scans_used: number | null
          bio: string | null
          birth_date: string | null
          bonus_scans: number | null
          city: string | null
          created_at: string
          currency: string | null
          display_name: string | null
          family_id: string | null
          family_role: string | null
          fridge_scans_used: number | null
          gender: string | null
          id: string
          is_founding_member: boolean | null
          monthly_fridge_scans: number | null
          monthly_receipt_scans: number | null
          monthly_reset_date: string | null
          onboarding_completed: boolean | null
          store_integration_waitlist: boolean | null
          streak_badges: string[] | null
          streak_current: number | null
          streak_last_activity: string | null
          streak_longest: number | null
          stripe_customer_id: string | null
          subscription_plan: string | null
          subscription_status: string | null
          trial_end: string | null
          trial_started_at: string | null
          trial_used: boolean | null
          updated_at: string
          user_id: string
          user_number: number | null
          weekly_report_enabled: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          barcode_scans_used?: number | null
          bio?: string | null
          birth_date?: string | null
          bonus_scans?: number | null
          city?: string | null
          created_at?: string
          currency?: string | null
          display_name?: string | null
          family_id?: string | null
          family_role?: string | null
          fridge_scans_used?: number | null
          gender?: string | null
          id?: string
          is_founding_member?: boolean | null
          monthly_fridge_scans?: number | null
          monthly_receipt_scans?: number | null
          monthly_reset_date?: string | null
          onboarding_completed?: boolean | null
          store_integration_waitlist?: boolean | null
          streak_badges?: string[] | null
          streak_current?: number | null
          streak_last_activity?: string | null
          streak_longest?: number | null
          stripe_customer_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          trial_end?: string | null
          trial_started_at?: string | null
          trial_used?: boolean | null
          updated_at?: string
          user_id: string
          user_number?: number | null
          weekly_report_enabled?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          barcode_scans_used?: number | null
          bio?: string | null
          birth_date?: string | null
          bonus_scans?: number | null
          city?: string | null
          created_at?: string
          currency?: string | null
          display_name?: string | null
          family_id?: string | null
          family_role?: string | null
          fridge_scans_used?: number | null
          gender?: string | null
          id?: string
          is_founding_member?: boolean | null
          monthly_fridge_scans?: number | null
          monthly_receipt_scans?: number | null
          monthly_reset_date?: string | null
          onboarding_completed?: boolean | null
          store_integration_waitlist?: boolean | null
          streak_badges?: string[] | null
          streak_current?: number | null
          streak_last_activity?: string | null
          streak_longest?: number | null
          stripe_customer_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          trial_end?: string | null
          trial_started_at?: string | null
          trial_used?: boolean | null
          updated_at?: string
          user_id?: string
          user_number?: number | null
          weekly_report_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          created_at: string
          currency: string | null
          id: string
          image_url: string | null
          items: Json | null
          receipt_date: string | null
          store_name: string | null
          total_amount: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string | null
          id?: string
          image_url?: string | null
          items?: Json | null
          receipt_date?: string | null
          store_name?: string | null
          total_amount?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string | null
          id?: string
          image_url?: string | null
          items?: Json | null
          receipt_date?: string | null
          store_name?: string | null
          total_amount?: number | null
          user_id?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          created_at: string | null
          estimated_cost: number | null
          id: string
          ingredients: Json | null
          instructions: string[] | null
          is_favorite: boolean | null
          nutrition: Json | null
          prep_time: number | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          ingredients?: Json | null
          instructions?: string[] | null
          is_favorite?: boolean | null
          nutrition?: Json | null
          prep_time?: number | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          estimated_cost?: number | null
          id?: string
          ingredients?: Json | null
          instructions?: string[] | null
          is_favorite?: boolean | null
          nutrition?: Json | null
          prep_time?: number | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_workouts: {
        Row: {
          created_at: string
          days_of_week: number[]
          duration_min: number
          id: string
          intensity: string
          is_active: boolean
          user_id: string
          workout_type: string
        }
        Insert: {
          created_at?: string
          days_of_week?: number[]
          duration_min?: number
          id?: string
          intensity?: string
          is_active?: boolean
          user_id: string
          workout_type: string
        }
        Update: {
          created_at?: string
          days_of_week?: number[]
          duration_min?: number
          id?: string
          intensity?: string
          is_active?: boolean
          user_id?: string
          workout_type?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          id: string
          is_completed: boolean
          remind_at: string
          repeat_type: string
          text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_completed?: boolean
          remind_at: string
          repeat_type?: string
          text: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_completed?: boolean
          remind_at?: string
          repeat_type?: string
          text?: string
          user_id?: string
        }
        Relationships: []
      }
      savings_log: {
        Row: {
          amount: number | null
          created_at: string | null
          description: string | null
          id: string
          type: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          type?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      shopping_items: {
        Row: {
          category: string | null
          created_at: string | null
          estimated_price: number | null
          id: string
          is_purchased: boolean | null
          name: string
          quantity: number | null
          unit: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          estimated_price?: number | null
          id?: string
          is_purchased?: boolean | null
          name: string
          quantity?: number | null
          unit?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          estimated_price?: number | null
          id?: string
          is_purchased?: boolean | null
          name?: string
          quantity?: number | null
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          app_version: string | null
          created_at: string | null
          device: string | null
          email: string | null
          id: string
          language: string | null
          message: string
          status: string | null
          subject: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string | null
          device?: string | null
          email?: string | null
          id?: string
          language?: string | null
          message: string
          status?: string | null
          subject: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          created_at?: string | null
          device?: string | null
          email?: string | null
          id?: string
          language?: string | null
          message?: string
          status?: string | null
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          date: string
          gpt_calls_today: number
          id: string
          last_reset_date: string
          recipes_shown_today: number
          user_id: string
        }
        Insert: {
          date?: string
          gpt_calls_today?: number
          id?: string
          last_reset_date?: string
          recipes_shown_today?: number
          user_id: string
        }
        Update: {
          date?: string
          gpt_calls_today?: number
          id?: string
          last_reset_date?: string
          recipes_shown_today?: number
          user_id?: string
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          activity_level: string | null
          age: number | null
          allergies: string[] | null
          daily_calories_target: number | null
          diet_type: string | null
          disliked_foods: string[] | null
          family_dislikes: string[] | null
          goals: string[] | null
          height_cm: number | null
          household_size: number | null
          id: string
          last_recalculated: string | null
          monthly_budget: number | null
          stores: string[] | null
          updated_at: string | null
          user_id: string
          weight_kg: number | null
          weight_loss_speed: string | null
        }
        Insert: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          daily_calories_target?: number | null
          diet_type?: string | null
          disliked_foods?: string[] | null
          family_dislikes?: string[] | null
          goals?: string[] | null
          height_cm?: number | null
          household_size?: number | null
          id?: string
          last_recalculated?: string | null
          monthly_budget?: number | null
          stores?: string[] | null
          updated_at?: string | null
          user_id: string
          weight_kg?: number | null
          weight_loss_speed?: string | null
        }
        Update: {
          activity_level?: string | null
          age?: number | null
          allergies?: string[] | null
          daily_calories_target?: number | null
          diet_type?: string | null
          disliked_foods?: string[] | null
          family_dislikes?: string[] | null
          goals?: string[] | null
          height_cm?: number | null
          household_size?: number | null
          id?: string
          last_recalculated?: string | null
          monthly_budget?: number | null
          stores?: string[] | null
          updated_at?: string | null
          user_id?: string
          weight_kg?: number | null
          weight_loss_speed?: string | null
        }
        Relationships: []
      }
      watch_data: {
        Row: {
          active_minutes: number | null
          advice: Json | null
          blood_oxygen: number | null
          calories_burned: number | null
          confidence: string | null
          created_at: string
          date: string
          distance_km: number | null
          heart_rate: number | null
          heart_rate_max: number | null
          heart_rate_min: number | null
          id: string
          raw_metrics: Json | null
          sleep_hours: number | null
          sleep_quality: string | null
          steps: number | null
          stress_level: number | null
          user_id: string
          watch_brand: string | null
        }
        Insert: {
          active_minutes?: number | null
          advice?: Json | null
          blood_oxygen?: number | null
          calories_burned?: number | null
          confidence?: string | null
          created_at?: string
          date?: string
          distance_km?: number | null
          heart_rate?: number | null
          heart_rate_max?: number | null
          heart_rate_min?: number | null
          id?: string
          raw_metrics?: Json | null
          sleep_hours?: number | null
          sleep_quality?: string | null
          steps?: number | null
          stress_level?: number | null
          user_id: string
          watch_brand?: string | null
        }
        Update: {
          active_minutes?: number | null
          advice?: Json | null
          blood_oxygen?: number | null
          calories_burned?: number | null
          confidence?: string | null
          created_at?: string
          date?: string
          distance_km?: number | null
          heart_rate?: number | null
          heart_rate_max?: number | null
          heart_rate_min?: number | null
          id?: string
          raw_metrics?: Json | null
          sleep_hours?: number | null
          sleep_quality?: string | null
          steps?: number | null
          stress_level?: number | null
          user_id?: string
          watch_brand?: string | null
        }
        Relationships: []
      }
      weight_history: {
        Row: {
          created_at: string
          date: string
          id: string
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          user_id: string
          weight: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      workouts: {
        Row: {
          calories_burned: number
          created_at: string
          date: string
          duration_min: number
          id: string
          intensity: string
          user_id: string
          weight_kg: number | null
          workout_type: string
        }
        Insert: {
          calories_burned?: number
          created_at?: string
          date?: string
          duration_min?: number
          id?: string
          intensity?: string
          user_id: string
          weight_kg?: number | null
          workout_type: string
        }
        Update: {
          calories_burned?: number
          created_at?: string
          date?: string
          duration_min?: number
          id?: string
          intensity?: string
          user_id?: string
          weight_kg?: number | null
          workout_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_trial: { Args: never; Returns: undefined }
      assign_user_number: { Args: { p_user_id: string }; Returns: Json }
      count_store_waitlist: { Args: never; Returns: number }
      create_family_rpc: { Args: { p_name: string }; Returns: Json }
      expire_trial: { Args: never; Returns: undefined }
      find_family_by_invite: {
        Args: { p_invite_code: string }
        Returns: {
          id: string
          name: string
        }[]
      }
      get_family_id_for_user: { Args: { p_user_id: string }; Returns: string }
      get_member_family_id: { Args: { p_user_id: string }; Returns: string }
      grant_streak_reward: {
        Args: { p_plan: string; p_trial_days: number }
        Returns: undefined
      }
      join_family_by_invite: { Args: { p_invite_code: string }; Returns: Json }
      leave_family_rpc: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
