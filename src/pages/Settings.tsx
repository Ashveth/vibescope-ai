import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Twitter, MessageSquare, Mail, Slack } from "lucide-react";

export default function Settings() {
  const [autoAlerts, setAutoAlerts] = useState(true);
  const [threshold, setThreshold] = useState("medium");
  const [emailNotif, setEmailNotif] = useState(true);
  const [slackNotif, setSlackNotif] = useState(false);
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("alert_settings").select("*").single();
      if (data) {
        setAutoAlerts(data.auto_alerts_enabled);
        setThreshold(data.alert_threshold);
        const notifMethods = data.notification_methods as any;
        setEmailNotif(notifMethods?.email || false);
        setSlackNotif(notifMethods?.slack || false);
      }

      const { data: compData } = await supabase.from("competitors").select("*");
      setCompetitors(compData?.map(c => c.name) || []);
    };
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    const { error } = await supabase.from("alert_settings").upsert({
      auto_alerts_enabled: autoAlerts,
      alert_threshold: threshold,
      notification_methods: { email: emailNotif, slack: slackNotif },
    });
    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved successfully");
    }
  };

  const addCompetitor = async () => {
    if (!newCompetitor.trim()) return;
    const { error } = await supabase.from("competitors").insert({ name: newCompetitor });
    if (error) {
      toast.error("Failed to add competitor");
    } else {
      setCompetitors([...competitors, newCompetitor]);
      setNewCompetitor("");
      toast.success("Competitor added");
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your monitoring preferences</p>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Alert Settings</CardTitle>
          <CardDescription>Configure how and when you receive alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto Alerts</Label>
              <p className="text-sm text-muted-foreground">Automatically notify on negative mentions</p>
            </div>
            <Switch checked={autoAlerts} onCheckedChange={setAutoAlerts} />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Alert Threshold</Label>
            <Select value={threshold} onValueChange={setThreshold}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low - All mentions</SelectItem>
                <SelectItem value="medium">Medium - Neutral & Negative</SelectItem>
                <SelectItem value="high">High - Negative only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Notification Methods</Label>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Email Notifications</span>
                </div>
                <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Slack className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Slack Notifications</span>
                </div>
                <Switch checked={slackNotif} onCheckedChange={setSlackNotif} />
              </div>
            </div>
          </div>

          <Button onClick={saveSettings} className="w-full bg-gradient-primary">
            Save Alert Settings
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>API Connections</CardTitle>
          <CardDescription>Connect social media and review platforms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Twitter className="h-5 w-5" />
              <div>
                <p className="font-medium">Twitter / X</p>
                <p className="text-xs text-muted-foreground">Monitor tweets and mentions</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Connect</Button>
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5" />
              <div>
                <p className="font-medium">Reddit</p>
                <p className="text-xs text-muted-foreground">Track subreddit discussions</p>
              </div>
            </div>
            <Button variant="outline" size="sm">Connect</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Competitor Tracking</CardTitle>
          <CardDescription>Monitor sentiment for competitor brands</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter competitor name..."
              value={newCompetitor}
              onChange={(e) => setNewCompetitor(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
            />
            <Button onClick={addCompetitor}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {competitors.map((comp, i) => (
              <div key={i} className="px-3 py-1 bg-muted rounded-lg text-sm">
                {comp}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}