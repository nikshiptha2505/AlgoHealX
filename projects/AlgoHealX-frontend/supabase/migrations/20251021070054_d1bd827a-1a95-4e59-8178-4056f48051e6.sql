-- Create medicines table for tracking all registered batches
CREATE TABLE public.medicines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id TEXT NOT NULL UNIQUE,
  drug_name TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  manufacture_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  producer_wallet TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  blockchain_app_id TEXT,
  blockchain_tx_hash TEXT,
  qr_code_data TEXT,
  qr_code_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create supply_chain_events table for tracking transfers
CREATE TABLE public.supply_chain_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  batch_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  sender_wallet TEXT,
  receiver_wallet TEXT,
  location TEXT,
  blockchain_tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create verifications table for tracking medicine verifications
CREATE TABLE public.verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medicine_id UUID REFERENCES public.medicines(id) ON DELETE CASCADE,
  batch_id TEXT NOT NULL,
  verifier_address TEXT,
  is_authentic BOOLEAN NOT NULL DEFAULT true,
  verification_method TEXT,
  blockchain_tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create regulatory_approvals table
CREATE TABLE public.regulatory_approvals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medicine_id UUID NOT NULL REFERENCES public.medicines(id) ON DELETE CASCADE,
  regulator_wallet TEXT NOT NULL,
  status TEXT NOT NULL,
  compliance_score INTEGER,
  rejection_reason TEXT,
  blockchain_tx_hash TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supply_chain_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_approvals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for medicines (public read, authenticated write)
CREATE POLICY "Anyone can view medicines"
  ON public.medicines
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can register medicines"
  ON public.medicines
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update medicines"
  ON public.medicines
  FOR UPDATE
  TO authenticated
  USING (true);

-- RLS Policies for supply_chain_events
CREATE POLICY "Anyone can view supply chain events"
  ON public.supply_chain_events
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create supply chain events"
  ON public.supply_chain_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for verifications
CREATE POLICY "Anyone can view verifications"
  ON public.verifications
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can create verifications"
  ON public.verifications
  FOR INSERT
  WITH CHECK (true);

-- RLS Policies for regulatory_approvals
CREATE POLICY "Anyone can view regulatory approvals"
  ON public.regulatory_approvals
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create regulatory approvals"
  ON public.regulatory_approvals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update regulatory approvals"
  ON public.regulatory_approvals
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_medicines_batch_id ON public.medicines(batch_id);
CREATE INDEX idx_medicines_status ON public.medicines(status);
CREATE INDEX idx_medicines_producer_wallet ON public.medicines(producer_wallet);
CREATE INDEX idx_supply_chain_events_medicine_id ON public.supply_chain_events(medicine_id);
CREATE INDEX idx_supply_chain_events_batch_id ON public.supply_chain_events(batch_id);
CREATE INDEX idx_verifications_medicine_id ON public.verifications(medicine_id);
CREATE INDEX idx_verifications_batch_id ON public.verifications(batch_id);
CREATE INDEX idx_regulatory_approvals_medicine_id ON public.regulatory_approvals(medicine_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_medicines_updated_at
  BEFORE UPDATE ON public.medicines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();