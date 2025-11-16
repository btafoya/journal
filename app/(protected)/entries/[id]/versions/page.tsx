"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Eye, RotateCcw, GitCompare } from "lucide-react";

interface EntryVersion {
  id: string;
  versionNumber: number;
  title: string;
  content?: string;
  wordCount: number;
  charCount: number;
  changeSummary: string | null;
  createdAt: string;
}

interface VersionsResponse {
  versions: EntryVersion[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function EntryVersionsPage() {
  const params = useParams();
  const router = useRouter();
  const entryId = params?.id as string;

  const [versions, setVersions] = useState<EntryVersion[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<EntryVersion | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const fetchVersions = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/entries/${entryId}/versions?page=${page}&limit=10&includeContent=false`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch versions");
      }

      const data: VersionsResponse = await response.json();
      setVersions(data.versions);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching versions:", error);
    } finally {
      setLoading(false);
    }
  };

  const viewVersion = async (version: EntryVersion) => {
    try {
      const response = await fetch(`/api/entries/${entryId}/versions/${version.id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch version details");
      }

      const fullVersion: EntryVersion = await response.json();
      setSelectedVersion(fullVersion);
      setViewDialogOpen(true);
    } catch (error) {
      console.error("Error viewing version:", error);
    }
  };

  const restoreVersion = async (version: EntryVersion) => {
    if (!confirm(`Are you sure you want to restore to version ${version.versionNumber}? This will create a new version snapshot of the current state before restoring.`)) {
      return;
    }

    try {
      setRestoring(true);
      const response = await fetch(`/api/entries/${entryId}/versions/${version.id}/restore`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to restore version");
      }

      alert("Version restored successfully!");
      router.push(`/entries/${entryId}`);
    } catch (error) {
      console.error("Error restoring version:", error);
      alert("Failed to restore version");
    } finally {
      setRestoring(false);
    }
  };

  useEffect(() => {
    if (entryId) {
      fetchVersions();
    }
  }, [entryId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push(`/entries/${entryId}`)}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Entry
          </Button>
          <h1 className="text-3xl font-bold">Version History</h1>
          <p className="text-muted-foreground mt-2">
            View and restore previous versions of this entry
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Versions</CardTitle>
          <CardDescription>
            Total versions: {pagination.total} | Showing page {pagination.page} of{" "}
            {pagination.pages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading versions...</div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No version history available yet. Versions are created automatically when you update
              the entry.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Words</TableHead>
                    <TableHead>Characters</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Summary</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {versions.map((version) => (
                    <TableRow key={version.id}>
                      <TableCell>
                        <Badge variant="outline">v{version.versionNumber}</Badge>
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate">
                        {version.title}
                      </TableCell>
                      <TableCell>{version.wordCount}</TableCell>
                      <TableCell>{version.charCount}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(version.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {version.changeSummary || "No summary"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewVersion(version)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => restoreVersion(version)}
                            disabled={restoring}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pagination.pages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    disabled={pagination.page === 1}
                    onClick={() => fetchVersions(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => fetchVersions(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Version {selectedVersion?.versionNumber} - {selectedVersion?.title}
            </DialogTitle>
            <DialogDescription>
              Created: {selectedVersion && formatDate(selectedVersion.createdAt)}
            </DialogDescription>
          </DialogHeader>
          {selectedVersion && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Change Summary</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedVersion.changeSummary || "No summary available"}
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Statistics</h4>
                <div className="flex gap-4 text-sm">
                  <span>Words: {selectedVersion.wordCount}</span>
                  <span>Characters: {selectedVersion.charCount}</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Content</h4>
                <div
                  className="prose prose-sm max-w-none border rounded-md p-4 bg-muted/50"
                  dangerouslySetInnerHTML={{ __html: selectedVersion.content || "" }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
