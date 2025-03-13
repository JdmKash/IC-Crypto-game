"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

// Game data
const cryptoData = [
  { name: "BTC", price: 63245.78, change: 2.3 },
  { name: "ETH", price: 3401.52, change: 1.7 },
  { name: "SOL", price: 142.87, change: 5.2 },
  { name: "DOGE", price: 0.1234, change: -3.1 },
  { name: "SHIB", price: 0.00002345, change: 8.4 },
];

// Price chart data (simulated)
const generateChartData = (startPrice: number, volatility: number) => {
  const data = [];
  let price = startPrice;
  
  for (let i = 0; i < 24; i++) {
    const change = (Math.random() - 0.5) * volatility;
    price = price * (1 + change / 100);
    data.push({
      time: `${i}h`,
      price: price
    });
  }
  
  return data;
};

export default function Home() {
  const [balance, setBalance] = useState(1000); // Starting with 1000 USDT
  const [portfolio, setPortfolio] = useState<{[key: string]: {amount: number, buyPrice: number}}>({}); 
  const [selectedCrypto, setSelectedCrypto] = useState(cryptoData[0]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [miningProgress, setMiningProgress] = useState(0);
  const [isMining, setIsMining] = useState(false);
  const [miningReward, setMiningReward] = useState(0);
  
  useEffect(() => {
    setChartData(generateChartData(selectedCrypto.price, 2));
    
    // Mining progress simulation
    let interval: NodeJS.Timeout;
    if (isMining) {
      interval = setInterval(() => {
        setMiningProgress(prev => {
          if (prev >= 100) {
            setIsMining(false);
            const reward = Math.random() * 0.01 * selectedCrypto.price;
            setMiningReward(reward);
            
            // Add mined crypto to portfolio
            setPortfolio(prev => {
              const currentHolding = prev[selectedCrypto.name] || { amount: 0, buyPrice: 0 };
              const newAmount = currentHolding.amount + reward / selectedCrypto.price;
              const newAvgPrice = (currentHolding.amount * currentHolding.buyPrice + reward) / newAmount;
              
              return {
                ...prev,
                [selectedCrypto.name]: {
                  amount: newAmount,
                  buyPrice: newAvgPrice
                }
              };
            });
            
            return 0;
          }
          return prev + 1;
        });
      }, 100);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [selectedCrypto, isMining]);
  
  const handleBuy = () => {
    if (balance >= 100) {
      const amount = 100 / selectedCrypto.price;
      
      // Update portfolio
      setPortfolio(prev => {
        const currentHolding = prev[selectedCrypto.name] || { amount: 0, buyPrice: 0 };
        const newAmount = currentHolding.amount + amount;
        const newAvgPrice = (currentHolding.amount * currentHolding.buyPrice + 100) / newAmount;
        
        return {
          ...prev,
          [selectedCrypto.name]: {
            amount: newAmount,
            buyPrice: newAvgPrice
          }
        };
      });
      
      // Update balance
      setBalance(prev => prev - 100);
    }
  };
  
  const handleSell = (cryptoName: string) => {
    const holding = portfolio[cryptoName];
    if (holding && holding.amount > 0) {
      const crypto = cryptoData.find(c => c.name === cryptoName);
      if (crypto) {
        const sellValue = holding.amount * crypto.price;
        
        // Update balance
        setBalance(prev => prev + sellValue);
        
        // Remove from portfolio
        setPortfolio(prev => {
          const newPortfolio = { ...prev };
          delete newPortfolio[cryptoName];
          return newPortfolio;
        });
      }
    }
  };
  
  const startMining = () => {
    setIsMining(true);
    setMiningProgress(0);
  };
  
  const calculatePortfolioValue = () => {
    return Object.entries(portfolio).reduce((total, [name, holding]) => {
      const crypto = cryptoData.find(c => c.name === name);
      if (crypto) {
        return total + (holding.amount * crypto.price);
      }
      return total;
    }, 0);
  };
  
  const portfolioValue = calculatePortfolioValue();
  const totalValue = balance + portfolioValue;
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-12 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-5xl space-y-6">
        <h1 className="text-3xl font-bold text-center mb-6">Crypto Mining Game</h1>
        
        {/* Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Balance</CardTitle>
            <CardDescription>Current assets and portfolio value</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium">USDT Balance</p>
                <p className="text-2xl font-bold">${balance.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Portfolio Value</p>
                <p className="text-2xl font-bold">${portfolioValue.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Value</p>
                <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Crypto Selection and Chart */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Cryptocurrencies</CardTitle>
              <CardDescription>Select a crypto to mine or trade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cryptoData.map(crypto => (
                  <div 
                    key={crypto.name}
                    className={`p-3 rounded-lg cursor-pointer flex justify-between items-center ${selectedCrypto.name === crypto.name ? 'bg-primary/10 border border-primary' : 'bg-card hover:bg-primary/5'}`}
                    onClick={() => setSelectedCrypto(crypto)}
                  >
                    <div>
                      <p className="font-medium">{crypto.name}</p>
                      <p className="text-sm text-muted-foreground">${crypto.price.toFixed(2)}</p>
                    </div>
                    <span className={crypto.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {crypto.change >= 0 ? '+' : ''}{crypto.change}%
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{selectedCrypto.name} Price Chart</CardTitle>
              <CardDescription>24-hour price movement</CardDescription>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <XAxis dataKey="time" />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="price"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button onClick={handleBuy} disabled={balance < 100}>
                Buy {selectedCrypto.name} ($100)
              </Button>
              <Button onClick={startMining} disabled={isMining} variant="outline">
                Start Mining
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Mining Progress */}
        {isMining && (
          <Card>
            <CardHeader>
              <CardTitle>Mining {selectedCrypto.name}</CardTitle>
              <CardDescription>Your mining rig is working...</CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={miningProgress} className="h-2" />
              <p className="mt-2 text-center">{miningProgress}% complete</p>
            </CardContent>
          </Card>
        )}
        
        {/* Mining Reward Notification */}
        {miningReward > 0 && !isMining && (
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="text-green-500">Mining Successful!</CardTitle>
              <CardDescription>You've earned some crypto</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center font-bold">
                +${miningReward.toFixed(4)} worth of {selectedCrypto.name}
              </p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => setMiningReward(0)} className="w-full">
                Claim Reward
              </Button>
            </CardFooter>
          </Card>
        )}
        
        {/* Portfolio */}
        {Object.keys(portfolio).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Your Portfolio</CardTitle>
              <CardDescription>Your crypto holdings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(portfolio).map(([name, holding]) => {
                  const crypto = cryptoData.find(c => c.name === name);
                  if (!crypto) return null;
                  
                  const currentValue = holding.amount * crypto.price;
                  const boughtValue = holding.amount * holding.buyPrice;
                  const profitLoss = currentValue - boughtValue;
                  const profitLossPercent = (profitLoss / boughtValue) * 100;
                  
                  return (
                    <div key={name} className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{name}</p>
                        <p className="text-sm">{holding.amount.toFixed(6)} tokens</p>
                        <p className="text-xs text-muted-foreground">
                          Avg. buy: ${holding.buyPrice.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${currentValue.toFixed(2)}</p>
                        <p className={`text-sm ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {profitLoss >= 0 ? '+' : ''}{profitLossPercent.toFixed(2)}%
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSell(name)}
                      >
                        Sell
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
