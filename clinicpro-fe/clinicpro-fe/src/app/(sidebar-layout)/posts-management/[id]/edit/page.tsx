"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Editor } from "@tinymce/tinymce-react";
type TinyMCEEditorLike = { getContent: () => string };
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { Loader2, Save, ChevronLeft, X, Upload } from "lucide-react";
import { postsService } from "@/lib/services/posts.service";
import { fileStorageService } from "@/lib/services/file-storage.service";
import type {
  PostResponse,
  PostStatus,
  CategoryResponse,
  SeriesResponse,
} from "@/lib/types/posts";

export default function EditPostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [post, setPost] = React.useState<PostResponse | null>(null);

  // Categories & Series
  const [categories, setCategories] = React.useState<CategoryResponse[]>([]);
  const [seriesList, setSeriesList] = React.useState<SeriesResponse[]>([]);

  // Form data
  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [content, setContent] = React.useState("");
  const [coverImage, setCoverImage] = React.useState("");
  const [status, setStatus] = React.useState<PostStatus>("DRAFT");
  const [isPinned, setIsPinned] = React.useState(false);
  const [tags, setTags] = React.useState<string[]>([]);
  const [tagInput, setTagInput] = React.useState("");
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    []
  );
  const [selectedSeries, setSelectedSeries] = React.useState<
    { seriesId: string; order?: number }[]
  >([]);

  const editorRef = React.useRef<TinyMCEEditorLike | null>(null);
  const coverImageInputRef = React.useRef<HTMLInputElement>(null);

  // Load post data
  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [postData, categoriesData, seriesData] = await Promise.all([
          postsService.getPostById(postId),
          postsService.getAllCategories(),
          postsService.getAllSeries(),
        ]);

        setPost(postData);
        setCategories(categoriesData);
        setSeriesList(seriesData);

        // Populate form
        setTitle(postData.title);
        setSummary(postData.summary || "");
        setContent(postData.content || "");
        setCoverImage(postData.coverImage || "");
        setStatus(postData.status);
        setIsPinned(postData.isPinned);
        setTags(postData.tags || []);
        setSelectedCategories(postData.categories.map((c) => c.id));
        setSelectedSeries(
          postData.series.map((s) => ({ seriesId: s.id, order: s.order || 0 }))
        );
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Lỗi tải dữ liệu bài viết"
        );
        console.error("Error loading post:", e);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [postId]);

  // Handle image upload in TinyMCE
  const handleImageUpload = async (
    blobInfo: { blob: () => Blob }
  ): Promise<string> => {
    try {
      const file = blobInfo.blob() as File;
      
      // Create a new file with unique name
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const extension = file.name.split(".").pop() || "jpg";
      const uniqueFileName = `${timestamp}_${randomStr}.${extension}`;
      
      const renamedFile = new File([file], uniqueFileName, {
        type: file.type,
      });

      const uploadedFile = await fileStorageService.uploadFile(
        renamedFile,
        "posts",
        postId
      );

      return uploadedFile.url;
    } catch (error) {
      toast.error("Lỗi upload ảnh");
      throw error;
    }
  };

  // Handle cover image upload
  const handleCoverImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("Đang upload ảnh bìa...");
      
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const extension = file.name.split(".").pop() || "jpg";
      const uniqueFileName = `cover_${timestamp}_${randomStr}.${extension}`;
      
      const renamedFile = new File([file], uniqueFileName, {
        type: file.type,
      });

      const uploadedFile = await fileStorageService.uploadFile(
        renamedFile,
        "posts",
        postId
      );
      
      setCoverImage(uploadedFile.url);
      toast.success("Upload ảnh bìa thành công!");
    } catch {
      toast.error("Lỗi upload ảnh bìa");
    }
  };

  // Handle tags
  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Handle category selection
  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  // Handle series selection
  const toggleSeries = (seriesId: string) => {
    const exists = selectedSeries.find((s) => s.seriesId === seriesId);
    if (exists) {
      setSelectedSeries(selectedSeries.filter((s) => s.seriesId !== seriesId));
    } else {
      setSelectedSeries([...selectedSeries, { seriesId, order: 0 }]);
    }
  };

  const updateSeriesOrder = (seriesId: string, order: number) => {
    setSelectedSeries(
      selectedSeries.map((s) =>
        s.seriesId === seriesId ? { ...s, order } : s
      )
    );
  };

  // Save post
  const handleSave = async () => {
    if (saving) return;

    if (!title.trim()) {
      toast.error("Vui lòng nhập tiêu đề");
      return;
    }

    setSaving(true);
    try {
      const editorContent = editorRef.current?.getContent() || "";

      await postsService.updatePost(postId, {
        title: title.trim(),
        summary: summary.trim() || undefined,
        content: editorContent,
        coverImage: coverImage || undefined,
        status,
        isPinned,
        tags: tags.length > 0 ? tags : undefined,
        categoryIds:
          selectedCategories.length > 0 ? selectedCategories : undefined,
        seriesAssignments:
          selectedSeries.length > 0 ? selectedSeries : undefined,
      });

      toast.success("Lưu bài viết thành công!");
      
      // Reload post data to get updated info
      const updatedPost = await postsService.getPostById(postId);
      setPost(updatedPost);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi lưu bài viết");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Không tìm thấy bài viết</p>
          <Button className="mt-4" onClick={() => router.push("/posts-management")}>
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col gap-6 px-8 py-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/posts-management")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">Chỉnh sửa bài viết</h1>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as PostStatus)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Bản nháp</SelectItem>
                <SelectItem value="PUBLISHED">Xuất bản</SelectItem>
                <SelectItem value="UNPUBLISHED">Chưa xuất bản</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              Lưu bài viết
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề bài viết..."
                className="text-lg font-semibold"
              />
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <Label htmlFor="summary">Tóm tắt</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Nhập tóm tắt ngắn gọn về bài viết..."
                rows={3}
              />
            </div>

            {/* Content Editor */}
            <div className="space-y-2">
              <Label>Nội dung</Label>
              <div className="border rounded-md overflow-hidden">
                <Editor
                  apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                  onInit={(evt, editor) => (editorRef.current = editor)}
                  initialValue={content}
                  init={{
                    height: 600,
                    menubar: true,
                    plugins: [
                      "advlist",
                      "autolink",
                      "lists",
                      "link",
                      "image",
                      "charmap",
                      "preview",
                      "anchor",
                      "searchreplace",
                      "visualblocks",
                      "code",
                      "fullscreen",
                      "insertdatetime",
                      "media",
                      "table",
                      "code",
                      "help",
                      "wordcount",
                    ],
                    toolbar:
                      "undo redo | blocks | " +
                      "bold italic forecolor | alignleft aligncenter " +
                      "alignright alignjustify | bullist numlist outdent indent | " +
                      "removeformat | image media link | code | help",
                    content_style:
                      "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
                    images_upload_handler: handleImageUpload,
                    automatic_uploads: true,
                    file_picker_types: "image",
                    images_reuse_filename: false,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Cover Image */}
            <div className="space-y-2 p-4 border rounded-lg">
              <Label>Ảnh bìa</Label>
              {coverImage && (
                <div className="relative w-full h-48">
                  <Image
                    src={coverImage}
                    alt="Cover Image"
                    fill
                    className="object-cover rounded-md"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 z-10"
                    onClick={() => setCoverImage("")}
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
                onChange={handleCoverImageUpload}
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => coverImageInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {coverImage ? "Thay đổi ảnh" : "Tải lên ảnh"}
              </Button>
            </div>

            {/* Settings */}
            <div className="space-y-2 p-4 border rounded-lg">
              <Label>Cài đặt</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4"
                />
                <Label htmlFor="isPinned" className="cursor-pointer">
                  Ghim bài viết
                </Label>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2 p-4 border rounded-lg">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Thêm tag..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button onClick={addTag} variant="outline">
                  Thêm
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button onClick={() => removeTag(tag)}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2 p-4 border rounded-lg">
              <Label>Danh mục</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {categories.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`cat-${cat.id}`}
                      checked={selectedCategories.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                      className="w-4 h-4"
                    />
                    <Label
                      htmlFor={`cat-${cat.id}`}
                      className="cursor-pointer flex-1"
                    >
                      {cat.name}
                    </Label>
                  </div>
                ))}
                {categories.length === 0 && (
                  <p className="text-sm text-gray-500">Chưa có danh mục nào</p>
                )}
              </div>
            </div>

            {/* Series */}
            <div className="space-y-2 p-4 border rounded-lg">
              <Label>Series</Label>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {seriesList.map((series) => {
                  const selected = selectedSeries.find(
                    (s) => s.seriesId === series.id
                  );
                  return (
                    <div key={series.id} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`series-${series.id}`}
                          checked={!!selected}
                          onChange={() => toggleSeries(series.id)}
                          className="w-4 h-4"
                        />
                        <Label
                          htmlFor={`series-${series.id}`}
                          className="cursor-pointer flex-1"
                        >
                          {series.name}
                        </Label>
                      </div>
                      {selected && (
                        <div className="ml-6">
                          <Label className="text-xs">Thứ tự</Label>
                          <Input
                            type="number"
                            min="0"
                            max="255"
                            value={selected.order || 0}
                            onChange={(e) =>
                              updateSeriesOrder(
                                series.id,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-20"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
                {seriesList.length === 0 && (
                  <p className="text-sm text-gray-500">Chưa có series nào</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}

