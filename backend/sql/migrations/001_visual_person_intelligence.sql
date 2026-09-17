CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE vpi_people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_vpi_people_tenant ON vpi_people (tenant_id) WHERE deleted_at IS NULL;

CREATE TABLE vpi_photo_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  library_asset_id varchar(512) NOT NULL,
  original_object_key varchar(2048) NOT NULL,
  captured_at timestamptz NOT NULL,
  content_hash varchar(128) NOT NULL,
  perceptual_hash varchar(128),
  latitude double precision,
  longitude double precision,
  width integer,
  height integer,
  source_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  pipeline_status varchar(32) NOT NULL DEFAULT 'queued',
  pipeline_version varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT uq_vpi_asset_library_id UNIQUE (tenant_id, library_asset_id)
);
CREATE INDEX idx_vpi_assets_tenant_time ON vpi_photo_assets (tenant_id, captured_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_vpi_assets_pending ON vpi_photo_assets (pipeline_status) WHERE deleted_at IS NULL;

CREATE TABLE vpi_asset_embeddings (
  asset_id uuid PRIMARY KEY REFERENCES vpi_photo_assets(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL,
  model_version varchar(64) NOT NULL,
  embedding vector(768) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vpi_asset_embeddings_vector ON vpi_asset_embeddings
  USING hnsw (embedding vector_cosine_ops);

CREATE TABLE vpi_face_detections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  asset_id uuid NOT NULL REFERENCES vpi_photo_assets(id) ON DELETE CASCADE,
  bounding_box jsonb NOT NULL,
  quality_score double precision NOT NULL CHECK (quality_score >= 0 AND quality_score <= 1),
  embedding vector(512) NOT NULL,
  model_version varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vpi_face_detection_asset ON vpi_face_detections (asset_id);
CREATE INDEX idx_vpi_face_embeddings_vector ON vpi_face_detections
  USING hnsw (embedding vector_cosine_ops);

CREATE TABLE vpi_identity_clusters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  assigned_person_id uuid REFERENCES vpi_people(id) ON DELETE SET NULL,
  status varchar(32) NOT NULL DEFAULT 'anonymous'
    CHECK (status IN ('anonymous', 'assigned', 'merged', 'deleted')),
  confidence double precision NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  representative_asset_id uuid REFERENCES vpi_photo_assets(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_vpi_clusters_tenant ON vpi_identity_clusters (tenant_id) WHERE deleted_at IS NULL;

CREATE TABLE vpi_identity_cluster_members (
  cluster_id uuid NOT NULL REFERENCES vpi_identity_clusters(id) ON DELETE CASCADE,
  face_detection_id uuid NOT NULL REFERENCES vpi_face_detections(id) ON DELETE CASCADE,
  membership_confidence double precision NOT NULL CHECK (membership_confidence >= 0 AND membership_confidence <= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (cluster_id, face_detection_id)
);

CREATE TABLE vpi_atomic_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  asset_id uuid NOT NULL REFERENCES vpi_photo_assets(id) ON DELETE CASCADE,
  kind varchar(32) NOT NULL CHECK (kind IN ('activity', 'setting', 'object', 'interaction')),
  label varchar(128) NOT NULL,
  confidence double precision NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  bounding_box jsonb,
  model_version varchar(64) NOT NULL,
  taxonomy_version varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (label NOT IN (
    'race', 'religion', 'health', 'sexuality', 'politics',
    'emotion', 'relationship_status', 'moral_character'
  ))
);
CREATE INDEX idx_vpi_observations_asset ON vpi_atomic_observations (asset_id);
CREATE INDEX idx_vpi_observations_label ON vpi_atomic_observations (tenant_id, label);

CREATE TABLE vpi_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'confirmed', 'rejected', 'deleted')),
  occurred_at timestamptz NOT NULL,
  ends_at timestamptz,
  title varchar(280),
  activity_labels jsonb NOT NULL DEFAULT '[]'::jsonb,
  place_precision varchar(32) NOT NULL DEFAULT 'none'
    CHECK (place_precision IN ('none', 'coarse', 'exact')),
  location_key varchar(128),
  confidence double precision NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  pipeline_version varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
CREATE INDEX idx_vpi_events_tenant_time ON vpi_events (tenant_id, occurred_at) WHERE deleted_at IS NULL;

CREATE TABLE vpi_event_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES vpi_events(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES vpi_photo_assets(id) ON DELETE CASCADE,
  evidence_weight double precision NOT NULL CHECK (evidence_weight >= 0 AND evidence_weight <= 1),
  CONSTRAINT uq_vpi_event_asset UNIQUE (event_id, asset_id)
);

CREATE TABLE vpi_event_participants (
  event_id uuid NOT NULL REFERENCES vpi_events(id) ON DELETE CASCADE,
  identity_cluster_id uuid NOT NULL REFERENCES vpi_identity_clusters(id) ON DELETE CASCADE,
  confidence double precision NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  PRIMARY KEY (event_id, identity_cluster_id)
);

CREATE TABLE vpi_inferred_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  subject_person_id uuid REFERENCES vpi_people(id) ON DELETE SET NULL,
  subject_cluster_id uuid NOT NULL REFERENCES vpi_identity_clusters(id) ON DELETE CASCADE,
  claim_type varchar(64) NOT NULL,
  value text NOT NULL,
  confidence double precision NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  alternative text NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'proposed'
    CHECK (status IN ('proposed', 'confirmed', 'rejected', 'expired')),
  calibration_version varchar(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE INDEX idx_vpi_claims_tenant_subject ON vpi_inferred_claims (tenant_id, subject_cluster_id, status);

CREATE TABLE vpi_claim_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid NOT NULL REFERENCES vpi_inferred_claims(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES vpi_events(id) ON DELETE CASCADE,
  asset_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  CONSTRAINT uq_vpi_claim_event UNIQUE (claim_id, event_id)
);

CREATE TABLE vpi_consent_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  purpose varchar(64) NOT NULL CHECK (purpose IN (
    'library_import', 'face_processing', 'gps_processing', 'remote_inference', 'event_search'
  )),
  scope jsonb NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  policy_version varchar(64) NOT NULL
);
CREATE INDEX idx_vpi_consent_active ON vpi_consent_receipts (tenant_id, purpose) WHERE revoked_at IS NULL;

CREATE TABLE vpi_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  action varchar(96) NOT NULL,
  subject_type varchar(64) NOT NULL,
  subject_id uuid NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_vpi_audit_tenant_time ON vpi_audit_events (tenant_id, created_at DESC);

-- The API is deployed behind an authenticated BFF. RLS protects direct database access as defence in depth.
ALTER TABLE vpi_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE vpi_photo_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE vpi_asset_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vpi_face_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE vpi_identity_clusters ENABLE ROW LEVEL SECURITY;
ALTER TABLE vpi_atomic_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vpi_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vpi_inferred_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE vpi_consent_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vpi_audit_events ENABLE ROW LEVEL SECURITY;
