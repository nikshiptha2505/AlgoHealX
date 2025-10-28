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

    const { batchId, regulatorWallet, status, complianceScore, rejectionReason } = await req.json();

    console.log('Processing approval:', { batchId, regulatorWallet, status });

    // Fetch medicine
    const { data: medicine, error: medicineError } = await supabaseClient
      .from('medicines')
      .select('*')
      .eq('batch_id', batchId)
      .single();

    if (medicineError || !medicine) {
      throw new Error('Medicine batch not found');
    }

    // Simulate blockchain transaction
    const txHash = `APPROVAL_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Update medicine status
    const { error: updateError } = await supabaseClient
      .from('medicines')
      .update({ status })
      .eq('batch_id', batchId);

    if (updateError) {
      console.error('Medicine update error:', updateError);
      throw updateError;
    }

    // Record regulatory approval
    const { data: approval, error: approvalError } = await supabaseClient
      .from('regulatory_approvals')
      .insert({
        medicine_id: medicine.id,
        regulator_wallet: regulatorWallet,
        status,
        compliance_score: complianceScore,
        rejection_reason: rejectionReason,
        blockchain_tx_hash: txHash,
        approved_at: status === 'approved' ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (approvalError) {
      console.error('Approval recording error:', approvalError);
      throw approvalError;
    }

    console.log('Approval processed successfully:', approval);

    return new Response(
      JSON.stringify({
        success: true,
        approval,
        transactionHash: txHash
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in approve-medicine:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});