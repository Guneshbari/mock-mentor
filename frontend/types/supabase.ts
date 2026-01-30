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
            users: {
                Row: {
                    id: string
                    email: string
                    name: string | null
                    auth_provider: string | null
                    profile_image_url: string | null
                    is_active: boolean | null
                    last_login_at: string | null
                    created_at: string | null
                }
                Insert: {
                    id: string
                    email: string
                    name?: string | null
                    auth_provider?: string | null
                    profile_image_url?: string | null
                    is_active?: boolean | null
                    last_login_at?: string | null
                    created_at?: string | null
                }
                Update: {
                    id?: string
                    email?: string
                    name?: string | null
                    auth_provider?: string | null
                    profile_image_url?: string | null
                    is_active?: boolean | null
                    last_login_at?: string | null
                    created_at?: string | null
                }
            }
            // Add other tables as needed based on schema.sql
        }
    }
}
