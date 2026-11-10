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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      access_plans: {
        Row: {
          active: boolean
          created_at: string
          key: string
          label: string
          monthly_cents: number
          role: Database["public"]["Enums"]["user_role"]
          sort: number
          startup_fee_cents: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          key: string
          label: string
          monthly_cents: number
          role: Database["public"]["Enums"]["user_role"]
          sort?: number
          startup_fee_cents: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          key?: string
          label?: string
          monthly_cents?: number
          role?: Database["public"]["Enums"]["user_role"]
          sort?: number
          startup_fee_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      admin_impersonation_log: {
        Row: {
          admin_user_id: string
          ended_at: string | null
          id: string
          impersonated_role: Database["public"]["Enums"]["user_role"]
          impersonated_user_id: string
          ip_address: unknown
          reason: string | null
          started_at: string
          user_agent: string | null
        }
        Insert: {
          admin_user_id: string
          ended_at?: string | null
          id?: string
          impersonated_role: Database["public"]["Enums"]["user_role"]
          impersonated_user_id: string
          ip_address?: unknown
          reason?: string | null
          started_at?: string
          user_agent?: string | null
        }
        Update: {
          admin_user_id?: string
          ended_at?: string | null
          id?: string
          impersonated_role?: Database["public"]["Enums"]["user_role"]
          impersonated_user_id?: string
          ip_address?: unknown
          reason?: string | null
          started_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_impersonation_log_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_impersonation_log_impersonated_user_id_fkey"
            columns: ["impersonated_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      approved_roster: {
        Row: {
          cna_id: string
          created_at: string
          id: string
          last_worked_at: string | null
          notes: string | null
          org_id: string
          saved_by_user_id: string | null
        }
        Insert: {
          cna_id: string
          created_at?: string
          id?: string
          last_worked_at?: string | null
          notes?: string | null
          org_id: string
          saved_by_user_id?: string | null
        }
        Update: {
          cna_id?: string
          created_at?: string
          id?: string
          last_worked_at?: string | null
          notes?: string | null
          org_id?: string
          saved_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approved_roster_cna_id_fkey"
            columns: ["cna_id"]
            isOneToOne: false
            referencedRelation: "cna_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "approved_roster_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approved_roster_saved_by_user_id_fkey"
            columns: ["saved_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          accessed_fields: string[] | null
          action: string
          context: Json | null
          created_at: string
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          accessed_fields?: string[] | null
          action: string
          context?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          accessed_fields?: string[] | null
          action?: string
          context?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          cancellation_policy: string | null
          care_recipient_id: string | null
          client_id: string
          cna_id: string
          created_at: string
          end_date: string | null
          hourly_rate_cents: number
          id: string
          job_id: string | null
          payer_type: Database["public"]["Enums"]["payer_type"]
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          cancellation_policy?: string | null
          care_recipient_id?: string | null
          client_id: string
          cna_id: string
          created_at?: string
          end_date?: string | null
          hourly_rate_cents: number
          id?: string
          job_id?: string | null
          payer_type?: Database["public"]["Enums"]["payer_type"]
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          cancellation_policy?: string | null
          care_recipient_id?: string | null
          client_id?: string
          cna_id?: string
          created_at?: string
          end_date?: string | null
          hourly_rate_cents?: number
          id?: string
          job_id?: string | null
          payer_type?: Database["public"]["Enums"]["payer_type"]
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_care_recipient_id_fkey"
            columns: ["care_recipient_id"]
            isOneToOne: false
            referencedRelation: "care_recipients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_cna_id_fkey"
            columns: ["cna_id"]
            isOneToOne: false
            referencedRelation: "cna_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "bookings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      business_shift_applications: {
        Row: {
          cna_id: string
          created_at: string
          id: string
          message: string | null
          shift_id: string
          status: string
          updated_at: string
        }
        Insert: {
          cna_id: string
          created_at?: string
          id?: string
          message?: string | null
          shift_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          cna_id?: string
          created_at?: string
          id?: string
          message?: string | null
          shift_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_shift_applications_cna_id_fkey"
            columns: ["cna_id"]
            isOneToOne: false
            referencedRelation: "cna_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "business_shift_applications_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "business_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      business_shifts: {
        Row: {
          assigned_at: string | null
          assigned_cna_id: string | null
          bill_rate_cents: number
          created_at: string
          end_time: string
          id: string
          notes: string | null
          org_id: string
          pay_rate_cents: number
          posted_by_user_id: string | null
          requires_cpr: boolean | null
          requires_dementia_cert: boolean | null
          requires_facility_orientation: boolean | null
          services_required: string[] | null
          shift_date: string
          start_time: string
          status: Database["public"]["Enums"]["business_shift_status"]
          template_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_cna_id?: string | null
          bill_rate_cents: number
          created_at?: string
          end_time: string
          id?: string
          notes?: string | null
          org_id: string
          pay_rate_cents: number
          posted_by_user_id?: string | null
          requires_cpr?: boolean | null
          requires_dementia_cert?: boolean | null
          requires_facility_orientation?: boolean | null
          services_required?: string[] | null
          shift_date: string
          start_time: string
          status?: Database["public"]["Enums"]["business_shift_status"]
          template_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_at?: string | null
          assigned_cna_id?: string | null
          bill_rate_cents?: number
          created_at?: string
          end_time?: string
          id?: string
          notes?: string | null
          org_id?: string
          pay_rate_cents?: number
          posted_by_user_id?: string | null
          requires_cpr?: boolean | null
          requires_dementia_cert?: boolean | null
          requires_facility_orientation?: boolean | null
          services_required?: string[] | null
          shift_date?: string
          start_time?: string
          status?: Database["public"]["Enums"]["business_shift_status"]
          template_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_shifts_assigned_cna_id_fkey"
            columns: ["assigned_cna_id"]
            isOneToOne: false
            referencedRelation: "cna_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "business_shifts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_shifts_posted_by_user_id_fkey"
            columns: ["posted_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_shifts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "shift_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      care_recipients: {
        Row: {
          allergies: string[] | null
          bio: string | null
          budget_max_cents: number | null
          budget_min_cents: number | null
          care_frequency: string | null
          care_types: string[] | null
          care_types_other: string | null
          client_id: string
          conditions: string[] | null
          created_at: string
          date_of_birth: string | null
          fav_foods: string[] | null
          fav_movies: string[] | null
          fav_music: string[] | null
          fav_shows: string[] | null
          hobbies: string[] | null
          hours_per_week: number | null
          id: string
          insurance_detail: string | null
          living_situation: string | null
          medications: string[] | null
          mobility_level: string | null
          name: string
          notes: string | null
          payer_type: Database["public"]["Enums"]["payer_type"] | null
          personal_other: string[] | null
          preferences: string | null
          priorities: string[] | null
          routines: string | null
          schedule_detail: string | null
          updated_at: string
        }
        Insert: {
          allergies?: string[] | null
          bio?: string | null
          budget_max_cents?: number | null
          budget_min_cents?: number | null
          care_frequency?: string | null
          care_types?: string[] | null
          care_types_other?: string | null
          client_id: string
          conditions?: string[] | null
          created_at?: string
          date_of_birth?: string | null
          fav_foods?: string[] | null
          fav_movies?: string[] | null
          fav_music?: string[] | null
          fav_shows?: string[] | null
          hobbies?: string[] | null
          hours_per_week?: number | null
          id?: string
          insurance_detail?: string | null
          living_situation?: string | null
          medications?: string[] | null
          mobility_level?: string | null
          name: string
          notes?: string | null
          payer_type?: Database["public"]["Enums"]["payer_type"] | null
          personal_other?: string[] | null
          preferences?: string | null
          priorities?: string[] | null
          routines?: string | null
          schedule_detail?: string | null
          updated_at?: string
        }
        Update: {
          allergies?: string[] | null
          bio?: string | null
          budget_max_cents?: number | null
          budget_min_cents?: number | null
          care_frequency?: string | null
          care_types?: string[] | null
          care_types_other?: string | null
          client_id?: string
          conditions?: string[] | null
          created_at?: string
          date_of_birth?: string | null
          fav_foods?: string[] | null
          fav_movies?: string[] | null
          fav_music?: string[] | null
          fav_shows?: string[] | null
          hobbies?: string[] | null
          hours_per_week?: number | null
          id?: string
          insurance_detail?: string | null
          living_situation?: string | null
          medications?: string[] | null
          mobility_level?: string | null
          name?: string
          notes?: string | null
          payer_type?: Database["public"]["Enums"]["payer_type"] | null
          personal_other?: string[] | null
          preferences?: string | null
          priorities?: string[] | null
          routines?: string | null
          schedule_detail?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "care_recipients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          billing_address: string | null
          city: string | null
          created_at: string
          name: string
          notes: string | null
          primary_contact_phone: string | null
          relationship_to_recipient: string | null
          setup_completed_at: string | null
          setup_skipped: boolean | null
          state: string | null
          street_address: string | null
          updated_at: string
          user_id: string
          zip: string
        }
        Insert: {
          billing_address?: string | null
          city?: string | null
          created_at?: string
          name: string
          notes?: string | null
          primary_contact_phone?: string | null
          relationship_to_recipient?: string | null
          setup_completed_at?: string | null
          setup_skipped?: boolean | null
          state?: string | null
          street_address?: string | null
          updated_at?: string
          user_id: string
          zip: string
        }
        Update: {
          billing_address?: string | null
          city?: string | null
          created_at?: string
          name?: string
          notes?: string | null
          primary_contact_phone?: string | null
          relationship_to_recipient?: string | null
          setup_completed_at?: string | null
          setup_skipped?: boolean | null
          state?: string | null
          street_address?: string | null
          updated_at?: string
          user_id?: string
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cna_availability: {
        Row: {
          cna_id: string
          created_at: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id: string
          is_active: boolean
          start_time: string
        }
        Insert: {
          cna_id: string
          created_at?: string
          day_of_week: Database["public"]["Enums"]["day_of_week"]
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
        }
        Update: {
          cna_id?: string
          created_at?: string
          day_of_week?: Database["public"]["Enums"]["day_of_week"]
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "cna_availability_cna_id_fkey"
            columns: ["cna_id"]
            isOneToOne: false
            referencedRelation: "cna_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cna_availability_overrides: {
        Row: {
          cna_id: string
          created_at: string
          end_at: string
          id: string
          is_available: boolean
          reason: string | null
          start_at: string
        }
        Insert: {
          cna_id: string
          created_at?: string
          end_at: string
          id?: string
          is_available: boolean
          reason?: string | null
          start_at: string
        }
        Update: {
          cna_id?: string
          created_at?: string
          end_at?: string
          id?: string
          is_available?: boolean
          reason?: string | null
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cna_availability_overrides_cna_id_fkey"
            columns: ["cna_id"]
            isOneToOne: false
            referencedRelation: "cna_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cna_profiles: {
        Row: {
          age_bracket: string | null
          application_answers: Json | null
          application_decline_reason: string | null
          application_media_kind: string | null
          application_media_path: string | null
          application_notes: string | null
          application_status: string | null
          application_submitted_at: string | null
          availability_status: Database["public"]["Enums"]["cna_availability_status"]
          bg_check_completed_at: string | null
          bg_check_status: string | null
          bio: string | null
          completed_shifts_count: number
          created_at: string
          display_name: string
          experience_hours: number | null
          experience_hours_reported: number | null
          welcome_seen_at: string | null
          credential: string | null
          gender: string | null
          headline: string | null
          hourly_rate_cents: number | null
          interview_at: string | null
          languages: string[] | null
          last_name: string | null
          license_expires_at: string | null
          license_number: string | null
          license_verified_at: string | null
          photo_url: string | null
          pronouns: string | null
          rating_avg: number | null
          rating_count: number
          resume_path: string | null
          service_lat: number | null
          service_lng: number | null
          service_radius_miles: number | null
          service_zip: string | null
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean
          tier: Database["public"]["Enums"]["cna_tier"]
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          age_bracket?: string | null
          application_answers?: Json | null
          application_decline_reason?: string | null
          application_media_kind?: string | null
          application_media_path?: string | null
          application_notes?: string | null
          application_status?: string | null
          application_submitted_at?: string | null
          availability_status?: Database["public"]["Enums"]["cna_availability_status"]
          bg_check_completed_at?: string | null
          bg_check_status?: string | null
          bio?: string | null
          completed_shifts_count?: number
          created_at?: string
          display_name: string
          experience_hours?: number | null
          experience_hours_reported?: number | null
          welcome_seen_at?: string | null
          credential?: string | null
          gender?: string | null
          headline?: string | null
          hourly_rate_cents?: number | null
          interview_at?: string | null
          languages?: string[] | null
          last_name?: string | null
          license_expires_at?: string | null
          license_number?: string | null
          license_verified_at?: string | null
          photo_url?: string | null
          pronouns?: string | null
          rating_avg?: number | null
          rating_count?: number
          resume_path?: string | null
          service_lat?: number | null
          service_lng?: number | null
          service_radius_miles?: number | null
          service_zip?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          tier?: Database["public"]["Enums"]["cna_tier"]
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          age_bracket?: string | null
          application_answers?: Json | null
          application_decline_reason?: string | null
          application_media_kind?: string | null
          application_media_path?: string | null
          application_notes?: string | null
          application_status?: string | null
          application_submitted_at?: string | null
          availability_status?: Database["public"]["Enums"]["cna_availability_status"]
          bg_check_completed_at?: string | null
          bg_check_status?: string | null
          bio?: string | null
          completed_shifts_count?: number
          created_at?: string
          display_name?: string
          experience_hours?: number | null
          experience_hours_reported?: number | null
          welcome_seen_at?: string | null
          credential?: string | null
          gender?: string | null
          headline?: string | null
          hourly_rate_cents?: number | null
          interview_at?: string | null
          languages?: string[] | null
          last_name?: string | null
          license_expires_at?: string | null
          license_number?: string | null
          license_verified_at?: string | null
          photo_url?: string | null
          pronouns?: string | null
          rating_avg?: number | null
          rating_count?: number
          resume_path?: string | null
          service_lat?: number | null
          service_lng?: number | null
          service_radius_miles?: number | null
          service_zip?: string | null
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          tier?: Database["public"]["Enums"]["cna_tier"]
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cna_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cna_service_areas: {
        Row: {
          cna_id: string
          created_at: string
          id: string
          is_active: boolean
          polygon_geojson: Json | null
          updated_at: string
          zip_codes: string[] | null
        }
        Insert: {
          cna_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          polygon_geojson?: Json | null
          updated_at?: string
          zip_codes?: string[] | null
        }
        Update: {
          cna_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          polygon_geojson?: Json | null
          updated_at?: string
          zip_codes?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "cna_service_areas_cna_id_fkey"
            columns: ["cna_id"]
            isOneToOne: false
            referencedRelation: "cna_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cna_services: {
        Row: {
          cna_id: string
          service_key: string
          years_experience: number | null
        }
        Insert: {
          cna_id: string
          service_key: string
          years_experience?: number | null
        }
        Update: {
          cna_id?: string
          service_key?: string
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cna_services_cna_id_fkey"
            columns: ["cna_id"]
            isOneToOne: false
            referencedRelation: "cna_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cna_services_service_key_fkey"
            columns: ["service_key"]
            isOneToOne: false
            referencedRelation: "service_taxonomy"
            referencedColumns: ["key"]
          },
        ]
      }
      cna_verifications: {
        Row: {
          cna_id: string
          created_at: string
          document_id: string | null
          expires_at: string | null
          external_id: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["verification_status"]
          type: Database["public"]["Enums"]["verification_type"]
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          cna_id: string
          created_at?: string
          document_id?: string | null
          expires_at?: string | null
          external_id?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          type: Database["public"]["Enums"]["verification_type"]
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          cna_id?: string
          created_at?: string
          document_id?: string | null
          expires_at?: string | null
          external_id?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          type?: Database["public"]["Enums"]["verification_type"]
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cna_verifications_cna_id_fkey"
            columns: ["cna_id"]
            isOneToOne: false
            referencedRelation: "cna_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "cna_verifications_document_fk"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          role: string | null
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          role?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          role?: string | null
          status?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_encrypted: boolean
          issued_at: string | null
          mime_type: string | null
          original_filename: string | null
          related_booking_id: string | null
          size_bytes: number | null
          storage_path: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_encrypted?: boolean
          issued_at?: string | null
          mime_type?: string | null
          original_filename?: string | null
          related_booking_id?: string | null
          size_bytes?: number | null
          storage_path: string
          type: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_encrypted?: boolean
          issued_at?: string | null
          mime_type?: string | null
          original_filename?: string | null
          related_booking_id?: string | null
          size_bytes?: number | null
          storage_path?: string
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          client_id: string
          cna_id: string
          created_at: string
          id: string
          notes: string | null
        }
        Insert: {
          client_id: string
          cna_id: string
          created_at?: string
          id?: string
          notes?: string | null
        }
        Update: {
          client_id?: string
          cna_id?: string
          created_at?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "favorites_cna_id_fkey"
            columns: ["cna_id"]
            isOneToOne: false
            referencedRelation: "cna_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          amount_cents: number
          created_at: string
          description: string
          hours: number | null
          id: string
          invoice_id: string
          rate_cents: number | null
          timesheet_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          description: string
          hours?: number | null
          id?: string
          invoice_id: string
          rate_cents?: number | null
          timesheet_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          description?: string
          hours?: number | null
          id?: string
          invoice_id?: string
          rate_cents?: number | null
          timesheet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_timesheet_id_fkey"
            columns: ["timesheet_id"]
            isOneToOne: false
            referencedRelation: "timesheets"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string
          markup_cents: number | null
          notes: string | null
          org_id: string
          paid_at: string | null
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          subtotal_cents: number
          tax_cents: number | null
          total_cents: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number: string
          markup_cents?: number | null
          notes?: string | null
          org_id: string
          paid_at?: string | null
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents: number
          tax_cents?: number | null
          total_cents: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string
          markup_cents?: number | null
          notes?: string | null
          org_id?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents?: number
          tax_cents?: number | null
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      job_applications: {
        Row: {
          cna_id: string
          created_at: string
          id: string
          job_id: string
          message: string | null
          proposed_hourly_rate_cents: number | null
          status: Database["public"]["Enums"]["job_application_status"]
          updated_at: string
        }
        Insert: {
          cna_id: string
          created_at?: string
          id?: string
          job_id: string
          message?: string | null
          proposed_hourly_rate_cents?: number | null
          status?: Database["public"]["Enums"]["job_application_status"]
          updated_at?: string
        }
        Update: {
          cna_id?: string
          created_at?: string
          id?: string
          job_id?: string
          message?: string | null
          proposed_hourly_rate_cents?: number | null
          status?: Database["public"]["Enums"]["job_application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_cna_id_fkey"
            columns: ["cna_id"]
            isOneToOne: false
            referencedRelation: "cna_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          budget_max_cents: number | null
          budget_min_cents: number | null
          care_recipient_id: string | null
          city: string | null
          client_id: string
          created_at: string
          description: string
          end_date: string | null
          expires_at: string | null
          hours_per_week: number | null
          id: string
          location_lat: number | null
          location_lng: number | null
          notify_nearby_cnas: boolean
          payer_type: Database["public"]["Enums"]["payer_type"]
          posted_at: string | null
          schedule_type: Database["public"]["Enums"]["job_schedule_type"]
          services_needed: string[]
          start_date: string | null
          state: string | null
          status: Database["public"]["Enums"]["job_status"]
          street_address: string | null
          title: string
          updated_at: string
          zip: string
        }
        Insert: {
          budget_max_cents?: number | null
          budget_min_cents?: number | null
          care_recipient_id?: string | null
          city?: string | null
          client_id: string
          created_at?: string
          description: string
          end_date?: string | null
          expires_at?: string | null
          hours_per_week?: number | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          notify_nearby_cnas?: boolean
          payer_type?: Database["public"]["Enums"]["payer_type"]
          posted_at?: string | null
          schedule_type?: Database["public"]["Enums"]["job_schedule_type"]
          services_needed?: string[]
          start_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          street_address?: string | null
          title: string
          updated_at?: string
          zip: string
        }
        Update: {
          budget_max_cents?: number | null
          budget_min_cents?: number | null
          care_recipient_id?: string | null
          city?: string | null
          client_id?: string
          created_at?: string
          description?: string
          end_date?: string | null
          expires_at?: string | null
          hours_per_week?: number | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          notify_nearby_cnas?: boolean
          payer_type?: Database["public"]["Enums"]["payer_type"]
          posted_at?: string | null
          schedule_type?: Database["public"]["Enums"]["job_schedule_type"]
          services_needed?: string[]
          start_date?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          street_address?: string | null
          title?: string
          updated_at?: string
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_care_recipient_id_fkey"
            columns: ["care_recipient_id"]
            isOneToOne: false
            referencedRelation: "care_recipients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      leads: {
        Row: {
          bg_check: string | null
          contact: string
          created_at: string
          credential: string | null
          experience_hours: string | null
          id: string
          name: string
          note: string | null
          own_insurance: string | null
          role: string
          source: string
          status: string
        }
        Insert: {
          bg_check?: string | null
          contact: string
          created_at?: string
          credential?: string | null
          experience_hours?: string | null
          id?: string
          name: string
          note?: string | null
          own_insurance?: string | null
          role: string
          source?: string
          status?: string
        }
        Update: {
          bg_check?: string | null
          contact?: string
          created_at?: string
          credential?: string | null
          experience_hours?: string | null
          id?: string
          name?: string
          note?: string | null
          own_insurance?: string | null
          role?: string
          source?: string
          status?: string
        }
        Relationships: []
      }
      memberships: {
        Row: {
          comp_reason: string | null
          created_at: string
          current_period_end: string | null
          founding: boolean
          plan_key: string | null
          role: Database["public"]["Enums"]["user_role"]
          startup_fee_paid_at: string | null
          startup_fee_waived: boolean
          status: Database["public"]["Enums"]["membership_status"]
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comp_reason?: string | null
          created_at?: string
          current_period_end?: string | null
          founding?: boolean
          plan_key?: string | null
          role: Database["public"]["Enums"]["user_role"]
          startup_fee_paid_at?: string | null
          startup_fee_waived?: boolean
          status?: Database["public"]["Enums"]["membership_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comp_reason?: string | null
          created_at?: string
          current_period_end?: string | null
          founding?: boolean
          plan_key?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          startup_fee_paid_at?: string | null
          startup_fee_waived?: boolean
          status?: Database["public"]["Enums"]["membership_status"]
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_plan_key_fkey"
            columns: ["plan_key"]
            isOneToOne: false
            referencedRelation: "access_plans"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      message_threads: {
        Row: {
          accepted_at: string | null
          booking_id: string | null
          created_at: string
          id: string
          job_id: string | null
          last_message_at: string | null
          last_message_preview: string | null
          participant_a: string
          participant_b: string
          started_by: string | null
          started_via: string | null
          status: string
          unread_count_a: number
          unread_count_b: number
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          booking_id?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          participant_a: string
          participant_b: string
          started_by?: string | null
          started_via?: string | null
          status?: string
          unread_count_a?: number
          unread_count_b?: number
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          booking_id?: string | null
          created_at?: string
          id?: string
          job_id?: string | null
          last_message_at?: string | null
          last_message_preview?: string | null
          participant_a?: string
          participant_b?: string
          started_by?: string | null
          started_via?: string | null
          status?: string
          unread_count_a?: number
          unread_count_b?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_participant_a_fkey"
            columns: ["participant_a"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_participant_b_fkey"
            columns: ["participant_b"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_started_by_fkey"
            columns: ["started_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_url: string | null
          body: string
          created_at: string
          delivered_at: string | null
          id: string
          is_encrypted: boolean
          read_at: string | null
          recipient_id: string
          sender_id: string
          thread_id: string
        }
        Insert: {
          attachment_url?: string | null
          body: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          is_encrypted?: boolean
          read_at?: string | null
          recipient_id: string
          sender_id: string
          thread_id: string
        }
        Update: {
          attachment_url?: string | null
          body?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          is_encrypted?: boolean
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          booking_id: string | null
          channel: Database["public"]["Enums"]["notification_channel"]
          created_at: string
          delivered_at: string | null
          external_id: string | null
          id: string
          job_id: string | null
          message_id: string | null
          read_at: string | null
          sent_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          booking_id?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivered_at?: string | null
          external_id?: string | null
          id?: string
          job_id?: string | null
          message_id?: string | null
          read_at?: string | null
          sent_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          booking_id?: string | null
          channel?: Database["public"]["Enums"]["notification_channel"]
          created_at?: string
          delivered_at?: string | null
          external_id?: string | null
          id?: string
          job_id?: string | null
          message_id?: string | null
          read_at?: string | null
          sent_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_compliance_docs: {
        Row: {
          created_at: string
          document_id: string | null
          effective_at: string | null
          expires_at: string | null
          id: string
          notes: string | null
          org_id: string
          type: Database["public"]["Enums"]["compliance_doc_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id?: string | null
          effective_at?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          org_id: string
          type: Database["public"]["Enums"]["compliance_doc_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string | null
          effective_at?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          org_id?: string
          type?: Database["public"]["Enums"]["compliance_doc_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_compliance_docs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_compliance_docs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          invited_at: string | null
          joined_at: string | null
          org_id: string
          permissions: string[] | null
          role: Database["public"]["Enums"]["org_member_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          org_id: string
          permissions?: string[] | null
          role?: Database["public"]["Enums"]["org_member_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string | null
          joined_at?: string | null
          org_id?: string
          permissions?: string[] | null
          role?: Database["public"]["Enums"]["org_member_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          baa_signed: boolean
          billing_email: string | null
          billing_terms: string | null
          capacity: number | null
          city: string | null
          coi_on_file: boolean
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          ein: string | null
          id: string
          lat: number | null
          license_number: string | null
          lng: number | null
          markup_pct: number | null
          name: string
          pricing_model: string | null
          primary_contact_name: string | null
          slug: string
          specialty: string | null
          state: string | null
          status: Database["public"]["Enums"]["org_status"]
          street_address: string | null
          stripe_customer_id: string | null
          type: Database["public"]["Enums"]["org_type"]
          updated_at: string
          zip: string | null
        }
        Insert: {
          baa_signed?: boolean
          billing_email?: string | null
          billing_terms?: string | null
          capacity?: number | null
          city?: string | null
          coi_on_file?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          ein?: string | null
          id?: string
          lat?: number | null
          license_number?: string | null
          lng?: number | null
          markup_pct?: number | null
          name: string
          pricing_model?: string | null
          primary_contact_name?: string | null
          slug: string
          specialty?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["org_status"]
          street_address?: string | null
          stripe_customer_id?: string | null
          type: Database["public"]["Enums"]["org_type"]
          updated_at?: string
          zip?: string | null
        }
        Update: {
          baa_signed?: boolean
          billing_email?: string | null
          billing_terms?: string | null
          capacity?: number | null
          city?: string | null
          coi_on_file?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          ein?: string | null
          id?: string
          lat?: number | null
          license_number?: string | null
          lng?: number | null
          markup_pct?: number | null
          name?: string
          pricing_model?: string | null
          primary_contact_name?: string | null
          slug?: string
          specialty?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["org_status"]
          street_address?: string | null
          stripe_customer_id?: string | null
          type?: Database["public"]["Enums"]["org_type"]
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          card_brand: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          card_last4: string | null
          created_at: string
          id: string
          is_default: boolean
          stripe_customer_id: string
          stripe_payment_method_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          stripe_customer_id: string
          stripe_payment_method_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_brand?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          card_last4?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          stripe_customer_id?: string
          stripe_payment_method_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          authorized_at: string | null
          booking_id: string
          captured_at: string | null
          client_id: string
          cna_id: string
          cna_payout_cents: number
          created_at: string
          failure_reason: string | null
          gross_amount_cents: number
          id: string
          platform_fee_cents: number
          refunded_at: string | null
          released_at: string | null
          shift_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          stripe_processing_fee_cents: number | null
          stripe_refund_id: string | null
          stripe_transfer_id: string | null
          updated_at: string
        }
        Insert: {
          authorized_at?: string | null
          booking_id: string
          captured_at?: string | null
          client_id: string
          cna_id: string
          cna_payout_cents: number
          created_at?: string
          failure_reason?: string | null
          gross_amount_cents: number
          id?: string
          platform_fee_cents: number
          refunded_at?: string | null
          released_at?: string | null
          shift_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_processing_fee_cents?: number | null
          stripe_refund_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Update: {
          authorized_at?: string | null
          booking_id?: string
          captured_at?: string | null
          client_id?: string
          cna_id?: string
          cna_payout_cents?: number
          created_at?: string
          failure_reason?: string | null
          gross_amount_cents?: number
          id?: string
          platform_fee_cents?: number
          refunded_at?: string | null
          released_at?: string | null
          shift_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_processing_fee_cents?: number | null
          stripe_refund_id?: string | null
          stripe_transfer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_cna_id_fkey"
            columns: ["cna_id"]
            isOneToOne: false
            referencedRelation: "cna_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "payments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_fee_config: {
        Row: {
          fee_pct_new: number
          fee_pct_top_rated: number
          fee_pct_verified: number
          id: number
          training_referral_pct: number
          updated_at: string
        }
        Insert: {
          fee_pct_new?: number
          fee_pct_top_rated?: number
          fee_pct_verified?: number
          id?: number
          training_referral_pct?: number
          updated_at?: string
        }
        Update: {
          fee_pct_new?: number
          fee_pct_top_rated?: number
          fee_pct_verified?: number
          id?: number
          training_referral_pct?: number
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          initiated_by: string | null
          payment_id: string
          reason: string
          stripe_refund_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          initiated_by?: string | null
          payment_id: string
          reason: string
          stripe_refund_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          initiated_by?: string | null
          payment_id?: string
          reason?: string
          stripe_refund_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refunds_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          booking_id: string
          created_at: string
          id: string
          is_visible: boolean
          rating: number
          reviewee_id: string
          reviewer_id: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          booking_id: string
          created_at?: string
          id?: string
          is_visible?: boolean
          rating: number
          reviewee_id: string
          reviewer_id: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          is_visible?: boolean
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_jobs: {
        Row: {
          cna_id: string
          created_at: string
          job_id: string
        }
        Insert: {
          cna_id: string
          created_at?: string
          job_id: string
        }
        Update: {
          cna_id?: string
          created_at?: string
          job_id?: string
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters: Json
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      service_taxonomy: {
        Row: {
          category: string
          description: string | null
          display_order: number
          key: string
          label: string
          requires_certification: boolean
        }
        Insert: {
          category: string
          description?: string | null
          display_order?: number
          key: string
          label: string
          requires_certification?: boolean
        }
        Update: {
          category?: string
          description?: string | null
          display_order?: number
          key?: string
          label?: string
          requires_certification?: boolean
        }
        Relationships: []
      }
      shift_templates: {
        Row: {
          bill_rate_cents: number
          created_at: string
          day_of_week: Database["public"]["Enums"]["day_of_week"] | null
          end_time: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          org_id: string
          pay_rate_cents: number
          services_required: string[] | null
          start_time: string
          updated_at: string
        }
        Insert: {
          bill_rate_cents: number
          created_at?: string
          day_of_week?: Database["public"]["Enums"]["day_of_week"] | null
          end_time: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          org_id: string
          pay_rate_cents: number
          services_required?: string[] | null
          start_time: string
          updated_at?: string
        }
        Update: {
          bill_rate_cents?: number
          created_at?: string
          day_of_week?: Database["public"]["Enums"]["day_of_week"] | null
          end_time?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          org_id?: string
          pay_rate_cents?: number
          services_required?: string[] | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          booking_id: string
          clock_in: string | null
          clock_in_lat: number | null
          clock_in_lng: number | null
          clock_out: string | null
          clock_out_lat: number | null
          clock_out_lng: number | null
          created_at: string
          evv_submitted_at: string | null
          evv_vendor_reference: string | null
          hours_worked: number | null
          id: string
          notes: string | null
          scheduled_end: string
          scheduled_start: string
          status: Database["public"]["Enums"]["shift_status"]
          updated_at: string
        }
        Insert: {
          booking_id: string
          clock_in?: string | null
          clock_in_lat?: number | null
          clock_in_lng?: number | null
          clock_out?: string | null
          clock_out_lat?: number | null
          clock_out_lng?: number | null
          created_at?: string
          evv_submitted_at?: string | null
          evv_vendor_reference?: string | null
          hours_worked?: number | null
          id?: string
          notes?: string | null
          scheduled_end: string
          scheduled_start: string
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
        }
        Update: {
          booking_id?: string
          clock_in?: string | null
          clock_in_lat?: number | null
          clock_in_lng?: number | null
          clock_out?: string | null
          clock_out_lat?: number | null
          clock_out_lng?: number | null
          created_at?: string
          evv_submitted_at?: string | null
          evv_vendor_reference?: string | null
          hours_worked?: number | null
          id?: string
          notes?: string | null
          scheduled_end?: string
          scheduled_start?: string
          status?: Database["public"]["Enums"]["shift_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      tag_bank: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          id: string
          label: string
          label_norm: string
          status: string
          usage_count: number
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          id?: string
          label: string
          label_norm: string
          status?: string
          usage_count?: number
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          label_norm?: string
          status?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "tag_bank_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          approved_at: string | null
          approved_notes: string | null
          break_minutes: number | null
          clock_in: string | null
          clock_out: string | null
          cna_id: string
          created_at: string
          hours_worked: number | null
          id: string
          shift_id: string
          status: string
          supervisor_id: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_notes?: string | null
          break_minutes?: number | null
          clock_in?: string | null
          clock_out?: string | null
          cna_id: string
          created_at?: string
          hours_worked?: number | null
          id?: string
          shift_id: string
          status?: string
          supervisor_id?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_notes?: string | null
          break_minutes?: number | null
          clock_in?: string | null
          clock_out?: string | null
          cna_id?: string
          created_at?: string
          hours_worked?: number | null
          id?: string
          shift_id?: string
          status?: string
          supervisor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_cna_id_fkey"
            columns: ["cna_id"]
            isOneToOne: false
            referencedRelation: "cna_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "timesheets_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "business_shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      training_partner_cohorts: {
        Row: {
          created_at: string
          end_date: string | null
          enrollment_deadline: string | null
          id: string
          is_active: boolean
          partner_id: string
          schedule_label: string | null
          seats_remaining: number | null
          seats_total: number | null
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          enrollment_deadline?: string | null
          id?: string
          is_active?: boolean
          partner_id: string
          schedule_label?: string | null
          seats_remaining?: number | null
          seats_total?: number | null
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          enrollment_deadline?: string | null
          id?: string
          is_active?: boolean
          partner_id?: string
          schedule_label?: string | null
          seats_remaining?: number | null
          seats_total?: number | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_partner_cohorts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "training_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      training_partners: {
        Row: {
          calendar_api_url: string | null
          calendar_provider: string | null
          city: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contract_signed_at: string | null
          created_at: string
          description: string | null
          evening_cohorts: boolean | null
          hero_image_url: string | null
          id: string
          lat: number | null
          lng: number | null
          logo_url: string | null
          name: string
          payment_model: Database["public"]["Enums"]["referral_payment_model"]
          payment_plans_available: boolean | null
          pell_eligible: boolean | null
          program_length_weeks: number | null
          referral_fee_cents: number | null
          referral_pct: number | null
          slug: string
          state: string | null
          status: Database["public"]["Enums"]["training_partner_status"]
          street_address: string | null
          tuition_cents: number | null
          updated_at: string
          website_url: string | null
          weekend_cohorts: boolean | null
          zip: string | null
        }
        Insert: {
          calendar_api_url?: string | null
          calendar_provider?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_signed_at?: string | null
          created_at?: string
          description?: string | null
          evening_cohorts?: boolean | null
          hero_image_url?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name: string
          payment_model?: Database["public"]["Enums"]["referral_payment_model"]
          payment_plans_available?: boolean | null
          pell_eligible?: boolean | null
          program_length_weeks?: number | null
          referral_fee_cents?: number | null
          referral_pct?: number | null
          slug: string
          state?: string | null
          status?: Database["public"]["Enums"]["training_partner_status"]
          street_address?: string | null
          tuition_cents?: number | null
          updated_at?: string
          website_url?: string | null
          weekend_cohorts?: boolean | null
          zip?: string | null
        }
        Update: {
          calendar_api_url?: string | null
          calendar_provider?: string | null
          city?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contract_signed_at?: string | null
          created_at?: string
          description?: string | null
          evening_cohorts?: boolean | null
          hero_image_url?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          payment_model?: Database["public"]["Enums"]["referral_payment_model"]
          payment_plans_available?: boolean | null
          pell_eligible?: boolean | null
          program_length_weeks?: number | null
          referral_fee_cents?: number | null
          referral_pct?: number | null
          slug?: string
          state?: string | null
          status?: Database["public"]["Enums"]["training_partner_status"]
          street_address?: string | null
          tuition_cents?: number | null
          updated_at?: string
          website_url?: string | null
          weekend_cohorts?: boolean | null
          zip?: string | null
        }
        Relationships: []
      }
      training_referrals: {
        Row: {
          cohort_id: string | null
          completed_at: string | null
          created_at: string
          enrolled_at: string | null
          id: string
          lead_email: string | null
          lead_name: string | null
          lead_phone: string | null
          lead_zip: string | null
          notes: string | null
          paid_at: string | null
          partner_id: string
          referral_fee_cents: number | null
          referred_at: string
          status: Database["public"]["Enums"]["training_referral_status"]
          stripe_payment_intent_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cohort_id?: string | null
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string | null
          id?: string
          lead_email?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          lead_zip?: string | null
          notes?: string | null
          paid_at?: string | null
          partner_id: string
          referral_fee_cents?: number | null
          referred_at?: string
          status?: Database["public"]["Enums"]["training_referral_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cohort_id?: string | null
          completed_at?: string | null
          created_at?: string
          enrolled_at?: string | null
          id?: string
          lead_email?: string | null
          lead_name?: string | null
          lead_phone?: string | null
          lead_zip?: string | null
          notes?: string | null
          paid_at?: string | null
          partner_id?: string
          referral_fee_cents?: number | null
          referred_at?: string
          status?: Database["public"]["Enums"]["training_referral_status"]
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "training_referrals_cohort_id_fkey"
            columns: ["cohort_id"]
            isOneToOne: false
            referencedRelation: "training_partner_cohorts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_referrals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "training_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "training_referrals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_devices: {
        Row: {
          created_at: string
          device_token: string
          id: string
          last_active_at: string | null
          platform: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_token: string
          id?: string
          last_active_at?: string | null
          platform: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_token?: string
          id?: string
          last_active_at?: string | null
          platform?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          last_active_at: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          last_active_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          last_active_at?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      browse_caregivers: {
        Args: never
        Returns: {
          availability_status: Database["public"]["Enums"]["cna_availability_status"]
          bio: string
          display_name: string
          experience_hours: number
          gender: string
          headline: string
          hourly_rate_cents: number
          identity_unlocked: boolean
          languages: string[]
          last_name: string
          photo_url: string
          rating_avg: number
          rating_count: number
          service_radius_miles: number
          service_zip: string
          services: string[]
          user_id: string
          years_experience: number
        }[]
      }
      browse_open_jobs: {
        Args: never
        Returns: {
          budget_max_cents: number
          budget_min_cents: number
          city: string
          description: string
          details_unlocked: boolean
          hours_per_week: number
          id: string
          posted_at: string
          schedule_type: Database["public"]["Enums"]["job_schedule_type"]
          services_needed: string[]
          start_date: string
          state: string
          status: Database["public"]["Enums"]["job_status"]
          street_address: string
          title: string
          zip: string
        }[]
      }
      caregiver_cards: {
        Args: { ids: string[] }
        Returns: {
          availability_status: Database["public"]["Enums"]["cna_availability_status"]
          bio: string
          completed_shifts_count: number
          display_name: string
          experience_hours: number
          headline: string
          hourly_rate_cents: number
          languages: string[]
          last_name: string
          photo_url: string
          rating_avg: number
          rating_count: number
          service_zip: string
          tier: Database["public"]["Enums"]["cna_tier"]
          user_id: string
          years_experience: number
        }[]
      }
      earth: { Args: never; Returns: number }
      miles_between: {
        Args: { lat1: number; lat2: number; lng1: number; lng2: number }
        Returns: number
      }
      my_access: {
        Args: never
        Returns: {
          current_period_end: string
          founding: boolean
          founding_slots_left: number
          is_listed: boolean
          is_member: boolean
          meets_standard: boolean
          membership_status: Database["public"]["Enums"]["membership_status"]
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      access_for: {
        Args: { uid: string }
        Returns: {
          current_period_end: string
          founding: boolean
          founding_slots_left: number
          is_listed: boolean
          is_member: boolean
          meets_standard: boolean
          membership_status: Database["public"]["Enums"]["membership_status"]
          role: Database["public"]["Enums"]["user_role"]
        }[]
      }
      admin_prepare_user_delete: { Args: { target: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      booking_status:
        | "scheduled"
        | "active"
        | "completed"
        | "cancelled"
        | "disputed"
      business_shift_status:
        | "open"
        | "assigned"
        | "in_progress"
        | "completed"
        | "no_show"
        | "cancelled"
      cna_availability_status:
        | "available"
        | "fully_booked"
        | "on_break"
        | "inactive"
      cna_tier: "new" | "verified" | "top_rated"
      compliance_doc_type:
        | "baa"
        | "coi"
        | "vendor_agreement"
        | "w9"
        | "license"
        | "msa"
      day_of_week:
        | "sunday"
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
      document_type:
        | "license"
        | "bg_check"
        | "cpr_card"
        | "first_aid_card"
        | "tb_test"
        | "covid_vax"
        | "immunization_record"
        | "reference_letter"
        | "liability_insurance"
        | "auto_insurance"
        | "drivers_license"
        | "profile_photo"
        | "id_verification"
        | "w9"
        | "visit_log"
        | "invoice"
        | "other"
        | "work_history"
      invoice_status: "draft" | "sent" | "paid" | "overdue" | "void"
      job_application_status:
        | "submitted"
        | "shortlisted"
        | "rejected"
        | "withdrawn"
        | "accepted"
      job_schedule_type: "one_time" | "recurring" | "live_in" | "on_call"
      job_status:
        | "draft"
        | "open"
        | "in_review"
        | "filled"
        | "cancelled"
        | "expired"
      membership_status: "none" | "active" | "comped" | "past_due" | "canceled"
      notification_channel: "in_app" | "email" | "sms" | "push"
      notification_type:
        | "job_match"
        | "job_application"
        | "application_accepted"
        | "application_rejected"
        | "booking_confirmed"
        | "shift_reminder"
        | "shift_starting_soon"
        | "message_received"
        | "payment_received"
        | "payment_failed"
        | "review_received"
        | "document_expiring"
        | "bg_check_complete"
        | "tier_promotion"
        | "system_announcement"
      org_member_role: "admin" | "scheduler" | "hr" | "billing" | "supervisor"
      org_status: "prospect" | "onboarding" | "active" | "paused" | "churned"
      org_type:
        | "alf"
        | "memory_care"
        | "snf"
        | "hha"
        | "hospital"
        | "hospice"
        | "independent_living"
        | "adult_day"
        | "other"
      payer_type:
        | "self_pay"
        | "ltc_insurance"
        | "medicaid"
        | "medicare_advantage"
        | "va"
        | "workers_comp"
      payment_status:
        | "pending"
        | "authorized"
        | "captured"
        | "released"
        | "refunded"
        | "partially_refunded"
        | "failed"
        | "disputed"
      referral_payment_model: "flat_fee" | "kindred_checkout" | "affiliate"
      shift_status:
        | "scheduled"
        | "clocked_in"
        | "clocked_out"
        | "completed"
        | "no_show"
        | "cancelled"
        | "disputed"
      training_partner_status: "prospect" | "active" | "paused" | "archived"
      training_referral_status:
        | "referred"
        | "contacted"
        | "enrolled"
        | "completed"
        | "paid"
        | "cancelled"
        | "no_show"
      user_role: "client" | "cna" | "business" | "admin"
      user_status: "pending" | "active" | "suspended" | "deleted"
      verification_status: "pending" | "verified" | "rejected" | "expired"
      verification_type:
        | "l2bg"
        | "cpr"
        | "license"
        | "insurance"
        | "tb_test"
        | "covid_vax"
        | "first_aid"
        | "dementia_cert"
        | "hospice_cert"
        | "driver_license"
        | "auto_insurance"
        | "identity"
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
      booking_status: [
        "scheduled",
        "active",
        "completed",
        "cancelled",
        "disputed",
      ],
      business_shift_status: [
        "open",
        "assigned",
        "in_progress",
        "completed",
        "no_show",
        "cancelled",
      ],
      cna_availability_status: [
        "available",
        "fully_booked",
        "on_break",
        "inactive",
      ],
      cna_tier: ["new", "verified", "top_rated"],
      compliance_doc_type: [
        "baa",
        "coi",
        "vendor_agreement",
        "w9",
        "license",
        "msa",
      ],
      day_of_week: [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ],
      document_type: [
        "license",
        "bg_check",
        "cpr_card",
        "first_aid_card",
        "tb_test",
        "covid_vax",
        "immunization_record",
        "reference_letter",
        "liability_insurance",
        "auto_insurance",
        "drivers_license",
        "profile_photo",
        "id_verification",
        "w9",
        "visit_log",
        "invoice",
        "other",
        "work_history",
      ],
      invoice_status: ["draft", "sent", "paid", "overdue", "void"],
      job_application_status: [
        "submitted",
        "shortlisted",
        "rejected",
        "withdrawn",
        "accepted",
      ],
      job_schedule_type: ["one_time", "recurring", "live_in", "on_call"],
      job_status: [
        "draft",
        "open",
        "in_review",
        "filled",
        "cancelled",
        "expired",
      ],
      membership_status: ["none", "active", "comped", "past_due", "canceled"],
      notification_channel: ["in_app", "email", "sms", "push"],
      notification_type: [
        "job_match",
        "job_application",
        "application_accepted",
        "application_rejected",
        "booking_confirmed",
        "shift_reminder",
        "shift_starting_soon",
        "message_received",
        "payment_received",
        "payment_failed",
        "review_received",
        "document_expiring",
        "bg_check_complete",
        "tier_promotion",
        "system_announcement",
      ],
      org_member_role: ["admin", "scheduler", "hr", "billing", "supervisor"],
      org_status: ["prospect", "onboarding", "active", "paused", "churned"],
      org_type: [
        "alf",
        "memory_care",
        "snf",
        "hha",
        "hospital",
        "hospice",
        "independent_living",
        "adult_day",
        "other",
      ],
      payer_type: [
        "self_pay",
        "ltc_insurance",
        "medicaid",
        "medicare_advantage",
        "va",
        "workers_comp",
      ],
      payment_status: [
        "pending",
        "authorized",
        "captured",
        "released",
        "refunded",
        "partially_refunded",
        "failed",
        "disputed",
      ],
      referral_payment_model: ["flat_fee", "kindred_checkout", "affiliate"],
      shift_status: [
        "scheduled",
        "clocked_in",
        "clocked_out",
        "completed",
        "no_show",
        "cancelled",
        "disputed",
      ],
      training_partner_status: ["prospect", "active", "paused", "archived"],
      training_referral_status: [
        "referred",
        "contacted",
        "enrolled",
        "completed",
        "paid",
        "cancelled",
        "no_show",
      ],
      user_role: ["client", "cna", "business", "admin"],
      user_status: ["pending", "active", "suspended", "deleted"],
      verification_status: ["pending", "verified", "rejected", "expired"],
      verification_type: [
        "l2bg",
        "cpr",
        "license",
        "insurance",
        "tb_test",
        "covid_vax",
        "first_aid",
        "dementia_cert",
        "hospice_cert",
        "driver_license",
        "auto_insurance",
        "identity",
      ],
    },
  },
} as const
