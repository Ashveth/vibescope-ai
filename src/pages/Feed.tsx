import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SentimentCard } from "@/components/SentimentCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export default function Feed() {
  const [mentions, setMentions] = useState<any[]>([]);
  const [filteredMentions, setFilteredMentions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const fetchMentions = async () => {
    const { data } = await supabase
      .from("mentions")
      .select("*")
      .order("timestamp", { ascending: false });
    setMentions(data || []);
    setFilteredMentions(data || []);
  };

  useEffect(() => {
    fetchMentions();
    const channel = supabase
      .channel("feed-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "mentions" }, fetchMentions)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    let filtered = mentions;
    if (searchQuery) {
      filtered = filtered.filter(m =>
        m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.user_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (sentimentFilter !== "all") filtered = filtered.filter(m => m.sentiment === sentimentFilter);
    if (sourceFilter !== "all") filtered = filtered.filter(m => m.source === sourceFilter);
    setFilteredMentions(filtered);
  }, [searchQuery, sentimentFilter, sourceFilter, mentions]);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Live Feed</h1>
        <p className="text-muted-foreground">Real-time stream of mentions</p>
      </div>

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
            <SelectValue placeholder="Sentiment" />
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
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="Twitter">Twitter</SelectItem>
            <SelectItem value="Reddit">Reddit</SelectItem>
            <SelectItem value="Google Reviews">Google Reviews</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredMentions.map((mention) => (
          <SentimentCard key={mention.id} mention={mention} />
        ))}
        {filteredMentions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No mentions found</p>
          </div>
        )}
      </div>
    </div>
  );
}