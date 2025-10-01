import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'react-toastify';

export interface AuthData {
  userAddress: string;
  signature: string; // Changed to string for base64
  message: string;
}

export const useWalletAuth = () => {
  const wallet = useWallet();

  const authenticate = async (): Promise<AuthData | null> => {
    try {
      if (!wallet.publicKey || !wallet.signMessage) {
        toast.error("Wallet not connected or signing not supported");
        return null;
      }

      // Create a message to sign
      const message = `Authenticate for voting - ${Date.now()}`;
      const encodedMessage = new TextEncoder().encode(message);

      // Sign the message
      const signature = await wallet.signMessage(encodedMessage);

      // Convert signature to base64 string
      const signatureBase64 = Buffer.from(signature).toString('base64');

      return {
        userAddress: wallet.publicKey.toString(),
        signature: signatureBase64,
        message,
      };
    } catch (error) {
      console.error("Error authenticating:", error);
      toast.error("Authentication failed");
      return null;
    }
  };

  return { authenticate };
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('sosana_token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('sosana_token', token);
};

export const clearAuthToken = (): void => {
  localStorage.removeItem('sosana_token');
}; 