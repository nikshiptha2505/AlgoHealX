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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { batchId, senderWallet, receiverWallet, location, eventType, blockchainTxHash } = await req.json();

    console.log('Tracking transfer:', { batchId, senderWallet, receiverWallet, location, blockchainTxHash });

    // Fetch medicine and check status
    const { data: medicine, error: medicineError } = await supabaseClient
      .from('medicines')
      .select('*')
      .eq('batch_id', batchId)
      .single();

    if (medicineError || !medicine) {
      throw new Error('Medicine batch not found');
    }

    // Only allow distribution of approved medicines
    if (medicine.status !== 'approved') {
      throw new Error('Medicine must be approved by regulator before distribution');
    }

    // Record transfer in supply chain with blockchain transaction hash
    const { data: transfer, error: transferError } = await supabaseClient
      .from('supply_chain_events')
      .insert({
        medicine_id: medicine.id,
        batch_id: batchId,
        event_type: eventType || 'transfer',
        sender_wallet: senderWallet,
        receiver_wallet: receiverWallet,
        location,
        blockchain_tx_hash: blockchainTxHash
      })
      .select()
      .single();

    if (transferError) {
      console.error('Transfer recording error:', transferError);
      throw transferError;
    }

    console.log('Transfer recorded successfully:', transfer);

    return new Response(
      JSON.stringify({
        success: true,
        transfer,
        transactionHash: blockchainTxHash
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in track-transfer:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});