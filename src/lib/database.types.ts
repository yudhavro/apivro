export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          language: 'en' | 'id'
          total_messages_sent: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          language?: 'en' | 'id'
          total_messages_sent?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          language?: 'en' | 'id'
          total_messages_sent?: number
          created_at?: string
          updated_at?: string
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          slug: string
          message_limit: number
          price_monthly: number
          price_yearly: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          message_limit: number
          price_monthly: number
          price_yearly: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          message_limit?: number
          price_monthly?: number
          price_yearly?: number
          is_active?: boolean
          created_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          billing_cycle: 'monthly' | 'yearly'
          status: 'active' | 'expired' | 'cancelled'
          messages_used: number
          start_date: string
          end_date: string | null
          last_reset_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          billing_cycle?: 'monthly' | 'yearly'
          status?: 'active' | 'expired' | 'cancelled'
          messages_used?: number
          start_date?: string
          end_date?: string | null
          last_reset_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          billing_cycle?: 'monthly' | 'yearly'
          status?: 'active' | 'expired' | 'cancelled'
          messages_used?: number
          start_date?: string
          end_date?: string | null
          last_reset_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      devices: {
        Row: {
          id: string
          user_id: string
          name: string
          phone_number: string | null
          session_id: string
          status: 'connected' | 'disconnected' | 'scanning'
          qr_code: string | null
          last_connected_at: string | null
          webhook_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone_number?: string | null
          session_id: string
          status?: 'connected' | 'disconnected' | 'scanning'
          qr_code?: string | null
          last_connected_at?: string | null
          webhook_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone_number?: string | null
          session_id?: string
          status?: 'connected' | 'disconnected' | 'scanning'
          qr_code?: string | null
          last_connected_at?: string | null
          webhook_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          device_id: string
          key_hash: string
          key_prefix: string
          name: string
          last_used_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_id: string
          key_hash: string
          key_prefix: string
          name: string
          last_used_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_id?: string
          key_hash?: string
          key_prefix?: string
          name?: string
          last_used_at?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          user_id: string
          device_id: string
          subscription_id: string
          recipient: string
          message_type: string
          status: 'sent' | 'failed' | 'pending'
          api_key_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          device_id: string
          subscription_id: string
          recipient: string
          message_type?: string
          status?: 'sent' | 'failed' | 'pending'
          api_key_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          device_id?: string
          subscription_id?: string
          recipient?: string
          message_type?: string
          status?: 'sent' | 'failed' | 'pending'
          api_key_id?: string | null
          created_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          tripay_reference: string
          amount: number
          fee: number
          total_amount: number
          payment_method: string
          payment_name: string
          status: 'pending' | 'paid' | 'failed' | 'expired'
          checkout_url: string | null
          paid_at: string | null
          expired_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          tripay_reference: string
          amount: number
          fee?: number
          total_amount: number
          payment_method: string
          payment_name: string
          status?: 'pending' | 'paid' | 'failed' | 'expired'
          checkout_url?: string | null
          paid_at?: string | null
          expired_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string | null
          tripay_reference?: string
          amount?: number
          fee?: number
          total_amount?: number
          payment_method?: string
          payment_name?: string
          status?: 'pending' | 'paid' | 'failed' | 'expired'
          checkout_url?: string | null
          paid_at?: string | null
          expired_at?: string | null
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          payment_id: string
          invoice_number: string
          amount: number
          issued_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          payment_id: string
          invoice_number: string
          amount: number
          issued_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          payment_id?: string
          invoice_number?: string
          amount?: number
          issued_at?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'expiry_reminder' | 'device_disconnected' | 'payment_success' | 'payment_failed'
          title: string
          message: string
          email_sent: boolean
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'expiry_reminder' | 'device_disconnected' | 'payment_success' | 'payment_failed'
          title: string
          message: string
          email_sent?: boolean
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'expiry_reminder' | 'device_disconnected' | 'payment_success' | 'payment_failed'
          title?: string
          message?: string
          email_sent?: boolean
          read?: boolean
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
  }
}
