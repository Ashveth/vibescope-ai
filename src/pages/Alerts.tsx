import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const severityConfig = {
  critical: { color: "bg-red-500", label: "Critical", icon: AlertTriangle },
  high: { color: "bg-orange-500", label: "High", icon: AlertTriangle },
  medium: { color: "bg-yellow-500", label: "Medium", icon: Clock },
  low: { color: "bg-blue-500", label: "Low", icon: Check },
};

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [autoAlerts, setAutoAlerts] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      const { data } = await supabase
        .from("mentions")
        .select("*")
        .in("sentiment", ["negative"])
        .order("severity", { ascending: false })
        .order("timestamp", { ascending: false });
      setAlerts(data || []);
    };

    fetchAlerts();
    const channel = supabase
      .channel("alerts-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "mentions" }, fetchAlerts)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const acknowledgeAlert = async (id: string) => {
    await supabase.from("mentions").update({ team_approved: true }).eq("id", id);
    toast.success("Alert acknowledged");
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-muted-foreground">Monitor critical mentions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Switch id="auto-alerts" checked={autoAlerts} onCheckedChange={setAutoAlerts} />
          <Label htmlFor="auto-alerts">Auto Alerts</Label>
        </div>
      </div>

      <div className="grid gap-4">
        {alerts
          .sort((a, b) => {
            const order = { critical: 0, high: 1, medium: 2, low: 3 };
            return order[a.severity as keyof typeof order] - order[b.severity as keyof typeof order];
          })
          .map((alert) => {
            const config = severityConfig[alert.severity as keyof typeof severityConfig];
            const Icon = config.icon;
            return (
              <Card
                key={alert.id}
                className={cn(
                  "border-l-4 animate-fade-in bg-card/50 backdrop-blur-sm",
                  alert.severity === "critical" && "border-l-red-500",
                  alert.severity === "high" && "border-l-orange-500",
                  alert.severity === "medium" && "border-l-yellow-500",
                  alert.severity === "low" && "border-l-blue-500"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-full", config.color)}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{alert.user_name}</CardTitle>
                        <CardDescription>
                          {alert.source} • {new Date(alert.timestamp).toLocaleString()}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-white", config.color)}>
                      {config.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{alert.content}</p>
                  <div className="flex flex-wrap gap-2">
                    {alert.tags?.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  {alert.suggested_response && (
                    <div className="p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-sm font-medium mb-1">Suggested Response:</p>
                      <p className="text-sm text-muted-foreground">{alert.suggested_response}</p>
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="w-full"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Acknowledge Alert
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        {alerts.length === 0 && (
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardContent className="py-12 text-center">
              <Check className="h-12 w-12 text-success mx-auto mb-4" />
              <p className="text-lg font-medium">No Active Alerts</p>
              <p className="text-sm text-muted-foreground">All mentions are handled!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}