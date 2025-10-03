import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from "lucide-react";

interface StatsCardsProps {
  mentions: any[];
}

export const StatsCards = ({ mentions }: StatsCardsProps) => {
  const positive = mentions.filter(m => m.sentiment === "positive").length;
  const neutral = mentions.filter(m => m.sentiment === "neutral").length;
  const negative = mentions.filter(m => m.sentiment === "negative").length;
  const total = mentions.length;

  const stats = [
    {
      title: "Total Mentions",
      value: total,
      icon: Activity,
      gradient: "bg-gradient-primary",
      description: "All tracked mentions",
    },
    {
      title: "Positive",
      value: positive,
      percentage: total > 0 ? ((positive / total) * 100).toFixed(1) : 0,
      icon: TrendingUp,
      gradient: "bg-gradient-success",
      description: `${positive} positive mentions`,
    },
    {
      title: "Negative",
      value: negative,
      percentage: total > 0 ? ((negative / total) * 100).toFixed(1) : 0,
      icon: TrendingDown,
      gradient: "bg-gradient-danger",
      description: `${negative} require attention`,
    },
    {
      title: "Neutral",
      value: neutral,
      percentage: total > 0 ? ((neutral / total) * 100).toFixed(1) : 0,
      icon: AlertTriangle,
      gradient: "bg-gradient-warning",
      description: `${neutral} neutral mentions`,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className="overflow-hidden border-2 border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-card transition-all duration-300 animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-full ${stat.gradient}`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.percentage !== undefined && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.percentage}% of total
                </p>
              )}
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};