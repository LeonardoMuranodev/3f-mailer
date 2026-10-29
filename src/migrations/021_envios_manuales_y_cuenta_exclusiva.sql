-- ============================================================
-- Migración 021: Envíos manuales y cuenta emisora exclusiva (DPI 1)
-- Fecha: 2026-10-26
-- Descripción:
--   1. Añade es_exclusiva a cuentas_smtp para aislar DPI 1 del round-robin general.
--   2. Asegura la existencia de dpim3f@gmail.com marcada con es_exclusiva = true.
--   3. Añade tipo_audiencia, destinatarios_manuales y cuenta_emisor_id a campanas.
-- ============================================================

-- 1. Columna es_exclusiva en cuentas_smtp
ALTER TABLE cuentas_smtp 
  ADD COLUMN IF NOT EXISTS es_exclusiva BOOLEAN DEFAULT false;

-- 2. Asegurar que dpim3f@gmail.com exista y esté marcada como exclusiva
INSERT INTO cuentas_smtp (email, host, puerto, usuario, password_encrypted, estado, limite_diario, es_exclusiva)
VALUES ('dpim3f@gmail.com', 'smtp.gmail.com', 465, 'dpim3f@gmail.com', 'dummy_oauth', 'activo', 400, true)
ON CONFLICT (email) DO UPDATE 
SET es_exclusiva = true;

-- 3. Columnas en campanas para soporte de audiencias manuales y fijación de emisor
ALTER TABLE campanas 
  ADD COLUMN IF NOT EXISTS tipo_audiencia VARCHAR(20) DEFAULT 'rubros',
  ADD COLUMN IF NOT EXISTS destinatarios_manuales JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS cuenta_emisor_id UUID REFERENCES cuentas_smtp(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_campanas_tipo_audiencia ON campanas(tipo_audiencia);
CREATE INDEX IF NOT EXISTS idx_campanas_cuenta_emisor_id ON campanas(cuenta_emisor_id);
