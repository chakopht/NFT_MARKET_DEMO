"use client"

import "./globals.css";
import React from 'react';

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import Breadcrumb from "@/components/bread-crumb"
import AccountStatus from "@/components/account"
import { ConnectButton, RainbowKitProvider } from '@rainbow-me/rainbowkit';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { rainbowConfig } from "@/components/config";
import { WagmiProvider, useAccount } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const queryClient = new QueryClient();
  
  return (
    <html lang="en">
      <body className="bg-cyan-50">
          <WagmiProvider config={rainbowConfig}>
            <QueryClientProvider client={queryClient}>
              <AccountStatus/>
              <RainbowKitProvider modalSize="compact">
              <div className="flex justify-center items-center min-h-screen">
                <SidebarProvider className="justify-center">
                <div className="flex justify-center">
                    <AppSidebar/>
                    <main className="flex-1 flex flex-row">
                      <div className="flex-1 flex flex-col my-2 mx-5">
                        <Breadcrumb/>
                          <Card className="content-div pt-15 pr-10 pl-10 pb-10">
                            {children}
                          </Card>
                      </div>
                    
                      <div className="flex-1 flex flex-col my-2">
                          <Card className="content-side">
                            <CardHeader>
                              <CardTitle>Wallets Info:</CardTitle>
                            </CardHeader>
                            <CardContent className="[&>div]:flex [&>div]:flex-col px-5">
                              <ConnectButton/>
                            </CardContent>
                          </Card>
                      </div>
                      
                    </main>
                    </div>
                  </SidebarProvider>
                </div>
                
              </RainbowKitProvider>
            </QueryClientProvider>
          </WagmiProvider>
      </body>
    </html>
  );
}
