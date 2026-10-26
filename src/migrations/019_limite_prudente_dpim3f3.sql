-- 019_limite_prudente_dpim3f3.sql
-- Actualiza las cuentas OAuth 2.0 (dpim3f3 y dpim3f4) a límites prudentes (máximo 40-50 diarios)

UPDATE cuentas_smtp
SET limite_diario = 50,
    minimo_por_ejecucion = 3,
    maximo_por_ejecucion = 6,
    estado = 'activo',
    actualizado_en = CURRENT_TIMESTAMP
WHERE email IN ('dpim3f3@gmail.com', 'dpim3f4@gmail.com');
