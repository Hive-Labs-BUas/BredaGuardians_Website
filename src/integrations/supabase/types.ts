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
  public: {
    Tables: {
      applications: {
        Row: {
          created_at: string
          cv_path: string | null
          email: string
          handled_at: string | null
          handled_by: string | null
          id: string
          internal_note: string
          letter_path: string | null
          motivation: string
          name: string
          position: string
          status: string
        }
        Insert: {
          created_at?: string
          cv_path?: string | null
          email: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          internal_note?: string
          letter_path?: string | null
          motivation?: string
          name: string
          position: string
          status?: string
        }
        Update: {
          created_at?: string
          cv_path?: string | null
          email?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          internal_note?: string
          letter_path?: string | null
          motivation?: string
          name?: string
          position?: string
          status?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          handled_at: string | null
          handled_by: string | null
          id: string
          internal_note: string
          message: string
          name: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          internal_note?: string
          message: string
          name: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          internal_note?: string
          message?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      hall_of_fame: {
        Row: {
          achieved_on: string
          content: string
          created_at: string
          description: string
          document_name: string | null
          document_url: string | null
          id: string
          image_url: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          achieved_on?: string
          content?: string
          created_at?: string
          description?: string
          document_name?: string | null
          document_url?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          achieved_on?: string
          content?: string
          created_at?: string
          description?: string
          document_name?: string | null
          document_url?: string | null
          id?: string
          image_url?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      intern_positions: {
        Row: {
          active: boolean
          created_at: string
          description: string
          id: string
          requirements: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          requirements?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          id?: string
          requirements?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      interns: {
        Row: {
          alumni: boolean
          blurb: string
          created_at: string
          ended_on: string | null
          id: string
          is_core: boolean
          linkedin_url: string | null
          name: string
          photo_url: string | null
          role: string
          sort_order: number
          started_on: string | null
          updated_at: string
          visible: boolean
        }
        Insert: {
          alumni?: boolean
          blurb?: string
          created_at?: string
          ended_on?: string | null
          id?: string
          is_core?: boolean
          linkedin_url?: string | null
          name: string
          photo_url?: string | null
          role?: string
          sort_order?: number
          started_on?: string | null
          updated_at?: string
          visible?: boolean
        }
        Update: {
          alumni?: boolean
          blurb?: string
          created_at?: string
          ended_on?: string | null
          id?: string
          is_core?: boolean
          linkedin_url?: string | null
          name?: string
          photo_url?: string | null
          role?: string
          sort_order?: number
          started_on?: string | null
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      match_results: {
        Row: {
          competition: string
          created_at: string
          game: string
          id: string
          opponent: string
          opponent_logo_url: string | null
          outcome: string
          played_at: string
          score_them: number | null
          score_us: number | null
          stage: string
          status: string
          stream_url: string | null
          team_id: string | null
          team_logo_url: string | null
          updated_at: string
          visible: boolean
        }
        Insert: {
          competition?: string
          created_at?: string
          game?: string
          id?: string
          opponent?: string
          opponent_logo_url?: string | null
          outcome?: string
          played_at?: string
          score_them?: number | null
          score_us?: number | null
          stage?: string
          status?: string
          stream_url?: string | null
          team_id?: string | null
          team_logo_url?: string | null
          updated_at?: string
          visible?: boolean
        }
        Update: {
          competition?: string
          created_at?: string
          game?: string
          id?: string
          opponent?: string
          opponent_logo_url?: string | null
          outcome?: string
          played_at?: string
          score_them?: number | null
          score_us?: number | null
          stage?: string
          status?: string
          stream_url?: string | null
          team_id?: string | null
          team_logo_url?: string | null
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "match_results_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_events: {
        Row: {
          created_at: string
          details: Json
          email: string | null
          event_type: string
          id: string
          notified: boolean
          tier: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json
          email?: string | null
          event_type: string
          id?: string
          notified?: boolean
          tier?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json
          email?: string | null
          event_type?: string
          id?: string
          notified?: boolean
          tier?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          created_at: string
          discount_cents: number
          ended_at: string | null
          ended_by: string | null
          expires_at: string | null
          id: string
          started_at: string
          status: string
          tier: string
          user_id: string
          voucher_code: string | null
        }
        Insert: {
          created_at?: string
          discount_cents?: number
          ended_at?: string | null
          ended_by?: string | null
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: string
          tier: string
          user_id: string
          voucher_code?: string | null
        }
        Update: {
          created_at?: string
          discount_cents?: number
          ended_at?: string | null
          ended_by?: string | null
          expires_at?: string | null
          id?: string
          started_at?: string
          status?: string
          tier?: string
          user_id?: string
          voucher_code?: string | null
        }
        Relationships: []
      }
      news: {
        Row: {
          content: string
          created_at: string
          document_name: string | null
          document_url: string | null
          excerpt: string
          id: string
          image_url: string | null
          publish_date: string
          published: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: string
          created_at?: string
          document_name?: string | null
          document_url?: string | null
          excerpt?: string
          id?: string
          image_url?: string | null
          publish_date?: string
          published?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          document_name?: string | null
          document_url?: string | null
          excerpt?: string
          id?: string
          image_url?: string | null
          publish_date?: string
          published?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_signups: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      opening_hours: {
        Row: {
          closed: boolean
          closes_at: string | null
          day_of_week: number
          id: string
          opens_at: string | null
          updated_at: string
        }
        Insert: {
          closed?: boolean
          closes_at?: string | null
          day_of_week: number
          id?: string
          opens_at?: string | null
          updated_at?: string
        }
        Update: {
          closed?: boolean
          closes_at?: string | null
          day_of_week?: number
          id?: string
          opens_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          receipt_url: string | null
          status: string
          tier: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          id?: string
          receipt_url?: string | null
          status?: string
          tier: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          receipt_url?: string | null
          status?: string
          tier?: string
          user_id?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          country: string | null
          created_at: string
          day: string
          id: string
          path: string
          referrer: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          day?: string
          id?: string
          path: string
          referrer?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          day?: string
          id?: string
          path?: string
          referrer?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
        }
        Relationships: []
      }
      protected_accounts: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      research: {
        Row: {
          category: string
          content: string
          cover_image_url: string | null
          created_at: string
          document_name: string | null
          document_size_bytes: number | null
          document_url: string | null
          entry_date: string
          game: string | null
          id: string
          link_url: string | null
          published: boolean
          summary: string
          takeaways: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          document_name?: string | null
          document_size_bytes?: number | null
          document_url?: string | null
          entry_date?: string
          game?: string | null
          id?: string
          link_url?: string | null
          published?: boolean
          summary?: string
          takeaways?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          document_name?: string | null
          document_size_bytes?: number | null
          document_url?: string | null
          entry_date?: string
          game?: string | null
          id?: string
          link_url?: string | null
          published?: boolean
          summary?: string
          takeaways?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      shop_products: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          image_url: string | null
          in_stock: boolean
          name: string
          price_cents: number
          sizes: string[]
          slug: string
          sort_order: number
          updated_at: string
          visible: boolean
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name: string
          price_cents?: number
          sizes?: string[]
          slug: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          in_stock?: boolean
          name?: string
          price_cents?: number
          sizes?: string[]
          slug?: string
          sort_order?: number
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      shop_requests: {
        Row: {
          created_at: string
          discount_cents: number
          email: string | null
          handled_at: string | null
          handled_by: string | null
          id: string
          note: string
          product_id: string | null
          product_name: string
          quantity: number
          size: string | null
          status: string
          unit_price_cents: number
          updated_at: string
          user_id: string
          voucher_code: string | null
        }
        Insert: {
          created_at?: string
          discount_cents?: number
          email?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          note?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          size?: string | null
          status?: string
          unit_price_cents?: number
          updated_at?: string
          user_id: string
          voucher_code?: string | null
        }
        Update: {
          created_at?: string
          discount_cents?: number
          email?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          note?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          size?: string | null
          status?: string
          unit_price_cents?: number
          updated_at?: string
          user_id?: string
          voucher_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "shop_products"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_vouchers: {
        Row: {
          active: boolean
          applies_to: string
          code: string
          created_at: string
          description: string
          expires_at: string | null
          id: string
          kind: string
          max_uses: number | null
          min_spend_cents: number
          updated_at: string
          uses: number
          value: number
        }
        Insert: {
          active?: boolean
          applies_to?: string
          code: string
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          kind?: string
          max_uses?: number | null
          min_spend_cents?: number
          updated_at?: string
          uses?: number
          value?: number
        }
        Update: {
          active?: boolean
          applies_to?: string
          code?: string
          created_at?: string
          description?: string
          expires_at?: string | null
          id?: string
          kind?: string
          max_uses?: number | null
          min_spend_cents?: number
          updated_at?: string
          uses?: number
          value?: number
        }
        Relationships: []
      }
      site_images: {
        Row: {
          created_at: string
          id: string
          key: string
          label: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          description: string
          id: string
          key: string
          label: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          key: string
          label: string
          updated_at?: string
          value?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          key?: string
          label?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      site_socials: {
        Row: {
          created_at: string
          id: string
          label: string
          platform: string
          sort_order: number
          updated_at: string
          url: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          platform: string
          sort_order?: number
          updated_at?: string
          url?: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          platform?: string
          sort_order?: number
          updated_at?: string
          url?: string
          visible?: boolean
        }
        Relationships: []
      }
      special_days: {
        Row: {
          created_at: string
          day: string
          id: string
          is_closure: boolean
          label: string
          note: string
        }
        Insert: {
          created_at?: string
          day: string
          id?: string
          is_closure?: boolean
          label: string
          note?: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          is_closure?: boolean
          label?: string
          note?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          environment: string
          id: string
          price_id: string
          product_id: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id: string
          product_id: string
          status?: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          environment?: string
          id?: string
          price_id?: string
          product_id?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      team_players: {
        Row: {
          birth_date: string | null
          country_code: string | null
          country_codes: string[]
          created_at: string
          handle: string
          id: string
          is_captain: boolean
          name: string
          photo_url: string | null
          role: string
          sort_order: number
          team_id: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          birth_date?: string | null
          country_code?: string | null
          country_codes?: string[]
          created_at?: string
          handle?: string
          id?: string
          is_captain?: boolean
          name: string
          photo_url?: string | null
          role?: string
          sort_order?: number
          team_id: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          birth_date?: string | null
          country_code?: string | null
          country_codes?: string[]
          created_at?: string
          handle?: string
          id?: string
          is_captain?: boolean
          name?: string
          photo_url?: string | null
          role?: string
          sort_order?: number
          team_id?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "team_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          blurb: string
          created_at: string
          game: string
          id: string
          image_url: string | null
          logo_url: string | null
          name: string
          slug: string
          sort_order: number
          tagline: string
          updated_at: string
          visible: boolean
        }
        Insert: {
          blurb?: string
          created_at?: string
          game: string
          id?: string
          image_url?: string | null
          logo_url?: string | null
          name: string
          slug: string
          sort_order?: number
          tagline?: string
          updated_at?: string
          visible?: boolean
        }
        Update: {
          blurb?: string
          created_at?: string
          game?: string
          id?: string
          image_url?: string | null
          logo_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          tagline?: string
          updated_at?: string
          visible?: boolean
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_active_subscription: {
        Args: { check_env?: string }
        Returns: boolean
      }
      is_protected_account: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "member" | "intern" | "captain"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member", "intern", "captain"],
    },
  },
} as const
