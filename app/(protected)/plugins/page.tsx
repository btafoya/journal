"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Puzzle, Download, Settings, Trash2, AlertCircle, CheckCircle } from "lucide-react";

interface Plugin {
  id: string;
  pluginId: string;
  version: string;
  status: "ACTIVE" | "INACTIVE" | "ERROR" | "SUSPENDED";
  permissions: string[];
  config: Record<string, any>;
  installedAt: string;
  lastEnabled?: string;
  lastDisabled?: string;
  errorMessage?: string;
}

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPlugins();
  }, []);

  async function fetchPlugins() {
    try {
      setLoading(true);
      const response = await fetch("/api/plugins");
      if (!response.ok) throw new Error("Failed to fetch plugins");
      const data = await response.json();
      setPlugins(data.plugins || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load plugins");
    } finally {
      setLoading(false);
    }
  }

  async function togglePlugin(pluginId: string, currentStatus: string) {
    try {
      const endpoint = currentStatus === "ACTIVE" ? "deactivate" : "activate";
      const response = await fetch(`/api/plugins/${pluginId}/${endpoint}`, {
        method: "POST",
      });

      if (!response.ok) throw new Error(`Failed to ${endpoint} plugin`);

      await fetchPlugins();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to toggle plugin`);
    }
  }

  async function uninstallPlugin(pluginId: string) {
    if (!confirm("Are you sure you want to uninstall this plugin? This will delete all plugin data.")) {
      return;
    }

    try {
      const response = await fetch(`/api/plugins/${pluginId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to uninstall plugin");

      await fetchPlugins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to uninstall plugin");
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading plugins...</div>
        </div>
      </div>
    );
  }

  const installedPlugins = plugins;
  const activePlugins = plugins.filter((p) => p.status === "ACTIVE");
  const inactivePlugins = plugins.filter((p) => p.status === "INACTIVE");
  const errorPlugins = plugins.filter((p) => p.status === "ERROR");

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Plugins</h1>
        <p className="text-muted-foreground">
          Extend your journal with custom functionality and integrations
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Installed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{installedPlugins.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activePlugins.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">With Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{errorPlugins.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="installed" className="space-y-6">
        <TabsList>
          <TabsTrigger value="installed">
            Installed ({installedPlugins.length})
          </TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="installed" className="space-y-4">
          {installedPlugins.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Puzzle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No plugins installed</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Browse the marketplace to extend your journal with new features
                </p>
                <Button>
                  <Download className="h-4 w-4 mr-2" />
                  Browse Marketplace
                </Button>
              </CardContent>
            </Card>
          ) : (
            installedPlugins.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                onToggle={togglePlugin}
                onUninstall={uninstallPlugin}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="marketplace">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Download className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Marketplace Coming Soon</h3>
              <p className="text-muted-foreground text-center">
                Discover and install community-created plugins to enhance your journal
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PluginCard({
  plugin,
  onToggle,
  onUninstall,
}: {
  plugin: Plugin;
  onToggle: (pluginId: string, status: string) => Promise<void>;
  onUninstall: (pluginId: string) => Promise<void>;
}) {
  const [toggling, setToggling] = useState(false);
  const [uninstalling, setUninstalling] = useState(false);

  async function handleToggle() {
    setToggling(true);
    try {
      await onToggle(plugin.pluginId, plugin.status);
    } finally {
      setToggling(false);
    }
  }

  async function handleUninstall() {
    setUninstalling(true);
    try {
      await onUninstall(plugin.pluginId);
    } finally {
      setUninstalling(false);
    }
  }

  const isActive = plugin.status === "ACTIVE";
  const hasError = plugin.status === "ERROR";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-xl">{formatPluginName(plugin.pluginId)}</CardTitle>
              {isActive && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              )}
              {hasError && (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Error
                </Badge>
              )}
            </div>
            <CardDescription>Version {plugin.version}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={isActive}
              onCheckedChange={handleToggle}
              disabled={toggling || hasError}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {hasError && plugin.errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{plugin.errorMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Permissions</h4>
            <div className="flex flex-wrap gap-2">
              {plugin.permissions.map((permission) => (
                <Badge key={permission} variant="secondary">
                  {formatPermission(permission)}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Installed {new Date(plugin.installedAt).toLocaleDateString()}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                <Settings className="h-4 w-4 mr-2" />
                Configure
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleUninstall}
                disabled={uninstalling}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {uninstalling ? "Uninstalling..." : "Uninstall"}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatPluginName(pluginId: string): string {
  return pluginId
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatPermission(permission: string): string {
  return permission
    .replace(/_/g, " ")
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
