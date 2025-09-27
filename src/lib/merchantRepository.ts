"use client";

import { supabase } from "./supabaseClient";

export interface UpsertMerchantProfileParams {
  merchantWallet: string;
  payoutAddress: string;
  payoutMode: number;
  splitBps?: number | null;
}

const DEFAULT_TABLE = process.env.NEXT_PUBLIC_SUPABASE_MERCHANT_TABLE || "merchant_profiles";

export async function upsertMerchantProfile(params: UpsertMerchantProfileParams) {
  const payload = {
    merchant_wallet_address: params.merchantWallet,
    payout_address: params.payoutAddress,
    payout_mode: params.payoutMode,
    split_bps: params.splitBps ?? null,
  };

  const { data, error } = await supabase
    .from(DEFAULT_TABLE)
    .upsert(payload, { onConflict: "merchant_wallet_address" })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}


