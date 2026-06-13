/**
 * Generated Supabase database types — DO NOT EDIT BY HAND.
 * Regenerate with:
 *   npx supabase gen types typescript --linked > src/lib/database.types.ts
 * (then re-add this header). App-facing row types live in their data modules
 * (FoodLog, FridgeItem, RecipeRow, ProfileRow) and refine these where the
 * generator widens unions to `string` or types jsonb as `Json`.
 */
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
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_usage: {
        Row: {
          count: number
          day: string
          fn: string
          updated_at: string
          user_id: string
        }
        Insert: {
          count?: number
          day: string
          fn: string
          updated_at?: string
          user_id: string
        }
        Update: {
          count?: number
          day?: string
          fn?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      food_logs: {
        Row: {
          calories: number
          carbs_g: number
          created_at: string
          fat_g: number
          id: string
          logged_on: string
          meal_type: string
          name: string
          protein_g: number
          quantity: number
          source: string
          user_id: string
        }
        Insert: {
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          id?: string
          logged_on?: string
          meal_type: string
          name: string
          protein_g?: number
          quantity?: number
          source?: string
          user_id: string
        }
        Update: {
          calories?: number
          carbs_g?: number
          created_at?: string
          fat_g?: number
          id?: string
          logged_on?: string
          meal_type?: string
          name?: string
          protein_g?: number
          quantity?: number
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      fridge_items: {
        Row: {
          added_at: string
          category: string | null
          created_at: string
          expires_at: string | null
          id: string
          name: string
          quantity: string | null
          source: string
          user_id: string
        }
        Insert: {
          added_at?: string
          category?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          name: string
          quantity?: string | null
          source?: string
          user_id: string
        }
        Update: {
          added_at?: string
          category?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          name?: string
          quantity?: string | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activity_level: string | null
          allergies: string[]
          birth_date: string | null
          calorie_target: number | null
          carb_target_g: number | null
          created_at: string
          custom_allergy: string | null
          custom_dietary_style: string | null
          custom_training_type: string | null
          dietary_styles: string[]
          fat_target_g: number | null
          gender: string | null
          goal: string | null
          height_cm: number | null
          id: string
          name: string | null
          onboarded: boolean
          protein_target_g: number | null
          theme_index: number | null
          theme_mode: string | null
          training_types: string[]
          unit: string
          updated_at: string
          water_unit: string | null
          weight_kg: number | null
        }
        Insert: {
          activity_level?: string | null
          allergies?: string[]
          birth_date?: string | null
          calorie_target?: number | null
          carb_target_g?: number | null
          created_at?: string
          custom_allergy?: string | null
          custom_dietary_style?: string | null
          custom_training_type?: string | null
          dietary_styles?: string[]
          fat_target_g?: number | null
          gender?: string | null
          goal?: string | null
          height_cm?: number | null
          id: string
          name?: string | null
          onboarded?: boolean
          protein_target_g?: number | null
          theme_index?: number | null
          theme_mode?: string | null
          training_types?: string[]
          unit?: string
          updated_at?: string
          water_unit?: string | null
          weight_kg?: number | null
        }
        Update: {
          activity_level?: string | null
          allergies?: string[]
          birth_date?: string | null
          calorie_target?: number | null
          carb_target_g?: number | null
          created_at?: string
          custom_allergy?: string | null
          custom_dietary_style?: string | null
          custom_training_type?: string | null
          dietary_styles?: string[]
          fat_target_g?: number | null
          gender?: string | null
          goal?: string | null
          height_cm?: number | null
          id?: string
          name?: string | null
          onboarded?: boolean
          protein_target_g?: number | null
          theme_index?: number | null
          theme_mode?: string | null
          training_types?: string[]
          unit?: string
          updated_at?: string
          water_unit?: string | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          calories: number | null
          carbs_g: number | null
          created_at: string
          description: string | null
          fat_g: number | null
          id: string
          ingredients: Json
          meal_type: string | null
          minutes: number | null
          protein_g: number | null
          steps: Json
          title: string
          user_id: string
          uses_count: number
        }
        Insert: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          description?: string | null
          fat_g?: number | null
          id?: string
          ingredients?: Json
          meal_type?: string | null
          minutes?: number | null
          protein_g?: number | null
          steps?: Json
          title: string
          user_id: string
          uses_count?: number
        }
        Update: {
          calories?: number | null
          carbs_g?: number | null
          created_at?: string
          description?: string | null
          fat_g?: number | null
          id?: string
          ingredients?: Json
          meal_type?: string | null
          minutes?: number | null
          protein_g?: number | null
          steps?: Json
          title?: string
          user_id?: string
          uses_count?: number
        }
        Relationships: []
      }
      saved_recipes: {
        Row: {
          id: string
          recipe_id: string
          saved_at: string
          user_id: string
        }
        Insert: {
          id?: string
          recipe_id: string
          saved_at?: string
          user_id: string
        }
        Update: {
          id?: string
          recipe_id?: string
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      water_logs: {
        Row: {
          amount_ml: number
          created_at: string
          id: string
          logged_on: string
          user_id: string
        }
        Insert: {
          amount_ml: number
          created_at?: string
          id?: string
          logged_on?: string
          user_id: string
        }
        Update: {
          amount_ml?: number
          created_at?: string
          id?: string
          logged_on?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_ai_usage: {
        Args: { p_fn: string; p_limit: number; p_user: string }
        Returns: {
          allowed: boolean
          lim: number
          used: number
        }[]
      }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
