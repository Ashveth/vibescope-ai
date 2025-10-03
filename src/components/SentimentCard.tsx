import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, MessageSquare, ThumbsUp, ThumbsDown, Meh } from "lucide-react";
import { cn } from "@/lib/utils";

interface SentimentCardProps {
  mention: {
    id: string;
    content: string;
    source: string;
    sentiment: "positive" | "neutral" | "negative";
    sentiment_score: number;
    user_name: string;
    timestamp: string;
    suggested_response?: string;
  };
}

const sentimentConfig = {
  positive: {
    icon: ThumbsUp,
    gradient: "bg-gradient-success",
    border: "border-success/30",
    badge: "bg-success/20 text-success",
  },
  neutral: {
    icon: Meh,
    gradient: "bg-gradient-warning",
    border: "border-warning/30",
    badge: "bg-warning/20 text-warning",
  },
  negative: {
    icon: ThumbsDown,
    gradient: "bg-gradient-danger",
    border: "border-danger/30",
    badge: "bg-danger/20 text-danger",
  },
};

export const SentimentCard = ({ mention }: SentimentCardProps) => {
  const config = sentimentConfig[mention.sentiment];
  const Icon = config.icon;

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-card hover:scale-[1.02] animate-fade-in",
      "bg-card/50 backdrop-blur-sm border-2",
      config.border
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("p-2 rounded-full", config.gradient)}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-base">{mention.user_name}</CardTitle>
              <CardDescription className="text-xs">
                {mention.source} • {new Date(mention.timestamp).toLocaleString()}
              </CardDescription>
            </div>
          </div>
          <Badge className={config.badge}>
            {mention.sentiment} ({(mention.sentiment_score * 100).toFixed(0)}%)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{mention.content}</p>
        
        {mention.suggested_response && (
          <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">AI Suggested Response</span>
            </div>
            <p className="text-sm">{mention.suggested_response}</p>
            <Button size="sm" variant="outline" className="w-full mt-2">
              Use This Response
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};