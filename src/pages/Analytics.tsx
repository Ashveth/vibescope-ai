import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { Badge } from "@/components/ui/badge";

export default function Analytics() {
  const [mentions, setMentions] = useState<any[]>([]);

  useEffect(() => {
    const fetchMentions = async () => {
      const { data } = await supabase.from("mentions").select("*");
      setMentions(data || []);
    };
    fetchMentions();
  }, []);

  // Emotion Heatmap Data
  const emotionData = mentions.reduce((acc: any, mention) => {
    const emotions = mention.emotions || {};
    Object.entries(emotions).forEach(([emotion, value]) => {
      if (!acc[emotion]) acc[emotion] = { emotion, total: 0, count: 0 };
      acc[emotion].total += value as number;
      acc[emotion].count++;
    });
    return acc;
  }, {});

  const emotionChartData = Object.values(emotionData).map((e: any) => ({
    emotion: e.emotion.charAt(0).toUpperCase() + e.emotion.slice(1),
    intensity: ((e.total / e.count) * 100).toFixed(1),
  }));

  // Tag/Category Breakdown
  const tagData = mentions.reduce((acc: any, mention) => {
    mention.tags?.forEach((tag: string) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {});

  const tagChartData = Object.entries(tagData)
    .map(([tag, count]) => ({
      tag: tag.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
      count,
    }))
    .sort((a, b) => (b.count as number) - (a.count as number))
    .slice(0, 10);

  // Keyword Cloud Data
  const keywords = mentions
    .map(m => m.content.toLowerCase())
    .join(" ")
    .split(/\s+/)
    .filter(word => word.length > 4)
    .reduce((acc: any, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});

  const topKeywords = Object.entries(keywords)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 20)
    .map(([word, count]) => ({ word, count }));

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Deep insights and trends</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Emotion Heatmap</CardTitle>
            <CardDescription>Emotional distribution across mentions</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={emotionChartData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="emotion" stroke="hsl(var(--muted-foreground))" />
                <PolarRadiusAxis stroke="hsl(var(--muted-foreground))" />
                <Radar
                  name="Intensity"
                  dataKey="intensity"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.6}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Issue Categories</CardTitle>
            <CardDescription>Auto-tagged categorization</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tagChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="tag" stroke="hsl(var(--muted-foreground))" angle={-45} textAnchor="end" height={100} />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm md:col-span-2">
          <CardHeader>
            <CardTitle>Keyword Cloud</CardTitle>
            <CardDescription>Most frequent words in mentions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topKeywords.map(({ word, count }: any, index) => {
                const size = Math.min(32, 12 + (count as number) * 2);
                const opacity = 0.5 + (index / topKeywords.length) * 0.5;
                return (
                  <Badge
                    key={word}
                    variant="outline"
                    style={{
                      fontSize: `${size}px`,
                      opacity,
                      padding: "8px 16px",
                    }}
                    className="hover:scale-110 transition-transform"
                  >
                    {word}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base">Average Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2.5 min</div>
            <p className="text-xs text-muted-foreground mt-1">AI generation time</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base">Resolution Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">87%</div>
            <p className="text-xs text-muted-foreground mt-1">Issues resolved</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base">Team Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">94%</div>
            <p className="text-xs text-muted-foreground mt-1">Response approval rate</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}