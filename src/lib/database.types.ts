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
      user_profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          address: string
          dob: string
          created_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          address: string
          dob: string
          created_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          address?: string
          dob?: string
          created_at?: string
        }
      }
      investments: {
        Row: {
          id: string
          user_id: string
          portfolio_id: string
          asset_name: string
          type: 'Real Estate' | 'Stocks' | 'Bonds' | 'Crypto' | 'Deposits'
          value: number
          risk: 'Low' | 'Medium' | 'High'
          sector: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          portfolio_id: string
          asset_name: string
          type: 'Real Estate' | 'Stocks' | 'Bonds' | 'Crypto' | 'Deposits'
          value: number
          risk: 'Low' | 'Medium' | 'High'
          sector: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          portfolio_id?: string
          asset_name?: string
          type?: 'Real Estate' | 'Stocks' | 'Bonds' | 'Crypto' | 'Deposits'
          value?: number
          risk?: 'Low' | 'Medium' | 'High'
          sector?: string
          created_at?: string
        }
      }
      portfolios: {
        Row: {
          id: string
          user_id: string
          created_at: string
          last_updated: string
          total_investments: number
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          last_updated?: string
          total_investments: number
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          last_updated?: string
          total_investments?: number
        }
      }
      analysis_reports: {
        Row: {
          id: string
          user_id: string
          portfolio_id: string
          created_at: string
          risk: 'Low' | 'Medium' | 'High'
          prediction: string
        }
        Insert: {
          id?: string
          user_id: string
          portfolio_id: string
          created_at?: string
          risk: 'Low' | 'Medium' | 'High'
          prediction: string
        }
        Update: {
          id?: string
          user_id?: string
          portfolio_id?: string
          created_at?: string
          risk?: 'Low' | 'Medium' | 'High'
          prediction?: string
        }
      }
      market_data: {
        Row: {
          id: string
          symbol: string
          price: number
          timestamp: string
        }
        Insert: {
          id?: string
          symbol: string
          price: number
          timestamp?: string
        }
        Update: {
          id?: string
          symbol?: string
          price?: number
          timestamp?: string
        }
      }
    }
  }
}