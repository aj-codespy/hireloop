"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MultiStepFormLayoutProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  children: React.ReactNode;
}

export function MultiStepFormLayout({ 
  currentStep, 
  totalSteps, 
  title, 
  children 
}: MultiStepFormLayoutProps) {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="border-border shadow-card-hover">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-xl font-semibold">{title}</CardTitle>
            <div className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-brand h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {children}
        </CardContent>
      </Card>
    </div>
  );
}