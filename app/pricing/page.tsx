import Link from "next/link";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Free",
    price: "₹0",
    cadence: "forever",
    features: ["5 quizzes / month", "Text, PDF & YouTube", "CSV & PDF export"],
    cta: "Start free",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "₹299",
    cadence: "/ month",
    features: [
      "Unlimited quizzes",
      "Hindi & Hinglish support",
      "Priority generation",
      "Google Form export",
    ],
    cta: "Go Pro",
    highlighted: true,
  },
  {
    name: "Lifetime",
    price: "₹1,999",
    cadence: "one-time",
    features: ["Everything in Pro", "Unlimited forever", "Early access to new features"],
    cta: "Buy lifetime",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container flex-1 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Simple pricing</h1>
          <p className="mt-3 text-muted-foreground">
            Start free. Upgrade when you need more.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.highlighted ? "border-primary shadow-md" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.highlighted && <Badge>Popular</Badge>}
                </div>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">
                    {plan.price}
                  </span>{" "}
                  {plan.cadence}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <ul className="flex flex-col gap-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/app">
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
