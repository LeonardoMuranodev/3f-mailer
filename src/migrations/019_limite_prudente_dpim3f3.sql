-- 019_limite_prudente_dpim3f3.sql
-- Actualiza la cuenta dpim3f3@gmail.com a límites prudentes para envíos con OAuth 2.0 (máximo 40-50 diarios)

UPDATE cuentas_smtp
SET limite_diario = 50,
    minimo_por_ejecucion = 3,
    maximo_por_ejecucion = 6,
    estado = 'activo',
    actualizado_en = CURRENT_TIMESTAMP
WHERE email = 'dpim3f3@gmail.com';
