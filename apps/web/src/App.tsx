import React from "react";
import { Routes, Route } from "react-router-dom";
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@alpha-cut/ui";

export default function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <main className="min-h-screen flex items-center justify-center p-6 bg-surface-lightBg dark:bg-surface-darkBg">
            <Card className="max-w-md w-full">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-3 w-3 rounded-full bg-brand-brown dark:bg-brand-terracotta" />
                  <span className="text-xs font-bold tracking-wider uppercase text-brand-brown dark:text-brand-terracotta">
                    Alpha Cut Agency
                  </span>
                </div>
                <CardTitle>Foundation Initialized</CardTitle>
                <CardDescription>
                  Retention-engineered video editing platform for creators and brands.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-[#868686] dark:text-[#8C8A89]">
                  Monorepo foundation, Centum design system tokens, and HugeIcons integration ready.
                </p>
                <div className="flex gap-3">
                  <Button variant="primary">Explore Services</Button>
                  <Button variant="outline">Client Portal</Button>
                </div>
              </CardContent>
            </Card>
          </main>
        }
      />
    </Routes>
  );
}

