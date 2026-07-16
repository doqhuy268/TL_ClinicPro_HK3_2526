"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Pin,
  PinOff,
  GripVertical,
  X,
  Upload,
  FileTextIcon,
  BookOpen,
  ChartBarStacked,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { postsService } from "@/lib/services/posts.service";
import type {
  PostResponse,
  CategoryResponse,
  SeriesResponse,
  PostStatus,
  PostInList,
} from "@/lib/types/posts";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function PostsManagementPage() {
  const [tab, setTab] = React.useState("posts");
  return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col gap-6 px-8 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Quản lý bài viết</h2>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList>
            <TabsTrigger className="flex items-center min-w-40 gap-2 rounded-md transition
            data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground
            data-[state=inactive]:text-muted-foreground" value="posts"> <FileTextIcon className="h-4 w-4" /> Bài viết</TabsTrigger>
            <TabsTrigger className="flex items-center min-w-40 gap-2 rounded-md transition
            data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground
            data-[state=inactive]:text-muted-foreground" value="categories"> <ChartBarStacked className="h-4 w-4" /> Danh mục</TabsTrigger>
            <TabsTrigger className="flex items-center min-w-40 gap-2 rounded-md transition
            data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground
            data-[state=inactive]:text-muted-foreground" value="series"> <BookOpen className="h-4 w-4" /> Series</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4">
            <PostsTab />
          </TabsContent>
          <TabsContent value="categories" className="mt-4">
            <CategoriesTab />
          </TabsContent>
          <TabsContent value="series" className="mt-4">
            <SeriesTab />
          </TabsContent>
        </Tabs>
        <Toaster richColors position="top-right" />
      </div>
    </div>
  );
}

