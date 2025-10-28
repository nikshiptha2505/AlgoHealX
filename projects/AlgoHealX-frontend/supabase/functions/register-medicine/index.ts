import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as algosdk from "npm:algosdk@3.5.2";
import QRCode from "npm:qrcode@1.5.4";

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { batchId, drugName, manufacturer, manufactureDate, expiryDate, quantity, producerWallet } = await req.json();

    console.log('Registering medicine:', { batchId, drugName, manufacturer });

    // Generate QR code data and hash
    const qrCodeData = JSON.stringify({
      batchId,
      drugName,
      manufacturer,
      timestamp: new Date().toISOString()
    });
    
    const qrCodeHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(qrCodeData)
    );
    const qrCodeHashHex = Array.from(new Uint8Array(qrCodeHash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Generate QR code image
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);

    // Simulate blockchain transaction (in production, deploy actual smart contract)
    // For now, create a mock transaction hash
    const txHash = `TX_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const appId = `APP_${Math.floor(Math.random() * 1000000)}`;

    console.log('Mock blockchain transaction:', { txHash, appId });

    // Store medicine in database
    const { data: medicine, error: dbError } = await supabaseClient
      .from('medicines')
      .insert({
        batch_id: batchId,
        drug_name: drugName,
        manufacturer,
        manufacture_date: manufactureDate,
        expiry_date: expiryDate,
        quantity: parseInt(quantity),
        producer_wallet: producerWallet,
        status: 'pending',
        blockchain_app_id: appId,
        blockchain_tx_hash: txHash,
        qr_code_data: qrCodeData,
        qr_code_hash: qrCodeHashHex
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log('Medicine registered successfully:', medicine);

    return new Response(
      JSON.stringify({
        success: true,
        medicine,
        qrCodeImage,
        transactionHash: txHash,
        appId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in register-medicine:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});