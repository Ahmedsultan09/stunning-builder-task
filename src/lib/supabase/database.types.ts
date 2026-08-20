export type Database = {
  public: {
    Tables: {
      brief_integrations: {
        Row: {
          brief_id: number;
          integration_id: string;
        };
        Insert: {
          brief_id: number;
          integration_id: string;
        };
        Update: {
          brief_id?: number;
          integration_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "brief_integrations_brief_id_fkey";
            columns: ["brief_id"];
            isOneToOne: false;
            referencedRelation: "briefs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "brief_integrations_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "integrations";
            referencedColumns: ["id"];
          },
        ];
      };
      briefs: {
        Row: {
          client_request_id: string;
          created_at: string;
          id: number;
          output: string;
          prompt: string;
          user_id: string;
        };
        Insert: {
          client_request_id: string;
          created_at?: string;
          id?: never;
          output: string;
          prompt: string;
          user_id?: string;
        };
        Update: {
          client_request_id?: string;
          created_at?: string;
          id?: never;
          output?: string;
          prompt?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      integrations: {
        Row: {
          created_at: string;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          name: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      save_brief: {
        Args: {
          p_client_request_id: string;
          p_integration_ids?: string[];
          p_output: string;
          p_prompt: string;
        };
        Returns: {
          created_at: string;
          id: number;
        }[];
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
};