// ============== POSTS TAB ==============
function PostsTab() {
  const router = useRouter();
  const [limit] = React.useState(20);
  const [offset, setOffset] = React.useState(0);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<PostStatus | "ALL">("ALL");

  const [data, setData] = React.useState<PostResponse[]>([]);
  const [pagination, setPagination] = React.useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [newPostTitle, setNewPostTitle] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const loadPosts = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await postsService.getAdminPosts({
        limit,
        offset,
        search: search || undefined,
        status: statusFilter === "ALL" ? undefined : (statusFilter as PostStatus),
      });
      setData(res.items || []);
      setPagination(res.pagination);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [limit, offset, search, statusFilter]);

  React.useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const handleCreateDraft = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const draft = await postsService.createDraft({
        title: newPostTitle || undefined,
      });
      toast.success("Tạo bản nháp thành công!");
      setCreateDialogOpen(false);
      setNewPostTitle("");
      // Chuyển đến trang edit
      router.push(`/posts-management/${draft.id}/edit`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tạo bản nháp");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa bài viết này?")) return;
    try {
      await postsService.deletePost(id);
      toast.success("Xóa bài viết thành công!");
      void loadPosts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi xóa bài viết");
    }
  };

  const handleTogglePin = async (post: PostResponse) => {
    try {
      await postsService.updatePost(post.id, { isPinned: !post.isPinned });
      toast.success(
        `${post.isPinned ? "Bỏ ghim" : "Ghim"} bài viết thành công!`
      );
      void loadPosts();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi cập nhật");
    }
  };

  const getStatusBadge = (status: PostStatus) => {
    const variants: Record<
      PostStatus,
      { variant: "default" | "secondary" | "destructive"; label: string }
    > = {
      DRAFT: { variant: "secondary", label: "Bản nháp" },
      PUBLISHED: { variant: "default", label: "Đã xuất bản" },
      UNPUBLISHED: { variant: "destructive", label: "Chưa xuất bản" },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Tìm kiếm bài viết..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as PostStatus | "ALL")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="DRAFT">Bản nháp</SelectItem>
              <SelectItem value="PUBLISHED">Đã xuất bản</SelectItem>
              <SelectItem value="UNPUBLISHED">Chưa xuất bản</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => loadPosts()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tạo bài viết
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo bài viết mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Tiêu đề bài viết</Label>
                <Input
                  id="title"
                  placeholder="Nhập tiêu đề..."
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !creating) {
                      void handleCreateDraft();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button onClick={handleCreateDraft} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tạo bản nháp
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {!loading && !error && (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted px-8">
                  <TableHead className="w-12 px-4">ID</TableHead>
                  <TableHead className="px-4">Tiêu đề</TableHead>
                  <TableHead className="px-4">Trạng thái</TableHead>
                  <TableHead className="px-4">Danh mục</TableHead>
                  <TableHead className="px-4">Lượt thích</TableHead>
                  <TableHead className="px-4">Bình luận</TableHead>
                  <TableHead className="px-4">Ngày tạo</TableHead>
                  <TableHead className="text-right px-4">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500">
                      Không có bài viết nào
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((post, idx) => (
                    <TableRow key={post.id} className="px-4">
                      <TableCell className="px-4">{offset + idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {post.isPinned && (
                            <Pin className="h-4 w-4 text-blue-500" />
                          )}
                          <span className="font-medium px-4">{post.title}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4">{getStatusBadge(post.status)}</TableCell>
                      <TableCell>
                        {post.categories.length > 0 ? (
                          <div className="flex gap-1 px-4">
                            {post.categories.map((cat) => (
                              <Badge key={cat.id} variant="outline">
                                {cat.name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 px-4">-</span>
                        )}
                      </TableCell>
                      <TableCell className="px-4">{post.likesCount}</TableCell>
                      <TableCell className="px-4">{post.commentsCount}</TableCell>
                      <TableCell className="px-4">
                        {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-right px-4">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleTogglePin(post)}
                            title={post.isPinned ? "Bỏ ghim" : "Ghim"}
                          >
                            {post.isPinned ? (
                              <PinOff className="h-4 w-4" />
                            ) : (
                              <Pin className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              router.push(`/posts-management/${post.id}/edit`)
                            }
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Hiển thị {offset + 1} -{" "}
              {Math.min(offset + limit, pagination.total)} / {pagination.total}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setOffset(offset + limit)}
                disabled={!pagination.hasMore}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ============== CATEGORIES TAB ==============
function CategoriesTab() {
  const [categories, setCategories] = React.useState<CategoryResponse[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [statusFilter, setStatusFilter] = React.useState<PostStatus | "ALL">("ALL");
  const [search, setSearch] = React.useState("");

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CategoryResponse | null>(null);
  const [form, setForm] = React.useState<{
    name: string;
    slug?: string;
    description: string;
    coverImage?: string;
    status?: PostStatus;
  }>({ name: "", slug: "", description: "", coverImage: "", status: "DRAFT" });
  const [submitting, setSubmitting] = React.useState(false);
  const [coverImageFile, setCoverImageFile] = React.useState<File | null>(null);
  const coverImageInputRef = React.useRef<HTMLInputElement>(null);

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [newCategoryName, setNewCategoryName] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  const loadCategories = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await postsService.getAllCategories();
      let filtered = res || [];
      
      // Filter by status
      if (statusFilter !== "ALL") {
        filtered = filtered.filter((cat) => cat.status === statusFilter);
      }
      
      // Filter by search
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((cat) =>
          cat.name.toLowerCase().includes(searchLower) ||
          cat.description.toLowerCase().includes(searchLower)
        );
      }
      
      setCategories(filtered);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  React.useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const handleCreateDraft = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const draft = await postsService.createDraftCategory({
        name: newCategoryName || undefined,
      });
      toast.success("Tạo bản nháp danh mục thành công!");
      setCreateDialogOpen(false);
      setNewCategoryName("");
      // Open edit dialog for the new draft
      openEdit(draft);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tạo bản nháp");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (cat: CategoryResponse) => {
    setEditing(cat);
    setForm({ 
      name: cat.name, 
      slug: cat.slug, 
      description: cat.description,
      coverImage: cat.coverImage || "",
      status: cat.status,
    });
    setCoverImageFile(null);
    setOpen(true);
  };

  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      // Preview
      const reader = new FileReader();
      reader.onload = () => {
        setForm({ ...form, coverImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!form.name.trim() || !form.description.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSubmitting(true);
    try {
      let coverImageUrl = form.coverImage;
      
      // Upload cover image if selected
      if (coverImageFile && editing) {
        toast.info("Đang upload ảnh bìa...");
        const { fileStorageService } = await import("@/lib/services/file-storage.service");
        const extension = coverImageFile.name.split(".").pop() || "jpg";
        const uniqueFileName = `${editing.id}.${extension}`;
        
        const renamedFile = new File([coverImageFile], uniqueFileName, {
          type: coverImageFile.type,
        });

        const uploadedFile = await fileStorageService.uploadFile(
          renamedFile,
          "categories"
        );
        coverImageUrl = uploadedFile.url;
      }

      if (editing) {
        await postsService.updateCategory(editing.id, {
          name: form.name,
          slug: form.slug || undefined,
          description: form.description,
          coverImage: coverImageUrl || undefined,
          status: form.status,
        });
        toast.success("Cập nhật danh mục thành công!");
      } else {
        await postsService.createCategory({
          name: form.name,
          slug: form.slug || undefined,
          description: form.description,
          coverImage: coverImageUrl || undefined,
        });
        toast.success("Tạo danh mục thành công!");
      }
      setOpen(false);
      void loadCategories();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi lưu danh mục");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa danh mục này?")) return;
    try {
      await postsService.deleteCategory(id);
      toast.success("Xóa danh mục thành công!");
      void loadCategories();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi xóa danh mục");
    }
  };

  const getStatusBadge = (status: PostStatus) => {
    const variants: Record<
      PostStatus,
      { variant: "default" | "secondary" | "destructive"; label: string }
    > = {
      DRAFT: { variant: "secondary", label: "Bản nháp" },
      PUBLISHED: { variant: "default", label: "Đã xuất bản" },
      UNPUBLISHED: { variant: "destructive", label: "Chưa xuất bản" },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Tìm kiếm danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as PostStatus | "ALL")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="DRAFT">Bản nháp</SelectItem>
              <SelectItem value="PUBLISHED">Đã xuất bản</SelectItem>
              <SelectItem value="UNPUBLISHED">Chưa xuất bản</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => loadCategories()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tạo danh mục
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo danh mục mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category-name">Tên danh mục</Label>
                <Input
                  id="category-name"
                  placeholder="Nhập tên danh mục..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !creating) {
                      void handleCreateDraft();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button onClick={handleCreateDraft} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tạo bản nháp
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Chỉnh sửa danh mục" : "Tạo danh mục mới"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên danh mục</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nhập tên danh mục..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (tùy chọn)</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="Để trống để tự động tạo..."
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Nhập mô tả..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm({ ...form, status: v as PostStatus })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Bản nháp</SelectItem>
                    <SelectItem value="PUBLISHED">Xuất bản</SelectItem>
                    <SelectItem value="UNPUBLISHED">Chưa xuất bản</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ảnh bìa</Label>
                {form.coverImage && (
                  <div className="relative w-full h-48">
                    <Image
                      src={form.coverImage}
                      alt="Cover"
                      fill
                      className="object-cover rounded-md"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setForm({ ...form, coverImage: "" });
                        setCoverImageFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <input
                  ref={coverImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverImageSelect}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => coverImageInputRef.current?.click()}
                  type="button"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {form.coverImage ? "Thay đổi ảnh" : "Tải lên ảnh"}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editing ? "Cập nhật" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {!loading && !error && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted px-8">
                <TableHead className="w-12 px-4">ID</TableHead>
                <TableHead className="px-4">Tên</TableHead>
                <TableHead className="px-4">Slug</TableHead>
                <TableHead className="px-4">Mô tả</TableHead>
                <TableHead className="px-4">Số bài viết</TableHead>
                <TableHead className="text-right px-4">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow className=" px-8">
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    Không có danh mục nào
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((cat, idx) => (
                  <TableRow key={cat.id} className="px-4">
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium px-4">
                      <div className="flex items-center gap-2">
                        {cat.coverImage && (
                          <div className="relative w-10 h-10">
                            <Image 
                              src={cat.coverImage} 
                              alt={cat.name}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        )}
                        <span className="px-4">{cat.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {cat.slug}
                      </code>
                    </TableCell>
                    <TableCell className="px-4">{getStatusBadge(cat.status)}</TableCell>
                    <TableCell className="max-w-md truncate px-4">
                      {cat.description}
                    </TableCell>
                    <TableCell className="px-4">{cat.totalPosts}</TableCell>
                    <TableCell className="text-right px-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(cat)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(cat.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

// ============== SORTABLE POST ITEM ==============
interface SortablePostItemProps {
  post: PostInList & { order: number | null };
  onRemove: (postId: string) => void;
  index: number;
}

function SortablePostItem({ post, onRemove, index }: SortablePostItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 bg-white border rounded-lg hover:bg-gray-50"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-200 rounded"
        title="Kéo để sắp xếp lại"
      >
        <GripVertical className="h-5 w-5 text-gray-400" />
      </button>
      <div className="flex-1">
        <div className="font-medium">{post.title}</div>
        <div className="text-sm text-gray-500">
          Vị trí: #{index + 1}
        </div>
      </div>
      <Badge
        variant={
          post.status === "PUBLISHED"
            ? "default"
            : post.status === "DRAFT"
            ? "secondary"
            : "destructive"
        }
      >
        {post.status === "PUBLISHED"
          ? "Đã xuất bản"
          : post.status === "DRAFT"
          ? "Bản nháp"
          : "Chưa xuất bản"}
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onRemove(post.id)}
        className="text-red-500 hover:text-red-700 hover:bg-red-50"
        title="Xóa khỏi series"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ============== SERIES TAB ==============
function SeriesTab() {
  const [series, setSeries] = React.useState<SeriesResponse[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [statusFilter, setStatusFilter] = React.useState<PostStatus | "ALL">("ALL");
  const [search, setSearch] = React.useState("");

  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<SeriesResponse | null>(null);
  const [form, setForm] = React.useState<{
    name: string;
    slug?: string;
    description: string;
    coverImage?: string;
    status?: PostStatus;
  }>({ name: "", slug: "", description: "", coverImage: "", status: "DRAFT" });
  const [posts, setPosts] = React.useState<(PostInList & { order: number | null })[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [coverImageFile, setCoverImageFile] = React.useState<File | null>(null);
  const coverImageInputRef = React.useRef<HTMLInputElement>(null);

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [newSeriesName, setNewSeriesName] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  // For searching and adding posts to series
  const [postSearchQuery, setPostSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<PostResponse[]>([]);
  const [searchingPosts, setSearchingPosts] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const loadSeries = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await postsService.getAllSeries();
      let filtered = res || [];
      
      // Filter by status
      if (statusFilter !== "ALL") {
        filtered = filtered.filter((s) => s.status === statusFilter);
      }
      
      // Filter by search
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter((s) =>
          s.name.toLowerCase().includes(searchLower) ||
          s.description.toLowerCase().includes(searchLower)
        );
      }
      
      setSeries(filtered);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  React.useEffect(() => {
    void loadSeries();
  }, [loadSeries]);

  const handleCreateDraft = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const draft = await postsService.createDraftSeries({
        name: newSeriesName || undefined,
      });
      toast.success("Tạo bản nháp series thành công!");
      setCreateDialogOpen(false);
      setNewSeriesName("");
      // Open edit dialog for the new draft
      openEdit(draft);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi tạo bản nháp");
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (s: SeriesResponse) => {
    setEditing(s);
    setForm({ 
      name: s.name, 
      slug: s.slug, 
      description: s.description,
      coverImage: s.coverImage || "",
      status: s.status,
    });
    // Sort posts by order
    const sortedPosts = [...s.posts].sort((a, b) => {
      const orderA = a.order ?? 999;
      const orderB = b.order ?? 999;
      return orderA - orderB;
    }).map(p => ({
      ...p,
      order: p.order ?? null
    }));
    setPosts(sortedPosts);
    setCoverImageFile(null);
    setPostSearchQuery("");
    setSearchResults([]);
    setOpen(true);
  };

  const handleSearchPosts = React.useCallback(async () => {
    if (!postSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchingPosts(true);
    try {
      const res = await postsService.getAdminPosts({
        search: postSearchQuery,
        limit: 20,
        offset: 0,
      });
      // Filter out posts that are already in the series
      const existingPostIds = new Set(posts.map(p => p.id));
      const filtered = res.items.filter(p => !existingPostIds.has(p.id));
      setSearchResults(filtered);
    } catch {
      toast.error("Lỗi tìm kiếm bài viết");
      setSearchResults([]);
    } finally {
      setSearchingPosts(false);
    }
  }, [postSearchQuery, posts]);

  React.useEffect(() => {
    if (open && editing) {
      const timeoutId = setTimeout(() => {
        void handleSearchPosts();
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [postSearchQuery, open, editing, handleSearchPosts]);

  const handleAddPost = (post: PostResponse) => {
    // Add to the end of the list
    const newOrder = posts.length;
    setPosts(prev => [...prev, {
      id: post.id,
      title: post.title,
      slug: post.slug,
      status: post.status,
      isPinned: post.isPinned,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      order: newOrder,
    }]);
    
    // Remove from search results
    setSearchResults(prev => prev.filter(p => p.id !== post.id));
    toast.success(`Đã thêm "${post.title}" vào series`);
  };

  const handleCoverImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImageFile(file);
      // Preview
      const reader = new FileReader();
      reader.onload = () => {
        setForm({ ...form, coverImage: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setPosts((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update order based on new position
        return newItems.map((item, index) => ({
          ...item,
          order: index,
        }));
      });
    }
  };

  const handleRemovePost = (postId: string) => {
    setPosts((prev) => {
      const filtered = prev.filter((p) => p.id !== postId);
      // Reorder remaining posts
      return filtered.map((item, index) => ({
        ...item,
        order: index,
      }));
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!form.name.trim() || !form.description.trim()) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSubmitting(true);
    try {
      let coverImageUrl = form.coverImage;
      
      // Upload cover image if selected
      if (coverImageFile && editing) {
        toast.info("Đang upload ảnh bìa...");
        const { fileStorageService } = await import("@/lib/services/file-storage.service");
        const extension = coverImageFile.name.split(".").pop() || "jpg";
        const uniqueFileName = `${editing.id}.${extension}`;
        
        const renamedFile = new File([coverImageFile], uniqueFileName, {
          type: coverImageFile.type,
        });

        const uploadedFile = await fileStorageService.uploadFile(
          renamedFile,
          "series"
        );
        coverImageUrl = uploadedFile.url;
      }

      const postsData = posts.map((p) => ({
        postId: p.id,
        order: p.order ?? 0,
      }));

      if (editing) {
        await postsService.updateSeries(editing.id, {
          name: form.name,
          slug: form.slug || undefined,
          description: form.description,
          coverImage: coverImageUrl || undefined,
          status: form.status,
          posts: postsData.length > 0 ? postsData : undefined,
        });
        toast.success("Cập nhật series thành công!");
      } else {
        await postsService.createSeries({
          name: form.name,
          slug: form.slug || undefined,
          description: form.description,
          coverImage: coverImageUrl || undefined,
          posts: postsData.length > 0 ? postsData : undefined,
        });
        toast.success("Tạo series thành công!");
      }
      setOpen(false);
      void loadSeries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi lưu series");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa series này?")) return;
    try {
      await postsService.deleteSeries(id);
      toast.success("Xóa series thành công!");
      void loadSeries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi xóa series");
    }
  };

  const getStatusBadge = (status: PostStatus) => {
    const variants: Record<
      PostStatus,
      { variant: "default" | "secondary" | "destructive"; label: string }
    > = {
      DRAFT: { variant: "secondary", label: "Bản nháp" },
      PUBLISHED: { variant: "default", label: "Đã xuất bản" },
      UNPUBLISHED: { variant: "destructive", label: "Chưa xuất bản" },
    };
    const { variant, label} = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <Input
            placeholder="Tìm kiếm series..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as PostStatus | "ALL")}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả</SelectItem>
              <SelectItem value="DRAFT">Bản nháp</SelectItem>
              <SelectItem value="PUBLISHED">Đã xuất bản</SelectItem>
              <SelectItem value="UNPUBLISHED">Chưa xuất bản</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => loadSeries()}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tạo series
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo series mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="series-name">Tên series</Label>
                <Input
                  id="series-name"
                  placeholder="Nhập tên series..."
                  value={newSeriesName}
                  onChange={(e) => setNewSeriesName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !creating) {
                      void handleCreateDraft();
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button onClick={handleCreateDraft} disabled={creating}>
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Tạo bản nháp
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      {open && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="!w-[60vw] sm:!max-w-[60vw] max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {editing ? "Chỉnh sửa series" : "Tạo series mới"}
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6 py-4 overflow-y-auto flex-1">
              {/* Cột trái: Thông tin cơ bản */}
              <div className="space-y-4 pr-4 border-r">
                <h3 className="font-semibold text-sm text-gray-700">Thông tin cơ bản</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="name">Tên series</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Nhập tên series..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (tùy chọn)</Label>
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    placeholder="Để trống để tự động tạo..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Nhập mô tả..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Trạng thái</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v as PostStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Bản nháp</SelectItem>
                      <SelectItem value="PUBLISHED">Xuất bản</SelectItem>
                      <SelectItem value="UNPUBLISHED">Chưa xuất bản</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Ảnh bìa</Label>
                  {form.coverImage && (
                    <div className="relative w-full h-48">
                      <Image
                        src={form.coverImage}
                        alt="Cover"
                        fill
                        className="object-cover rounded-md"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setForm({ ...form, coverImage: "" });
                          setCoverImageFile(null);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <input
                    ref={coverImageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleCoverImageSelect}
                  />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => coverImageInputRef.current?.click()}
                    type="button"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {form.coverImage ? "Thay đổi ảnh" : "Tải lên ảnh"}
                  </Button>
                </div>
              </div>

              {/* Cột phải: Danh sách bài viết */}
              <div className="space-y-4 pl-4">
                <h3 className="font-semibold text-sm text-gray-700">
                  Bài viết trong series
                </h3>

                {/* Search and Add Posts */}
                {editing && (
                  <div className="space-y-2">
                    <Label>Thêm bài viết vào series</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Tìm kiếm bài viết..."
                        value={postSearchQuery}
                        onChange={(e) => setPostSearchQuery(e.target.value)}
                        className="flex-1"
                      />
                      {searchingPosts && (
                        <Loader2 className="h-4 w-4 animate-spin self-center" />
                      )}
                    </div>
                    {searchResults.length > 0 && (
                      <div className="border rounded-lg max-h-48 overflow-y-auto">
                        {searchResults.map((post) => (
                          <div
                            key={post.id}
                            className="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-b-0"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {post.title}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant={
                                    post.status === "PUBLISHED"
                                      ? "default"
                                      : post.status === "DRAFT"
                                      ? "secondary"
                                      : "destructive"
                                  }
                                  className="text-xs"
                                >
                                  {post.status === "PUBLISHED"
                                    ? "Đã xuất bản"
                                    : post.status === "DRAFT"
                                    ? "Bản nháp"
                                    : "Chưa xuất bản"}
                                </Badge>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAddPost(post)}
                              className="ml-2"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Thêm
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    {postSearchQuery && !searchingPosts && searchResults.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-2">
                        Không tìm thấy bài viết nào
                      </p>
                    )}
                  </div>
                )}

                {/* Posts List with Drag and Drop */}
                {editing && posts.length > 0 && (
                  <div className="space-y-2">
                    <Label>
                      Danh sách bài viết ({posts.length})
                    </Label>
                    <p className="text-sm text-gray-500">
                      Kéo thả để sắp xếp lại thứ tự bài viết trong series
                    </p>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={posts.map((p) => p.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                          {posts.map((post, idx) => (
                            <SortablePostItem
                              key={post.id}
                              post={post}
                              index={idx}
                              onRemove={handleRemovePost}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                )}

                {editing && posts.length === 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                    Chưa có bài viết nào trong series này
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editing ? "Cập nhật" : "Tạo mới"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      )}

      {error && <div className="text-red-500 text-sm">{error}</div>}

      {!loading && !error && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted px-8">
                <TableHead className="w-12 px-4">ID</TableHead>
                <TableHead className="px-4">Tên</TableHead>
                <TableHead className="px-4">Slug</TableHead>
                <TableHead className="px-4">Trạng thái</TableHead>
                <TableHead className="px-4">Mô tả</TableHead>
                <TableHead className="px-4">Số bài viết</TableHead>
                <TableHead className="text-right px-4">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {series.length === 0 ? (
                <TableRow className="px-8">
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    Không có series nào
                  </TableCell>
                </TableRow>
              ) : (
                series.map((s, idx) => (
                  <TableRow key={s.id} className="px-4">
                    <TableCell>{idx + 1}</TableCell>
                    <TableCell className="font-medium px-4">
                      <div className="flex items-center gap-2">
                        {s.coverImage && (
                          <div className="relative w-10 h-10">
                            <Image 
                              src={s.coverImage} 
                              alt={s.name}
                              fill
                              className="object-cover rounded"
                            />
                          </div>
                        )}
                        <span className="px-4">{s.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {s.slug}
                      </code>
                    </TableCell>
                    <TableCell className="px-4">{getStatusBadge(s.status)}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {s.description}
                    </TableCell>
                    <TableCell className="px-4">{s.totalPosts}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(s.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
