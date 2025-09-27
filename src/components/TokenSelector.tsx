"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";

interface Token {
  symbol: string;
  name: string;
  address: string;
  logoURI?: string;
  balance?: string;
  price?: number;
}

interface TokenSelectorProps {
  tokens: Token[];
  onSelect: (token: Token) => void;
  onClose: () => void;
  selectedToken: Token | null;
}

export function TokenSelector({ tokens, onSelect, onClose, selectedToken }: TokenSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      token.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Select a token
          </h3>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by name or paste address"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Token List */}
        <div className="flex-1 overflow-auto">
          <div className="p-2">
            {filteredTokens.map((token) => (
              <button
                key={token.address}
                onClick={() => onSelect(token)}
                className="w-full flex items-center gap-3 p-3 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <img
                  src={token.logoURI}
                  alt={token.symbol}
                  className="w-8 h-8 rounded-full"
                />
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-white">
                      {token.symbol}
                    </span>
                    {selectedToken?.address === token.address && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  <div className="text-sm text-slate-500">
                    {token.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {token.balance || "0"}
                  </div>
                  <div className="text-xs text-slate-500">
                    ${token.price?.toFixed(2) || "0.00"}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Popular Tokens */}
        {!searchTerm && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
              Popular tokens
            </div>
            <div className="flex flex-wrap gap-2">
              {tokens.slice(0, 6).map((token) => (
                <Button
                  key={token.address}
                  variant="outline"
                  size="sm"
                  onClick={() => onSelect(token)}
                  className="h-8 px-3"
                >
                  <img
                    src={token.logoURI}
                    alt={token.symbol}
                    className="w-4 h-4 rounded-full mr-2"
                  />
                  {token.symbol}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
