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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          bonus_scans: number | null
          city: string | null
          created_at: string
          currency: string | null
          display_name: string | null
          family_id: string | null
          family_role: string | null
          gender: string | null
          id: string
          is_founding_member: boolean | null
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
          updated_at: string
          user_id: string
          user_number: number | null
          weekly_report_enabled: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          bonus_scans?: number | null
          city?: string | null
          created_at?: string
          currency?: string | null
          display_name?: string | null
          family_id?: string | null
          family_role?: string | null
          gender?: string | null
          id?: string
          is_founding_member?: boolean | null
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
          updated_at?: string
          user_id: string
          user_number?: number | null
          weekly_report_enabled?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          bonus_scans?: number | null
          city?: string | null
          created_at?: string
          currency?: string | null
          display_name?: string | null
          family_id?: string | null
          family_role?: string | null
          gender?: string | null
          id?: string
          is_founding_member?: boolean | null
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
          created_at: string | null
          email: string | null
          id: string
          message: string
          status: string | null
          subject: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          message: string
          status?: string | null
          subject: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          message?: string
          status?: string | null
          subject?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_user_number: { Args: { p_user_id: string }; Returns: Json }
      count_store_waitlist: { Args: never; Returns: number }
      get_family_id_for_user: { Args: { p_user_id: string }; Returns: string }
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
