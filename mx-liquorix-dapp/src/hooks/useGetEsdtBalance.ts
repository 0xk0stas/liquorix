import { useGetAccount } from "@/lib";
import { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "@/config";

export const useGetEsdtBalance = (tokenId: string) => {
    const { address } = useGetAccount();
    const [balance, setBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const fetchBalance = async () => {
        if (!address || !tokenId) return;
        setIsLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/accounts/${address}/tokens/${tokenId}`);
            if (data && data.balance) {
                // Convert from atomic to denominated (assuming 18 decimals for xEGLD)
                const denom = parseFloat(data.balance) / 10 ** 18;
                setBalance(denom);
            } else {
                setBalance(0);
            }
        } catch (error) {
            console.error(`Failed to fetch ESDT balance for ${tokenId}:`, error);
            setBalance(0);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBalance();
    }, [address, tokenId]);

    return { balance, isLoading, refresh: fetchBalance };
};
