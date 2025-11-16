"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
  editedAt: string | null;
  user: User;
  replies?: Comment[];
}

interface CommentListProps {
  entryId: string;
  currentUserId: string;
}

export function CommentList({ entryId, currentUserId }: CommentListProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // Fetch comments
  useEffect(() => {
    fetchComments();
  }, [entryId]);

  async function fetchComments() {
    try {
      const response = await fetch(`/api/comments?entryId=${entryId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId,
          content: newComment,
        }),
      });

      if (response.ok) {
        setNewComment("");
        await fetchComments();
      } else {
        alert("Failed to post comment");
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
      alert("Failed to post comment");
    }
  }

  async function handleSubmitReply(e: React.FormEvent, parentId: string) {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryId,
          content: replyContent,
          parentId,
        }),
      });

      if (response.ok) {
        setReplyContent("");
        setReplyTo(null);
        await fetchComments();
      } else {
        alert("Failed to post reply");
      }
    } catch (error) {
      console.error("Failed to post reply:", error);
      alert("Failed to post reply");
    }
  }

  async function handleEditComment(commentId: string) {
    if (!editContent.trim()) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent }),
      });

      if (response.ok) {
        setEditingId(null);
        setEditContent("");
        await fetchComments();
      } else {
        alert("Failed to edit comment");
      }
    } catch (error) {
      console.error("Failed to edit comment:", error);
      alert("Failed to edit comment");
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchComments();
      } else {
        alert("Failed to delete comment");
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
      alert("Failed to delete comment");
    }
  }

  function renderComment(comment: Comment, isReply = false) {
    const isAuthor = comment.user.id === currentUserId;
    const isEditing = editingId === comment.id;

    return (
      <div
        key={comment.id}
        id={`comment-${comment.id}`}
        className={`
          ${isReply ? "ml-8 sm:ml-12 border-l-2 border-primary/20 pl-4" : ""}
          bg-card rounded-lg p-4 sm:p-6 shadow-sm border border-border
        `}
      >
        {/* Comment Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
              {comment.user.name?.[0]?.toUpperCase() || comment.user.email?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <p className="font-semibold text-card-foreground">{comment.user.name || comment.user.email}</p>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                {comment.isEdited && <span className="ml-1">(edited)</span>}
              </p>
            </div>
          </div>

          {/* Actions */}
          {isAuthor && !isEditing && (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingId(comment.id);
                  setEditContent(comment.content);
                }}
                className="text-sm text-primary hover:underline"
              >
                Edit
              </button>
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="text-sm text-destructive hover:underline"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Comment Content */}
        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleEditComment(comment.id);
            }}
            className="space-y-2"
          >
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setEditContent("");
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="text-card-foreground whitespace-pre-wrap mb-3">{comment.content}</p>

            {/* Reply Button */}
            {!isReply && (
              <button
                onClick={() => setReplyTo(comment.id)}
                className="text-sm text-primary hover:underline"
              >
                Reply
              </button>
            )}
          </>
        )}

        {/* Reply Form */}
        {replyTo === comment.id && (
          <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="mt-4 space-y-2">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              className="w-full px-4 py-2 border border-input rounded-md bg-background text-foreground min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm"
              >
                Reply
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyTo(null);
                  setReplyContent("");
                }}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">{comment.replies.map((reply) => renderComment(reply, true))}</div>
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="text-muted-foreground">Loading comments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Comments</h2>

      {/* New Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-4">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full px-4 py-3 border border-input rounded-md bg-background text-foreground min-h-[120px] focus:outline-none focus:ring-2 focus:ring-ring"
          required
        />
        <button
          type="submit"
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-semibold"
        >
          Post Comment
        </button>
      </form>

      {/* Comments List */}
      {comments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-6">{comments.map((comment) => renderComment(comment))}</div>
      )}
    </div>
  );
}
