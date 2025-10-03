import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SentimentCard } from "./SentimentCard";
import { StatsCards } from "./StatsCards";
import { toast } from "sonner";
import { LogOut, Plus, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export const Dashboard = () => {
  const [mentions, setMentions] = useState<any[]>([]);
  const [filteredMentions, setFilteredMentions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const { theme, setTheme } = useTheme();

  const fetchMentions = async () => {
    try {
      const { data, error } = await supabase
        .from("mentions")
        .select("*")
        .order("timestamp", { ascending: false });

      if (error) throw error;
      setMentions(data || []);
      setFilteredMentions(data || []);
    } catch (error: any) {
      toast.error("Failed to load mentions");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchMentions();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("mentions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mentions",
        },
        (payload) => {
          console.log("Real-time update:", payload);
          fetchMentions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    let filtered = mentions;

    if (searchQuery) {
      filtered = filtered.filter(m =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (sentimentFilter !== "all") {
      filtered = filtered.filter(m => m.sentiment === sentimentFilter);
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter(m => m.source === sourceFilter);
    }

    setFilteredMentions(filtered);
  }, [searchQuery, sentimentFilter, sourceFilter, mentions]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  const simulateMention = async () => {
    setLoading(true);
    try {
      const sampleMentions = [
        {
          content: "This product is amazing! Best purchase I've made this year.",
          source: "Twitter",
          user_name: "happycustomer",
        },
        {
          content: "Terrible experience. The app crashes constantly and support doesn't respond.",
          source: "Reddit",
          user_name: "frustrated_user",
        },
        {
          content: "It's okay, nothing special but does the job.",
          source: "Google Reviews",
          user_name: "average_joe",
        },
      ];

      const randomMention = sampleMentions[Math.floor(Math.random() * sampleMentions.length)];

      // Call sentiment analysis
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke(
        "analyze-sentiment",
        {
          body: randomMention,
        }
      );

      if (analysisError) throw analysisError;

      // Insert into database
      const { error: insertError } = await supabase.from("mentions").insert({
        content: randomMention.content,
        source: randomMention.source,
        user_name: randomMention.user_name,
        sentiment: analysisData.sentiment,
        sentiment_score: analysisData.sentimentScore,
        suggested_response: analysisData.suggestedResponse,
      });

      if (insertError) throw insertError;

      toast.success("New mention added!");
    } catch (error: any) {
      toast.error(error.message || "Failed to add mention");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-muted">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Sentiment Alert Dashboard
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button onClick={simulateMention} disabled={loading} className="bg-gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Add Sample Mention
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <StatsCards mentions={mentions} />

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search mentions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sentimentFilter} onValueChange={setSentimentFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by sentiment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sentiments</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="neutral">Neutral</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="Twitter">Twitter</SelectItem>
              <SelectItem value="Reddit">Reddit</SelectItem>
              <SelectItem value="Google Reviews">Google Reviews</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredMentions.map((mention) => (
            <SentimentCard key={mention.id} mention={mention} />
          ))}
        </div>

        {filteredMentions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No mentions found. Add a sample mention to get started!</p>
          </div>
        )}
      </main>
    </div>
  );
};