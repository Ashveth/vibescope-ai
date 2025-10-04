import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, ThumbsDown, Meh, Heart, Frown, Zap } from "lucide-react";
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
    emotions?: any;
    tags?: string[];
    severity?: string;
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

const emotionIcons: any = {
  joy: Heart,
  satisfaction: ThumbsUp,
  anger: Zap,
  frustration: Frown,
  sadness: Frown,
  neutral: Meh,
};

export const SentimentCard = ({ mention }: SentimentCardProps) => {
  const config = sentimentConfig[mention.sentiment];
  const Icon = config.icon;
  const topEmotions = mention.emotions
    ? Object.entries(mention.emotions)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 3)
    : [];

  return (
    <Card className={cn(
      "transition-all duration-300 hover:shadow-card hover:scale-[1.01] animate-fade-in",
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
          <div className="flex flex-col gap-1 items-end">
            <Badge className={config.badge}>
              {mention.sentiment} ({(mention.sentiment_score * 100).toFixed(0)}%)
            </Badge>
            {mention.severity && (
              <Badge
                variant="outline"
                className={cn(
                  mention.severity === "critical" && "border-red-500 text-red-500",
                  mention.severity === "high" && "border-orange-500 text-orange-500"
                )}
              >
                {mention.severity}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">{mention.content}</p>
        
        {topEmotions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {topEmotions.map(([emotion, value]: any) => {
              const EmotionIcon = emotionIcons[emotion] || Heart;
              return (
                <div key={emotion} className="flex items-center gap-1 text-xs text-muted-foreground">
                  <EmotionIcon className="h-3 w-3" />
                  <span className="capitalize">{emotion}: {(value * 100).toFixed(0)}%</span>
                </div>
              );
            })}
          </div>
        )}

        {mention.tags && mention.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {mention.tags.map((tag: string) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag.replace(/_/g, " ")}
              </Badge>
            ))}
          </div>
        )}
        
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