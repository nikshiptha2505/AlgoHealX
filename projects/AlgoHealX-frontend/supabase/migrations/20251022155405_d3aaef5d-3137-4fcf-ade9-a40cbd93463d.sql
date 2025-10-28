-- Enable realtime for medicines table
ALTER TABLE public.medicines REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medicines;

-- Enable realtime for regulatory_approvals table
ALTER TABLE public.regulatory_approvals REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.regulatory_approvals;

-- Enable realtime for supply_chain_events table
ALTER TABLE public.supply_chain_events REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.supply_chain_events;

-- Enable realtime for verifications table
ALTER TABLE public.verifications REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.verifications;