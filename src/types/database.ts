export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Supabase v2.49+ requires Relationships on every table
type NoRelationships = { Relationships: [] }

export interface Database {
  public: {
    Tables: {
      users: NoRelationships & {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          tags: string[]
          invited_by: string | null
          show_invited_by: boolean
          is_admin: boolean
          is_active: boolean
          invite_quota: number
          age_confirmed: boolean
          created_at: string
        }
        Insert: {
          id: string
          username: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          tags?: string[]
          invited_by?: string | null
          show_invited_by?: boolean
          is_admin?: boolean
          is_active?: boolean
          invite_quota?: number
          age_confirmed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          tags?: string[]
          invited_by?: string | null
          show_invited_by?: boolean
          is_admin?: boolean
          is_active?: boolean
          invite_quota?: number
          age_confirmed?: boolean
          created_at?: string
        }
      }
      posts: NoRelationships & {
        Row: {
          id: string
          author_id: string
          content: string | null
          image_urls: string[]
          link_url: string | null
          link_preview: Json | null
          is_deleted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          author_id: string
          content?: string | null
          image_urls?: string[]
          link_url?: string | null
          link_preview?: Json | null
          is_deleted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          content?: string | null
          image_urls?: string[]
          link_url?: string | null
          link_preview?: Json | null
          is_deleted?: boolean
          created_at?: string
        }
      }
      shares: NoRelationships & {
        Row: {
          id: string
          post_id: string
          shared_by: string
          shared_from: string | null
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          shared_by: string
          shared_from?: string | null
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          shared_by?: string
          shared_from?: string | null
          comment?: string | null
          created_at?: string
        }
      }
      invites: NoRelationships & {
        Row: {
          id: string
          code: string
          created_by: string
          used_by: string | null
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code?: string
          created_by: string
          used_by?: string | null
          used_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          created_by?: string
          used_by?: string | null
          used_at?: string | null
          created_at?: string
        }
      }
      follows: NoRelationships & {
        Row: {
          id: string
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          id?: string
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          id?: string
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      likes: NoRelationships & {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          user_id?: string
          created_at?: string
        }
      }
      comments: NoRelationships & {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          is_deleted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          is_deleted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          content?: string
          is_deleted?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Convenience types
export type User = Database['public']['Tables']['users']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type Share = Database['public']['Tables']['shares']['Row']
export type Invite = Database['public']['Tables']['invites']['Row']
export type Follow = Database['public']['Tables']['follows']['Row']
export type Like = Database['public']['Tables']['likes']['Row']
export type Comment = Database['public']['Tables']['comments']['Row']
