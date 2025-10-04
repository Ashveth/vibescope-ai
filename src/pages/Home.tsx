import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StatsCards } from "@/components/StatsCards";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Home() {
  const [mentions, setMentions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMentions = async () => {
    try {
      const { data, error } = await supabase
        .from("mentions")
        .select("*")
        .order("timestamp", { ascending: false });

      if (error) throw error;
      setMentions(data || []);
    } catch (error: any) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchMentions();

    const channel = supabase
      .channel("mentions-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "mentions" }, fetchMentions)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const simulateMention = async () => {
    setLoading(true);
    try {
      const samples = [
        { content: "This is amazing! Love the new features.", source: "Twitter", user_name: "tech_enthusiast" },
        { content: "App keeps freezing. Very disappointed.", source: "Reddit", user_name: "frustrated_dev" },
        { content: "It's decent, does the job.", source: "Google Reviews", user_name: "John S." },
      ];
      const sample = samples[Math.floor(Math.random() * samples.length)];

      const { data, error } = await supabase.functions.invoke("analyze-sentiment", { body: sample });
      if (error) throw error;

      await supabase.from("mentions").insert({
        ...sample,
        sentiment: data.sentiment,
        sentiment_score: data.sentimentScore,
        suggested_response: data.suggestedResponse,
        emotions: data.sentiment === "positive" ? { joy: 0.8, satisfaction: 0.9 } : 
                  data.sentiment === "negative" ? { anger: 0.7, frustration: 0.8 } : 
                  { neutral: 0.6 },
        tags: sample.content.includes("feature") ? ["feature", "product"] : 
              sample.content.includes("freezing") ? ["technical", "quality"] : ["general"],
        severity: data.sentiment === "negative" ? "high" : "low",
      });

      toast.success("New mention added!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const sentimentData = [
    { name: "Positive", value: mentions.filter(m => m.sentiment === "positive").length, color: "hsl(var(--success))" },
    { name: "Neutral", value: mentions.filter(m => m.sentiment === "neutral").length, color: "hsl(var(--warning))" },
    { name: "Negative", value: mentions.filter(m => m.sentiment === "negative").length, color: "hsl(var(--danger))" },
  ];

  const trendData = mentions
    .reduce((acc: any[], mention) => {
      const date = new Date(mention.timestamp).toLocaleDateString();
      const existing = acc.find(d => d.date === date);
      if (existing) {
        existing[mention.sentiment]++;
      } else {
        acc.push({ date, positive: 0, neutral: 0, negative: 0, [mention.sentiment]: 1 });
      }
      return acc;
    }, [])
    .slice(-7);

  const negativeMentionsToday = mentions.filter(
    m => m.sentiment === "negative" && 
    new Date(m.timestamp).toDateString() === new Date().toDateString()
  ).length;

  const responseRate = mentions.filter(m => m.suggested_response).length / Math.max(mentions.length, 1) * 100;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Real-time sentiment monitoring overview</p>
        </div>
        <Button onClick={simulateMention} disabled={loading} className="bg-gradient-primary">
          <Plus className="mr-2 h-4 w-4" />
          Add Sample Mention
        </Button>
      </div>

      <StatsCards mentions={mentions} />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">Current Sentiment Score</CardTitle>
            <CardDescription>Overall sentiment health</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              {mentions.length > 0 ? (
                (mentions.reduce((acc, m) => acc + m.sentiment_score, 0) / mentions.length * 100).toFixed(1)
              ) : 0}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">Based on {mentions.length} mentions</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-danger/20">
          <CardHeader>
            <CardTitle className="text-base">Negative Mentions Today</CardTitle>
            <CardDescription>Requires immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-danger">{negativeMentionsToday}</div>
            <p className="text-xs text-muted-foreground mt-2">Out of today's mentions</p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm border-success/20">
          <CardHeader>
            <CardTitle className="text-base">Response Rate</CardTitle>
            <CardDescription>AI suggestions generated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-success">{responseRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground mt-2">AI-powered responses</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Sentiment Over Time</CardTitle>
            <CardDescription>7-day trend analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="positive" stroke="hsl(var(--success))" strokeWidth={2} />
                <Line type="monotone" dataKey="neutral" stroke="hsl(var(--warning))" strokeWidth={2} />
                <Line type="monotone" dataKey="negative" stroke="hsl(var(--danger))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
            <CardDescription>Overall breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}