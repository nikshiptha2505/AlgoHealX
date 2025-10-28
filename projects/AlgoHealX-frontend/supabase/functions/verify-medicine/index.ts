import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { batchId } = await req.json();

    if (!batchId) {
      throw new Error('Batch ID is required');
    }

    console.log('Verifying medicine with batch ID:', batchId);

    // Fetch medicine data from Supabase
    const { data: medicine, error: medicineError } = await supabaseClient
      .from('medicines')
      .select('*')
      .eq('batch_id', batchId)
      .single();

    if (medicineError || !medicine) {
      console.error('Medicine not found:', medicineError);
      throw new Error('Medicine not found');
    }

    // Fetch regulatory approval
    const { data: approval } = await supabaseClient
      .from('regulatory_approvals')
      .select('*')
      .eq('medicine_id', medicine.id)
      .single();

    // Fetch supply chain events with blockchain transactions
    const { data: events, error: eventsError } = await supabaseClient
      .from('supply_chain_events')
      .select('*')
      .eq('batch_id', batchId)
      .order('created_at', { ascending: true });

    if (eventsError) {
      console.error('Error fetching supply chain events:', eventsError);
    }

    // Create verification record
    const { error: verificationError } = await supabaseClient
      .from('verifications')
      .insert({
        batch_id: batchId,
        medicine_id: medicine.id,
        verification_method: 'qr_scan',
        is_authentic: medicine.status === 'approved',
      });

    if (verificationError) {
      console.error('Error creating verification record:', verificationError);
    }

    const verificationResult = {
      isAuthentic: medicine.status === 'approved',
      status: medicine.status,
      batchId: medicine.batch_id,
      drugName: medicine.drug_name,
      manufacturer: medicine.manufacturer,
      expiryDate: medicine.expiry_date,
      quantity: medicine.quantity,
      registrationTxHash: medicine.blockchain_tx_hash,
      approvalTxHash: approval?.blockchain_tx_hash,
      supplyChainEvents: events?.map(event => ({
        eventType: event.event_type,
        location: event.location,
        timestamp: event.created_at,
        blockchainTxHash: event.blockchain_tx_hash,
      })) || [],
    };

    console.log('Verification result:', verificationResult);

    return new Response(
      JSON.stringify(verificationResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in verify-medicine:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});