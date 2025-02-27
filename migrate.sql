-- Adicionando coluna sei_number à tabela medical_leaves se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medical_leaves' AND column_name = 'sei_number'
    ) THEN
        ALTER TABLE medical_leaves ADD COLUMN sei_number TEXT;
    END IF;
END
$$;

-- Adicionando coluna days_used à tabela vacation_periods se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacation_periods' AND column_name = 'days_used'
    ) THEN
        ALTER TABLE vacation_periods ADD COLUMN days_used INTEGER NOT NULL DEFAULT 0;
    END IF;
END
$$;

-- Adicionando coluna sei_number à tabela vacation_periods se ela não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacation_periods' AND column_name = 'sei_number'
    ) THEN
        ALTER TABLE vacation_periods ADD COLUMN sei_number TEXT;
    END IF;
END
$$;

-- Adicionando coluna reviewed_by e reviewed_at à tabela vacation_periods se não existirem
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacation_periods' AND column_name = 'reviewed_by'
    ) THEN
        ALTER TABLE vacation_periods ADD COLUMN reviewed_by INTEGER REFERENCES users(id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacation_periods' AND column_name = 'reviewed_at'
    ) THEN
        ALTER TABLE vacation_periods ADD COLUMN reviewed_at TIMESTAMP;
    END IF;
END
$$;

-- Garantindo que a coluna acquisitionPeriod exista na tabela vacation_periods
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vacation_periods' AND column_name = 'acquisition_period'
    ) THEN
        ALTER TABLE vacation_periods ADD COLUMN acquisition_period TEXT NOT NULL DEFAULT '';
    END IF;
END
$$;

-- Criando tabela user_preferences se ela não existir
CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    dashboard_layout TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Adicionando enum values para notification type se não existirem
ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'request_approved';
ALTER TYPE "public"."notifications_type_enum" ADD VALUE IF NOT EXISTS 'request_rejected';