export interface MerchantOnboardingFormProps {
  onSubmit?: (data: MerchantFormData) => Promise<void> | void;
}

export interface MerchantFormData {
  merchantWallet: string;
  payoutToken: string;
  payoutChainId: number;
  payoutMode: PayoutMode;
  splitBps: number;
  protocolFeeBps: number;
  feeRecipient: string;
}

export enum PayoutMode {
  USDC_ONLY = 0,
  SHARES_ONLY = 1,
  SPLIT = 2,
}
