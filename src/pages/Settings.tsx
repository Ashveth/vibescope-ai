import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Twitter, MessageSquare, Mail, Slack } from "lucide-react";

export default function Settings() {
  const [autoAlerts, setAutoAlerts] = useState(true);
  const [threshold, setThreshold] = useState("medium");
  const [alertFrequency, setAlertFrequency] = useState(5);
  const [alertTimeWindow, setAlertTimeWindow] = useState(60);
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

          {/* Custom Alert Frequency Section */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg border border-border">
            <div className="space-y-2">
              <Label className="text-base font-semibold">⚠️ Custom Alert Threshold</Label>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm">Alert me if</span>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={alertFrequency}
                  onChange={(e) => setAlertFrequency(Number(e.target.value))}
                  className="w-20"
                />
                <span className="text-sm">negative mentions occur within</span>
                <Input
                  type="number"
                  min="15"
                  max="1440"
                  value={alertTimeWindow}
                  onChange={(e) => setAlertTimeWindow(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-sm">minutes</span>
              </div>
              <p className="text-xs text-muted-foreground">
                You'll receive alerts when {alertFrequency} or more negative mentions occur within {alertTimeWindow} minutes
              </p>
            </div>

            <div className="space-y-2">
              <Label>Alert Frequency: {alertFrequency} mentions</Label>
              <Slider
                value={[alertFrequency]}
                onValueChange={(val) => setAlertFrequency(val[0])}
                min={1}
                max={20}
                step={1}
                className="w-full"
              />
            </div>
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