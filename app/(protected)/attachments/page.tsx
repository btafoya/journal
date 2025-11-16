"use client";

import { useEffect, useState } from "react";
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
import { Upload, Download, Eye, Trash2, FileText, Image, Film, Music } from "lucide-react";

interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  entryId: string | null;
  createdAt: string;
}

interface AttachmentsResponse {
  attachments: Attachment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function AttachmentsPage() {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchAttachments = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/attachments?page=${page}&limit=20`);

      if (!response.ok) {
        throw new Error("Failed to fetch attachments");
      }

      const data: AttachmentsResponse = await response.json();
      setAttachments(data.attachments);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching attachments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/attachments/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      alert("File uploaded successfully!");
      fetchAttachments();
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(error.message || "Failed to upload file");
    } finally {
      setUploading(false);
      event.target.value = ""; // Reset input
    }
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const response = await fetch(`/api/attachments/${attachment.id}?download=true`);

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download file");
    }
  };

  const handlePreview = (attachment: Attachment) => {
    window.open(`/api/attachments/${attachment.id}/preview`, "_blank");
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!confirm(`Are you sure you want to delete "${attachment.originalName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/attachments/${attachment.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      fetchAttachments();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete file");
    }
  };

  useEffect(() => {
    fetchAttachments();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <Image className="h-5 w-5 text-blue-600" />;
    if (mimeType.startsWith("video/")) return <Film className="h-5 w-5 text-purple-600" />;
    if (mimeType.startsWith("audio/")) return <Music className="h-5 w-5 text-green-600" />;
    return <FileText className="h-5 w-5 text-gray-600" />;
  };

  const canPreview = (mimeType: string) => {
    const previewableTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
    ];
    return previewableTypes.includes(mimeType);
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">File Attachments</h1>
          <p className="text-muted-foreground mt-2">
            Upload and manage your file attachments
          </p>
        </div>
        <div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button asChild disabled={uploading}>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Upload File"}
            </label>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Attachments</CardTitle>
          <CardDescription>
            Total: {pagination.total} | Page {pagination.page} of {pagination.pages}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading attachments...</div>
          ) : attachments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attachments yet. Upload your first file to get started.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attachments.map((attachment) => (
                    <TableRow key={attachment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getFileIcon(attachment.mimeType)}
                          <span className="font-medium">{attachment.originalName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{attachment.mimeType.split("/")[0]}</Badge>
                      </TableCell>
                      <TableCell>{formatFileSize(attachment.size)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(attachment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {canPreview(attachment.mimeType) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(attachment)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(attachment)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(attachment)}
                          >
                            <Trash2 className="h-4 w-4" />
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
                    onClick={() => fetchAttachments(pagination.page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => fetchAttachments(pagination.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
