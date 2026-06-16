"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, RefreshCw, X, Search, Settings, ScrollText, TicketPercent, Stethoscope, Brain, Building, Eye } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { specialtiesService, clinicRoomsService, boothsService, templatesService, type Specialty, type ClinicRoom, type Booth, type Template, type TemplateField, type CreateTemplateDto, type UpdateTemplateDto, type ListResponse, type CreateClinicRoomDto, type UpdateClinicRoomDto, type CreateBoothDto, type UpdateBoothDto } from "@/lib/services/facilities.service"
import { servicesService, serviceSearchApi, type Service } from "@/lib/services/services.service"

// Helper function to normalize Vietnamese text (remove accents)
function normalizeVietnameseText(text: string): string {
  const vietnameseMap: Record<string, string> = {
    'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
    'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
    'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
    'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
    'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
    'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
    'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
    'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
    'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
    'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
    'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
    'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
    'đ': 'd',
    'À': 'A', 'Á': 'A', 'Ạ': 'A', 'Ả': 'A', 'Ã': 'A',
    'Â': 'A', 'Ầ': 'A', 'Ấ': 'A', 'Ậ': 'A', 'Ẩ': 'A', 'Ẫ': 'A',
    'Ă': 'A', 'Ằ': 'A', 'Ắ': 'A', 'Ặ': 'A', 'Ẳ': 'A', 'Ẵ': 'A',
    'È': 'E', 'É': 'E', 'Ẹ': 'E', 'Ẻ': 'E', 'Ẽ': 'E',
    'Ê': 'E', 'Ề': 'E', 'Ế': 'E', 'Ệ': 'E', 'Ể': 'E', 'Ễ': 'E',
    'Ì': 'I', 'Í': 'I', 'Ị': 'I', 'Ỉ': 'I', 'Ĩ': 'I',
    'Ò': 'O', 'Ó': 'O', 'Ọ': 'O', 'Ỏ': 'O', 'Õ': 'O',
    'Ô': 'O', 'Ồ': 'O', 'Ố': 'O', 'Ộ': 'O', 'Ổ': 'O', 'Ỗ': 'O',
    'Ơ': 'O', 'Ờ': 'O', 'Ớ': 'O', 'Ợ': 'O', 'Ở': 'O', 'Ỡ': 'O',
    'Ù': 'U', 'Ú': 'U', 'Ụ': 'U', 'Ủ': 'U', 'Ũ': 'U',
    'Ư': 'U', 'Ừ': 'U', 'Ứ': 'U', 'Ự': 'U', 'Ử': 'U', 'Ữ': 'U',
    'Ỳ': 'Y', 'Ý': 'Y', 'Ỵ': 'Y', 'Ỷ': 'Y', 'Ỹ': 'Y',
    'Đ': 'D',
  };

  return text
    .split('')
    .map((char) => vietnameseMap[char] || char)
    .join('');
}

// MultiSelectCombobox Component
function MultiSelectCombobox({
  options,
  selectedIds,
  onSelectionChange,
  placeholder = "Tìm kiếm và chọn dịch vụ...",
  displayValue = (item: Service) => `${item.name} - ${item.serviceCode}`,
  loading = false,
}: {
  options: Service[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  placeholder?: string
  displayValue?: (item: Service) => string
  loading?: boolean
}) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isOpen, setIsOpen] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Filter options: exclude already selected and filter by search query (with Vietnamese normalization)
  const availableOptions = React.useMemo(() => {
    if (searchQuery.trim() === "") {
      return options.filter((option) => !selectedIds.includes(option.id));
    }

    const normalizedQuery = normalizeVietnameseText(searchQuery.toLowerCase());
    
    return options.filter(
      (option) => {
        if (selectedIds.includes(option.id)) return false;
        
        const normalizedName = normalizeVietnameseText(option.name.toLowerCase());
        const normalizedServiceCode = option.serviceCode 
          ? normalizeVietnameseText(option.serviceCode.toLowerCase())
          : '';
        const originalName = option.name.toLowerCase();
        const originalServiceCode = option.serviceCode?.toLowerCase() || '';
        const queryLower = searchQuery.toLowerCase();
        
        return (
          normalizedName.includes(normalizedQuery) ||
          normalizedServiceCode.includes(normalizedQuery) ||
          originalName.includes(queryLower) ||
          originalServiceCode.includes(queryLower)
        );
      }
    );
  }, [options, selectedIds, searchQuery])

  const selectedItems = React.useMemo(() => {
    return options.filter((opt) => selectedIds.includes(opt.id))
  }, [options, selectedIds])

  const handleToggle = (serviceId: string) => {
    if (selectedIds.includes(serviceId)) {
      onSelectionChange(selectedIds.filter((id) => id !== serviceId))
    } else {
      onSelectionChange([...selectedIds, serviceId])
    }
    setSearchQuery("")
  }

  const handleRemove = (serviceId: string) => {
    onSelectionChange(selectedIds.filter((id) => id !== serviceId))
  }

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Selected items display */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 border rounded-lg bg-muted/50">
          {selectedItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-1 px-2 py-1 bg-background border rounded-md text-sm"
            >
              <span>{displayValue(item)}</span>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="ml-1 hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input with dropdown */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => setIsOpen(true)}
            className="pl-8"
          />
        </div>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="size-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Đang tải...</span>
              </div>
            ) : availableOptions.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                {searchQuery.trim() ? "Không tìm thấy dịch vụ nào" : "Không còn dịch vụ nào để chọn"}
              </div>
            ) : (
              <div className="p-1">
                {availableOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleToggle(option.id)}
                    className="w-full text-left px-3 py-2 hover:bg-muted rounded-md text-sm transition-colors"
                  >
                    {displayValue(option)}
                    {option.price && (
                      <span className="ml-2 text-muted-foreground">
                        ({option.price.toLocaleString()} VND)
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

type ServiceSummary = {
  id: string
  serviceCode?: string | null
  name: string
}

type ServicePromotion = {
  id?: string
  serviceId: string
  service?: {
    id: string
    serviceCode?: string
    name?: string
  }
  name: string
  description?: string | null
  allowLoyaltyDiscount: boolean
  maxDiscountPercent?: number | null
  maxDiscountAmount?: number | null
  isActive: boolean
  startDate?: string | null
  endDate?: string | null
  createdAt?: string
  updatedAt?: string
}

type PromotionListMeta = {
  total?: number
  limit?: number
  offset?: number
}

type PromotionListNestedData = {
  data?: ServicePromotion[]
  items?: ServicePromotion[]
  promotions?: ServicePromotion[]
  meta?: PromotionListMeta
  pagination?: PromotionListMeta & { totalPages?: number; hasMore?: boolean }
}

type PromotionListApiResponse = {
  data: ServicePromotion[] | PromotionListNestedData
  meta?: PromotionListMeta
}

type PromotionFormState = {
  serviceId: string
  name: string
  description: string
  allowLoyaltyDiscount: boolean
  maxDiscountPercent: string
  maxDiscountAmount: string
  isActive: boolean
  startDate: string
  endDate: string
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api"

const currencyFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
})

const createEmptyPromotionForm = (): PromotionFormState => ({
  serviceId: "",
  name: "",
  description: "",
  allowLoyaltyDiscount: true,
  maxDiscountPercent: "",
  maxDiscountAmount: "",
  isActive: true,
  startDate: "",
  endDate: "",
})

const toDateTimeLocal = (value?: string | null): string => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 16)
}

const toIsoString = (value: string): string | undefined => {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return undefined
  return date.toISOString()
}

const formatDateRange = (start?: string | null, end?: string | null) => {
  if (!start && !end) return "Không giới hạn"
  const startLabel = start ? new Date(start).toLocaleDateString("vi-VN") : "Không giới hạn"
  const endLabel = end ? new Date(end).toLocaleDateString("vi-VN") : "Không giới hạn"
  return `${startLabel} → ${endLabel}`
}

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return "—"
  return currencyFormatter.format(value)
}

const extractPromotionList = (payload: PromotionListApiResponse): { items: ServicePromotion[]; meta?: PromotionListMeta } => {
  if (Array.isArray(payload?.data)) {
    return { items: payload.data, meta: payload.meta }
  }

  const nested = payload?.data ?? {}
  const nestedItems = Array.isArray(nested.data)
    ? nested.data
    : Array.isArray(nested.items)
      ? nested.items
      : Array.isArray(nested.promotions)
        ? nested.promotions
        : []
  const meta = payload.meta ?? nested.meta ?? nested.pagination

  return { items: nestedItems, meta }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  })
  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await response.json()
      message = body?.message || JSON.stringify(body)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_) {
      // ignore parse error
    }
    throw new Error(message)
  }
  return response.json()
}

function usePaginatedList<T>(fetcher: (page: number, limit: number) => Promise<ListResponse<T>>) {
  const [page, setPage] = React.useState(1)
  const [limit] = React.useState(10)
  const [data, setData] = React.useState<T[]>([])
  const [meta, setMeta] = React.useState<{ page: number; limit: number; total: number; totalPages: number }>({ page: 1, limit: 10, total: 0, totalPages: 0 })
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const reload = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetcher(page, limit)
      setData(Array.isArray(res.data) ? res.data : [])
      setMeta(res.meta || { page: 1, limit: 10, total: 0, totalPages: 0 })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      setError(msg)
      setData([]) // Reset data on error
    } finally {
      setLoading(false)
    }
  }, [fetcher, page, limit])

  React.useEffect(() => {
    void reload()
  }, [reload])

  return { data, meta, loading, error, page, setPage, limit, reload }
}

function PaginationControls({ page, totalPages, onPrev, onNext }: { page: number; totalPages: number; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-sm text-muted-foreground">Trang {page}/{totalPages || 1}</div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={page <= 1}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={totalPages ? page >= totalPages : true}>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

export default function FacilitiesPage() {
  const [tab, setTab] = React.useState("specialties")
  return (
    <div className="min-h-screen bg-white">
      <div className="flex flex-col gap-6 px-8 py-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Quản lý cơ sở khám chữa bệnh</h2>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList>
            <TabsTrigger className="flex items-center min-w-40 gap-2 rounded-md transition
            data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground
            data-[state=inactive]:text-muted-foreground" value="specialties"><Brain className="size-4" />Khoa chuyên môn</TabsTrigger>
            <TabsTrigger className="flex items-center min-w-40 gap-2 rounded-md transition
            data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground
            data-[state=inactive]:text-muted-foreground" value="rooms"><Building className="size-4" />Phòng chức năng</TabsTrigger>
            <TabsTrigger className="flex items-center min-w-40 gap-2 rounded-md transition
            data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground
            data-[state=inactive]:text-muted-foreground" value="booths"><Stethoscope className="size-4" />Buồng khám</TabsTrigger>
            <TabsTrigger className="flex items-center min-w-40 gap-2 rounded-md transition
            data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground
            data-[state=inactive]:text-muted-foreground" value="promotions"><TicketPercent className="size-4" />Khuyến mãi</TabsTrigger>
            <TabsTrigger className="flex items-center min-w-40 gap-2 rounded-md transition
            data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground
            data-[state=inactive]:text-muted-foreground" value="templates"><ScrollText className="size-4" />Mẫu bệnh án</TabsTrigger>
          </TabsList>

          <TabsContent value="specialties" className="mt-4">
            <SpecialtiesTab />
          </TabsContent>
          <TabsContent value="rooms" className="mt-4">
            <ClinicRoomsTab />
          </TabsContent>
          <TabsContent value="booths" className="mt-4">
            <BoothsTab />
          </TabsContent>
          <TabsContent value="promotions" className="mt-4">
            <PromotionsTab />
          </TabsContent>
          <TabsContent value="templates" className="mt-4">
            <TemplatesTab />
          </TabsContent>
        </Tabs>
        <Toaster richColors position="top-right" />
      </div>
    </div>
  )
}

function SpecialtiesTab() {
  const fetcher = React.useCallback(async (page: number, limit: number) => {
    return specialtiesService.listSpecialties(page, limit)
  }, [])
  const { data, meta, loading, error, page, setPage, reload } = usePaginatedList<Specialty>(fetcher)

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Specialty | null>(null)
  const [form, setForm] = React.useState<{ specialtyCode: string; name: string }>({ specialtyCode: "", name: "" })
  const [submitting, setSubmitting] = React.useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm({ specialtyCode: "", name: "" })
    setOpen(true)
  }
  const openEdit = (s: Specialty) => {
    setEditing(s)
    setForm({ specialtyCode: s.specialtyCode, name: s.name })
    setOpen(true)
  }

  const onSubmit = async () => {
    setSubmitting(true)
    try {
      if (editing) {
        await specialtiesService.updateSpecialty(editing.id, form)
        toast.success("Cập nhật khoa thành công")
      } else {
        await specialtiesService.createSpecialty(form)
        toast.success("Tạo khoa thành công")
      }
      setOpen(false)
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (s: Specialty) => {
    if (!confirm(`Xóa khoa "${s.name}"?`)) return
    try {
      await specialtiesService.deleteSpecialty(s.id)
      toast.success("Xóa khoa thành công")
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    }
  }

  return (
    <div className="flex flex-col gap-3 ">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => reload()} disabled={loading}>
            <RefreshCw className="size-4" /> Làm mới
          </Button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="size-4" /> Thêm khoa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Cập nhật khoa" : "Thêm khoa"}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="grid gap-2">
                <Label htmlFor="specialtyCode">Mã khoa</Label>
                <Input id="specialtyCode" value={form.specialtyCode} onChange={(e) => setForm((f) => ({ ...f, specialtyCode: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Tên khoa</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Hủy</Button>
              <Button onClick={onSubmit} disabled={submitting}>
                {submitting && <Loader2 className="size-4 animate-spin" />} Lưu
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="text-destructive">{error}</div>}

      <Table className="rounded-lg ">
        <TableHeader>
          <TableRow className="bg-muted px-8">
            <TableHead className="px-4">Mã khoa</TableHead>
            <TableHead className="px-4">Tên khoa</TableHead>
            <TableHead className="px-4">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data && data.length > 0 ? (
            data.map((s) => (
              <TableRow key={s.id} className="px-4">
                <TableCell className="px-4">{s.specialtyCode}</TableCell>
                <TableCell className="px-4">{s.name}</TableCell>
                <TableCell className="flex gap-2 px-4">
                  <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="outline"  className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300" size="sm" onClick={() => onDelete(s)}>
                    <Trash2 className="size-4"  color="red"/>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : !loading ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                Không có dữ liệu
              </TableCell>
            </TableRow>
          ) : null}
          {loading && (
            <TableRow>
              <TableCell colSpan={3}>
                <div className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Đang tải...</div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <PaginationControls page={meta.page} totalPages={meta.totalPages} onPrev={() => setPage(Math.max(1, page - 1))} onNext={() => setPage(Math.min(meta.totalPages || 1, page + 1))} />
    </div>
  )
}

function ClinicRoomsTab() {
  const [specialtyFilter, setSpecialtyFilter] = React.useState<string | undefined>(undefined)
  const fetcher = React.useCallback(async (page: number, limit: number) => {
    return clinicRoomsService.listClinicRooms(page, limit, specialtyFilter)
  }, [specialtyFilter])
  const { data, meta, loading, error, page, setPage, reload } = usePaginatedList<ClinicRoom>(fetcher)

  const [specialties, setSpecialties] = React.useState<Specialty[]>([])
  const [services, setServices] = React.useState<Service[]>([])
  const [loadingServices, setLoadingServices] = React.useState(false)

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await specialtiesService.listSpecialties(1)
        setSpecialties(Array.isArray(res.data) ? res.data : [])
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Không tải được danh sách khoa")
        setSpecialties([]) // Reset to empty array on error
      }
    })()
  }, [])

  React.useEffect(() => {
    void (async () => {
      setLoadingServices(true)
      try {
        // Không truyền limit để lấy tất cả dịch vụ
        const res = await servicesService.listServices({ isActive: "true" })
        setServices(res.data.services || [])
      } catch (e) {
        console.error("Failed to load services", e)
      } finally {
        setLoadingServices(false)
      }
    })()
  }, [])

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ClinicRoom | null>(null)
  const [form, setForm] = React.useState<{ 
    roomName: string
    specialtyId: string
    description?: string
    address?: string
    booths?: Array<{
      id?: string
      name: string
      description?: string
      isActive: boolean
      serviceIds: string[]
    }>
  }>({ roomName: "", specialtyId: "", booths: [] })
  const [submitting, setSubmitting] = React.useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm({ roomName: "", specialtyId: "", booths: [] })
    setOpen(true)
  }
  const openEdit = async (r: ClinicRoom) => {
    setEditing(r)
    try {
      const roomDetail = await clinicRoomsService.getClinicRoom(r.id)
      setForm({ 
        roomName: roomDetail.roomName, 
        specialtyId: roomDetail.specialtyId, 
        description: roomDetail.description ?? undefined, 
        address: roomDetail.address ?? undefined,
        booths: roomDetail.booths?.map(b => ({
          id: b.id,
          name: b.name,
          description: b.description ?? undefined,
          isActive: b.isActive,
          serviceIds: b.services?.map(s => s.id) || []
        })) || []
      })
      setOpen(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được thông tin phòng")
    }
  }

  const addBooth = () => {
    setForm(f => ({
      ...f,
      booths: [...(f.booths || []), { name: "", isActive: true, serviceIds: [] }]
    }))
  }

  const removeBooth = (index: number) => {
    setForm(f => ({
      ...f,
      booths: f.booths?.filter((_, i) => i !== index) || []
    }))
  }

  const updateBooth = (index: number, updates: Partial<{ name: string; description?: string; isActive: boolean; serviceIds: string[] }>) => {
    setForm(f => ({
      ...f,
      booths: f.booths?.map((b, i) => i === index ? { ...b, ...updates } : b) || []
    }))
  }

  // Removed unused function: toggleBoothService

  const onSubmit = async () => {
    if (!form.roomName || !form.specialtyId) {
      toast.error("Vui lòng nhập đầy đủ thông tin")
      return
    }
    setSubmitting(true)
    try {
      if (editing) {
        const updatePayload: UpdateClinicRoomDto = {
        roomName: form.roomName,
        specialtyId: form.specialtyId,
        description: form.description,
        address: form.address,
      }
      if (form.booths && form.booths.length > 0) {
          updatePayload.booths = form.booths.map(b => ({
          ...(b.id && { id: b.id }),
          name: b.name,
          description: b.description,
          isActive: b.isActive,
          serviceIds: b.serviceIds
        }))
      }
        await clinicRoomsService.updateClinicRoom(editing.id, updatePayload)
        toast.success("Cập nhật phòng thành công")
      } else {
        const createPayload: CreateClinicRoomDto = {
          roomName: form.roomName,
          specialtyId: form.specialtyId,
          description: form.description,
          address: form.address,
        }
        if (form.booths && form.booths.length > 0) {
          createPayload.booths = form.booths.map(b => ({
            name: b.name,
            description: b.description,
            isActive: b.isActive,
            serviceIds: b.serviceIds
          }))
        }
        await clinicRoomsService.createClinicRoom(createPayload)
        toast.success("Tạo phòng thành công")
      }
      setOpen(false)
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (r: ClinicRoom) => {
    if (!confirm(`Xóa phòng "${r.roomName}"?`)) return
    try {
      await clinicRoomsService.deleteClinicRoom(r.id)
      toast.success("Xóa phòng thành công")
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={specialtyFilter} onValueChange={(v) => { setSpecialtyFilter(v || undefined); }}>
            <SelectTrigger className="min-w-56"><SelectValue placeholder="Lọc theo khoa" /></SelectTrigger>
            <SelectContent>
              {specialties && specialties.length > 0 ? (
                specialties.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{`${s.name} (${s.specialtyCode})`}</SelectItem>
                ))
              ) : (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">Không có khoa nào</div>
              )}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { setSpecialtyFilter(undefined); void reload() }} disabled={loading}>Bỏ lọc</Button>
          <Button variant="outline" onClick={() => reload()} disabled={loading}><RefreshCw className="size-4" /> Làm mới</Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="size-4" /> Thêm phòng</Button>
          </DialogTrigger>
          <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Cập nhật phòng" : "Thêm phòng"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              {/* Cột trái: Thông tin phòng */}
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="roomName">Tên phòng *</Label>
                  <Input id="roomName" value={form.roomName} onChange={(e) => setForm((f) => ({ ...f, roomName: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Khoa *</Label>
                  <Select value={form.specialtyId} onValueChange={(v) => setForm((f) => ({ ...f, specialtyId: v }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Chọn khoa" /></SelectTrigger>
                    <SelectContent>
                      {specialties && specialties.length > 0 ? (
                        specialties.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{`${s.name} (${s.specialtyCode})`}</SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">Không có khoa nào</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Input id="description" value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input id="address" value={form.address ?? ""} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
                </div>
              </div>

              {/* Cột phải: Danh sách buồng khám */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Label>Danh sách buồng khám</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addBooth}>
                    <Plus className="size-4" /> Thêm buồng
                  </Button>
                </div>
                {form.booths && form.booths.length > 0 ? (
                  <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
                    {form.booths.map((booth, boothIndex) => (
                      <div key={boothIndex} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Buồng {boothIndex + 1}</Label>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeBooth(boothIndex)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid gap-2">
                          <Label>Tên buồng *</Label>
                          <Input 
                            value={booth.name} 
                            onChange={(e) => updateBooth(boothIndex, { name: e.target.value })} 
                            placeholder="Nhập tên buồng"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Mô tả</Label>
                          <Input 
                            value={booth.description ?? ""} 
                            onChange={(e) => updateBooth(boothIndex, { description: e.target.value })} 
                            placeholder="Nhập mô tả"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox 
                            checked={booth.isActive} 
                            onCheckedChange={(checked) => updateBooth(boothIndex, { isActive: checked === true })} 
                          />
                          <Label className="text-sm">Đang hoạt động</Label>
                        </div>
                        <div className="grid gap-2">
                          <Label>Dịch vụ</Label>
                          {loadingServices ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="size-4 animate-spin" /> Đang tải...
                            </div>
                          ) : (
                            <MultiSelectCombobox
                              options={services}
                              selectedIds={booth.serviceIds || []}
                              onSelectionChange={(ids) => updateBooth(boothIndex, { serviceIds: ids })}
                              placeholder="Tìm kiếm và chọn dịch vụ..."
                              loading={loadingServices}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
                    Chưa có buồng nào. Nhấn &quot;Thêm buồng&quot; để thêm buồng khám.
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Hủy</Button>
              <Button onClick={onSubmit} disabled={submitting}>{submitting && <Loader2 className="size-4 animate-spin" />} Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="text-destructive">{error}</div>}

      <Table className="rounded-lg ">
        <TableHeader>
          <TableRow className="bg-muted px-8">
            <TableHead className="px-4">Mã phòng</TableHead>
            <TableHead className="px-4">Tên phòng</TableHead>
            <TableHead className="px-4">Khoa</TableHead>
            <TableHead className="px-4">Mô tả</TableHead>
            <TableHead className="px-4">Địa chỉ</TableHead>
            <TableHead className="px-4">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data && data.length > 0 ? (
            data.map((r) => (
              <TableRow key={r.id} className="px-4">
                <TableCell className="px-4">{r.roomCode}</TableCell>
                <TableCell className="px-4">{r.roomName}</TableCell>
                <TableCell className="px-4">{r.specialty ? `${r.specialty.name} (${r.specialty.specialtyCode})` : ""}</TableCell>
                <TableCell className="px-4">{r.description}</TableCell>
                <TableCell className="px-4">{r.address}</TableCell>
                <TableCell className="flex gap-2 px-4">
                  <Button variant="outline" size="sm" onClick={() => openEdit(r)}><Pencil className="size-4" /></Button>
                  <Button variant="outline"  className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300" size="sm" onClick={() => onDelete(r)}><Trash2 className="size-4"  color="red"/></Button>
                </TableCell>
              </TableRow>
            ))
          ) : !loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Không có dữ liệu
              </TableCell>
            </TableRow>
          ) : null}
          {loading && (
            <TableRow>
              <TableCell colSpan={6}><div className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Đang tải...</div></TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <PaginationControls page={meta.page} totalPages={meta.totalPages} onPrev={() => setPage(Math.max(1, page - 1))} onNext={() => setPage(Math.min(meta.totalPages || 1, page + 1))} />
    </div>
  )
}

function BoothsTab() {
  const [roomFilter, setRoomFilter] = React.useState<string | undefined>(undefined)
  const [activeFilter, setActiveFilter] = React.useState<string | undefined>(undefined)

  const fetcher = React.useCallback(async (page: number, limit: number) => {
    return boothsService.listBooths(page, limit, roomFilter, activeFilter ? activeFilter === "true" : undefined)
  }, [roomFilter, activeFilter])
  const { data, meta, loading, error, page, setPage, reload } = usePaginatedList<Booth>(fetcher)

  const [rooms, setRooms] = React.useState<ClinicRoom[]>([])
  const [services, setServices] = React.useState<Service[]>([])
  const [loadingServices, setLoadingServices] = React.useState(false)

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await clinicRoomsService.listClinicRooms(1)
        setRooms(res.data)
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Không tải được danh sách phòng")
      }
    })()
  }, [])

  React.useEffect(() => {
    void (async () => {
      setLoadingServices(true)
      try {
        // Không truyền limit để lấy tất cả dịch vụ
        const res = await servicesService.listServices({ isActive: "true" })
        setServices(res.data.services || [])
      } catch (e) {
        console.error("Failed to load services", e)
      } finally {
        setLoadingServices(false)
      }
    })()
  }, [])

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Booth | null>(null)
  const [form, setForm] = React.useState<{ 
    name: string
    roomId: string
    description?: string
    isActive: boolean
    serviceIds: string[]
  }>({ name: "", roomId: "", isActive: true, serviceIds: [] })
  const [submitting, setSubmitting] = React.useState(false)

  // State cho dialog quản lý dịch vụ
  const [servicesDialogOpen, setServicesDialogOpen] = React.useState(false)
  const [managingBooth, setManagingBooth] = React.useState<Booth | null>(null)
  const [boothServiceIds, setBoothServiceIds] = React.useState<string[]>([])
  const [loadingBoothServices, setLoadingBoothServices] = React.useState(false)
  const [savingBoothServices, setSavingBoothServices] = React.useState(false)

  const openCreate = () => {
    setEditing(null)
    setForm({ name: "", roomId: "", description: "", isActive: true, serviceIds: [] })
    setOpen(true)
  }
  const openEdit = async (b: Booth) => {
    setEditing(b)
    try {
      const boothDetail = await boothsService.getBooth(b.id)
      const boothServices = await boothsService.getBoothServices(b.id)
      setForm({ 
        name: boothDetail.name, 
        roomId: boothDetail.roomId, 
        description: boothDetail.description ?? undefined, 
        isActive: boothDetail.isActive,
        serviceIds: boothServices.services.map(s => s.id)
      })
      setOpen(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được thông tin buồng")
    }
  }


  const onSubmit = async () => {
    if (!form.name || !form.roomId) {
      toast.error("Vui lòng nhập đầy đủ thông tin")
      return
    }
    setSubmitting(true)
    try {
      if (editing) {
        const updatePayload: UpdateBoothDto = {
        name: form.name,
        roomId: form.roomId,
        description: form.description,
        isActive: form.isActive,
        serviceIds: form.serviceIds
      }
        await boothsService.updateBooth(editing.id, updatePayload)
        toast.success("Cập nhật buồng thành công")
      } else {
        const createPayload: CreateBoothDto = {
          name: form.name,
          roomId: form.roomId,
          description: form.description,
          isActive: form.isActive,
          serviceIds: form.serviceIds
        }
        await boothsService.createBooth(createPayload)
        toast.success("Tạo buồng thành công")
      }
      setOpen(false)
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (b: Booth) => {
    if (!confirm(`Xóa buồng "${b.name}"?`)) return
    try {
      await boothsService.deleteBooth(b.id)
      toast.success("Xóa buồng thành công")
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    }
  }

  const openServicesDialog = async (b: Booth) => {
    setManagingBooth(b)
    setLoadingBoothServices(true)
    setBoothServiceIds([])
    setServicesDialogOpen(true)
    try {
      const boothServices = await boothsService.getBoothServices(b.id)
      setBoothServiceIds(boothServices.services.map(s => s.id))
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được danh sách dịch vụ")
    } finally {
      setLoadingBoothServices(false)
    }
  }

  const onSaveBoothServices = async () => {
    if (!managingBooth) return
    setSavingBoothServices(true)
    try {
      await boothsService.updateBoothServices(managingBooth.id, { serviceIds: boothServiceIds })
      toast.success("Cập nhật dịch vụ thành công")
      setServicesDialogOpen(false)
      await reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    } finally {
      setSavingBoothServices(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Select value={roomFilter} onValueChange={(v) => { setRoomFilter(v || undefined) }}>
            <SelectTrigger className="min-w-56"><SelectValue placeholder="Lọc theo phòng" /></SelectTrigger>
            <SelectContent>
              {rooms.map((r) => (
                <SelectItem key={r.id} value={r.id}>{`${r.roomName} (${r.roomCode})`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={activeFilter} onValueChange={(v) => { setActiveFilter(v || undefined) }}>
            <SelectTrigger className="min-w-40"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Đang hoạt động</SelectItem>
              <SelectItem value="false">Ngừng hoạt động</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { setRoomFilter(undefined); setActiveFilter(undefined); void reload() }} disabled={loading}>Bỏ lọc</Button>
          <Button variant="outline" onClick={() => reload()} disabled={loading}><RefreshCw className="size-4" /> Làm mới</Button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="size-4" /> Thêm buồng</Button>
          </DialogTrigger>
          <DialogContent className="w-[70vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Cập nhật buồng" : "Thêm buồng"}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4">
              <div className="grid gap-2">
                <Label htmlFor="boothName">Tên buồng *</Label>
                <Input id="boothName" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Phòng *</Label>
                <Select value={form.roomId} onValueChange={(v) => setForm((f) => ({ ...f, roomId: v }))}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Chọn phòng" /></SelectTrigger>
                  <SelectContent>
                    {rooms.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{`${r.roomName} (${r.roomCode})`}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="boothDesc">Mô tả</Label>
                <Input id="boothDesc" value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Trạng thái</Label>
                <Select value={String(form.isActive ?? true)} onValueChange={(v) => setForm((f) => ({ ...f, isActive: v === "true" }))}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Đang hoạt động</SelectItem>
                    <SelectItem value="false">Ngừng hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 border-t pt-4">
                <Label>Dịch vụ</Label>
                {loadingServices ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Đang tải...
                  </div>
                ) : (
                  <MultiSelectCombobox
                    options={services}
                    selectedIds={form.serviceIds}
                    onSelectionChange={(ids) => setForm((f) => ({ ...f, serviceIds: ids }))}
                    placeholder="Tìm kiếm và chọn dịch vụ..."
                    loading={loadingServices}
                  />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Hủy</Button>
              <Button onClick={onSubmit} disabled={submitting}>{submitting && <Loader2 className="size-4 animate-spin" />} Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && <div className="text-destructive">{error}</div>}

      <Table className="rounded-lg ">
        <TableHeader>
          <TableRow className="bg-muted px-8">
            <TableHead className="px-4">Mã buồng</TableHead>
            <TableHead className="px-4">Tên buồng</TableHead>
            <TableHead className="px-4">Phòng</TableHead>
            <TableHead className="px-4">Mô tả</TableHead>
            <TableHead className="px-4">Trạng thái</TableHead>
            <TableHead className="px-4">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data && data.length > 0 ? (
            data.map((b) => (
              <TableRow key={b.id} className="px-4">
                <TableCell className="px-4">{b.boothCode}</TableCell>
                <TableCell className="px-4">{b.name}</TableCell>
                <TableCell className="px-4">{b.room ? `${b.room.roomName} (${b.room.roomCode})` : ""}</TableCell>
                <TableCell className="px-4">{b.description}</TableCell>
                <TableCell className="px-4">{b.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}</TableCell>
                <TableCell className="flex gap-2 px-4">
                  <Button variant="outline" size="sm" onClick={() => openEdit(b)}><Pencil className="size-4" /></Button>
                  <Button variant="outline" size="sm" onClick={() => openServicesDialog(b)}><Settings className="size-4" /> Dịch vụ</Button>
                  <Button variant="outline"  className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300" size="sm" onClick={() => onDelete(b)}><Trash2 className="size-4"  color="red"/></Button>
                </TableCell>
              </TableRow>
            ))
          ) : !loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground">
                Không có dữ liệu
              </TableCell>
            </TableRow>
          ) : null}
          {loading && (
            <TableRow>
              <TableCell colSpan={6}><div className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Đang tải...</div></TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <PaginationControls page={meta.page} totalPages={meta.totalPages} onPrev={() => setPage(Math.max(1, page - 1))} onNext={() => setPage(Math.min(meta.totalPages || 1, page + 1))} />

      {/* Dialog quản lý dịch vụ */}
      <Dialog open={servicesDialogOpen} onOpenChange={setServicesDialogOpen} >
        <DialogContent className="w-[50vw] min-h-[50vh] flex flex-col justify-between">
          <DialogHeader>
            <DialogTitle>
              Quản lý dịch vụ - {managingBooth?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col pt-2 px-2 gap-4 flex-1 overflow-y-auto">
            {loadingBoothServices ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="size-6 animate-spin" />
                <span className="ml-2">Đang tải danh sách dịch vụ...</span>
              </div>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label>Chọn dịch vụ cho buồng</Label>
                  <MultiSelectCombobox
                    options={services}
                    selectedIds={boothServiceIds}
                    onSelectionChange={setBoothServiceIds}
                    placeholder="Tìm kiếm và chọn dịch vụ..."
                    loading={loadingServices}
                  />
                </div>
                {boothServiceIds.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    Đã chọn {boothServiceIds.length} dịch vụ
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setServicesDialogOpen(false)} disabled={savingBoothServices}>
              Hủy
            </Button>
            <Button onClick={onSaveBoothServices} disabled={savingBoothServices || loadingBoothServices}>
              {savingBoothServices && <Loader2 className="size-4 animate-spin mr-2" />}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PromotionsTab() {
  const [limit] = React.useState(10)
  const [page, setPage] = React.useState(1)
  const [promotions, setPromotions] = React.useState<ServicePromotion[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [searchInput, setSearchInput] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "true" | "false">("all")
  const [loyaltyFilter, setLoyaltyFilter] = React.useState<"all" | "true" | "false">("all")
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ServicePromotion | null>(null)
  const [form, setForm] = React.useState<PromotionFormState>(() => createEmptyPromotionForm())
  const [submitting, setSubmitting] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [selectedService, setSelectedService] = React.useState<ServiceSummary | null>(null)
  const [serviceSearchTerm, setServiceSearchTerm] = React.useState("")
  const [serviceSearchResults, setServiceSearchResults] = React.useState<ServiceSummary[]>([])
  const [serviceSearchLoading, setServiceSearchLoading] = React.useState(false)
  const [serviceSearchError, setServiceSearchError] = React.useState<string | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false)
  const [viewingPromotion, setViewingPromotion] = React.useState<ServicePromotion | null>(null)

  const totalPages = React.useMemo(() => {
    if (total === 0) return 1
    return Math.max(1, Math.ceil(total / limit))
  }, [limit, total])

  const loadPromotions = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String((page - 1) * limit),
      })
      if (search) params.set("search", search)
      if (statusFilter !== "all") params.set("isActive", statusFilter)
      if (loyaltyFilter !== "all") params.set("allowLoyaltyDiscount", loyaltyFilter)

      const res = await apiFetch<PromotionListApiResponse>(`/services/management/promotions?${params.toString()}`)
      const { items, meta } = extractPromotionList(res)
      setPromotions(items)
      const totalItems = meta?.total ?? items.length
      setTotal(totalItems)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không tải được danh sách khuyến mãi")
    } finally {
      setLoading(false)
    }
  }, [limit, loyaltyFilter, page, search, statusFilter])

  React.useEffect(() => {
    void loadPromotions()
  }, [loadPromotions])

  React.useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  const handleApplySearch = () => {
    setPage(1)
    setSearch(searchInput.trim())
  }

  const handleResetFilters = () => {
    setSearchInput("")
    setSearch("")
    setStatusFilter("all")
    setLoyaltyFilter("all")
    setPage(1)
  }

  React.useEffect(() => {
    if (!dialogOpen) return
    const keyword = serviceSearchTerm.trim()
    if (!keyword) {
      setServiceSearchResults([])
      setServiceSearchError(null)
      setServiceSearchLoading(false)
      return
    }

    let cancelled = false
    setServiceSearchLoading(true)
    setServiceSearchError(null)

    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await serviceSearchApi.searchServices(keyword, 20)
        if (cancelled) return
        const services = response.data?.services ?? []
        setServiceSearchResults(
          services.map((service) => ({
            id: service.id,
            name: service.name,
            serviceCode: (service as Service).serviceCode,
          })),
        )
        if (services.length === 0) {
          setServiceSearchError("Không tìm thấy dịch vụ phù hợp")
        }
      } catch (error) {
        if (cancelled) return
        const message = error instanceof Error ? error.message : "Không thể tìm kiếm dịch vụ"
        setServiceSearchError(message)
        setServiceSearchResults([])
      } finally {
        if (!cancelled) {
          setServiceSearchLoading(false)
        }
      }
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [dialogOpen, serviceSearchTerm])

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditing(null)
      setForm(createEmptyPromotionForm())
      setSelectedService(null)
      setServiceSearchTerm("")
      setServiceSearchError(null)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setSelectedService(null)
    setServiceSearchTerm("")
    setServiceSearchError(null)
    setForm(createEmptyPromotionForm())
    setDialogOpen(true)
  }

  const openEdit = (promotion: ServicePromotion) => {
    setEditing(promotion)
    setForm({
      serviceId: promotion.serviceId,
      name: promotion.name,
      description: promotion.description ?? "",
      allowLoyaltyDiscount: promotion.allowLoyaltyDiscount,
      maxDiscountPercent: promotion.maxDiscountPercent?.toString() ?? "",
      maxDiscountAmount: promotion.maxDiscountAmount?.toString() ?? "",
      isActive: promotion.isActive,
      startDate: toDateTimeLocal(promotion.startDate),
      endDate: toDateTimeLocal(promotion.endDate),
    })
    const serviceMeta = promotion.service
      ? {
          id: promotion.service.id,
          name: promotion.service.name ?? "",
          serviceCode: promotion.service.serviceCode ?? null,
        }
      : {
          id: promotion.serviceId,
          name: promotion.name,
          serviceCode: null,
        }
    setSelectedService(serviceMeta)
    setServiceSearchTerm(serviceMeta.name)
    setServiceSearchError(null)
    setDialogOpen(true)
  }

  const handleSelectService = (service: ServiceSummary) => {
    setSelectedService(service)
    setForm((prev) => ({
      ...prev,
      serviceId: service.id,
    }))
    setServiceSearchTerm(service.name)
  }

  const clearSelectedService = () => {
    setSelectedService(null)
    setForm((prev) => ({
      ...prev,
      serviceId: "",
    }))
    setServiceSearchTerm("")
  }

  const handleSubmit = async () => {
    if (!form.serviceId) {
      toast.error("Vui lòng chọn dịch vụ áp dụng")
      return
    }
    if (!form.name.trim()) {
      toast.error("Vui lòng nhập tên chương trình")
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        allowLoyaltyDiscount: form.allowLoyaltyDiscount,
        maxDiscountPercent: form.maxDiscountPercent ? Number(form.maxDiscountPercent) : null,
        maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : null,
        isActive: form.isActive,
        startDate: toIsoString(form.startDate),
        endDate: toIsoString(form.endDate),
      }

      await apiFetch(`/services/management/services/${form.serviceId}/promotion`, {
        method: "POST",
        body: JSON.stringify(payload),
      })

      toast.success(editing ? "Cập nhật khuyến mãi thành công" : "Tạo khuyến mãi thành công")
      handleDialogOpenChange(false)
      await loadPromotions()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể lưu khuyến mãi")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (promotion: ServicePromotion) => {
    if (!confirm(`Xóa chương trình khuyến mãi cho dịch vụ "${promotion.service?.name ?? promotion.serviceId}"?`)) {
      return
    }
    setDeletingId(promotion.serviceId)
    try {
      await apiFetch(`/services/management/services/${promotion.serviceId}/promotion`, {
        method: "DELETE",
      })
      toast.success("Xóa khuyến mãi thành công")
      await loadPromotions()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thể xóa khuyến mãi")
    } finally {
      setDeletingId(null)
    }
  }

  const openDetailDialog = (promotion: ServicePromotion) => {
    setViewingPromotion(promotion)
    setDetailDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="min-w-64"
            placeholder="Tìm theo tên dịch vụ / chương trình"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                handleApplySearch()
              }
            }}
          />
          <Button variant="outline" onClick={handleApplySearch}>Tìm kiếm</Button>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value as "all" | "true" | "false")
              setPage(1)
            }}
          >
            <SelectTrigger className="min-w-40">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="true">Đang hoạt động</SelectItem>
              <SelectItem value="false">Ngừng hoạt động</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={loyaltyFilter}
            onValueChange={(value) => {
              setLoyaltyFilter(value as "all" | "true" | "false")
              setPage(1)
            }}
          >
            <SelectTrigger className="min-w-40">
              <SelectValue placeholder="Loyalty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="true">Cho phép tích điểm</SelectItem>
              <SelectItem value="false">Không áp dụng loyalty</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleResetFilters}>Bỏ lọc</Button>
          <Button variant="outline" onClick={() => void loadPromotions()} disabled={loading}>
            <RefreshCw className="size-4" /> Làm mới
          </Button>
        </div>
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="size-4" /> Thêm khuyến mãi
            </Button>
          </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Cập nhật khuyến mãi" : "Thêm khuyến mãi"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="serviceSearch">Chọn dịch vụ áp dụng</Label>
              <Input
                id="serviceSearch"
                placeholder="Nhập tên hoặc mã dịch vụ"
                value={serviceSearchTerm}
                onChange={(event) => setServiceSearchTerm(event.target.value)}
              />
              {serviceSearchError && !serviceSearchLoading && serviceSearchTerm.trim() && (
                <p className="text-sm text-destructive">{serviceSearchError}</p>
              )}
                <div className="rounded border bg-background max-h-48 overflow-auto">
                {serviceSearchLoading && (
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" /> Đang tìm dịch vụ...
                  </div>
                )}
                {!serviceSearchLoading && serviceSearchResults.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition hover:bg-muted ${
                      selectedService?.id === service.id ? "bg-muted" : ""
                    }`}
                    onClick={() => handleSelectService(service)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-xs text-muted-foreground">{service.serviceCode ?? service.id}</span>
                    </div>
                    {selectedService?.id === service.id && (
                      <span className="text-xs text-emerald-600">Đang chọn</span>
                    )}
                  </button>
                ))}
                  {!serviceSearchLoading && serviceSearchResults.length === 0 && serviceSearchTerm.trim() && (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                      {serviceSearchError ?? "Không tìm thấy dịch vụ nào phù hợp"}
                  </div>
                )}
              </div>
              {selectedService ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded border bg-muted/50 p-3 text-sm">
                  <div>
                    <div className="font-medium">{selectedService.name}</div>
                    <div className="text-xs text-muted-foreground">{selectedService.serviceCode ?? selectedService.id}</div>
                  </div>
                  <Button variant="outline" size="sm" onClick={clearSelectedService}>
                    Bỏ chọn
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nhập từ khóa để tìm và chọn dịch vụ áp dụng khuyến mãi.
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="promotionName">Tên chương trình</Label>
              <Input
                id="promotionName"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="promotionDescription">Mô tả</Label>
              <Textarea
                id="promotionDescription"
                rows={3}
                value={form.description}
                onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="maxPercent">Giảm tối đa (%)</Label>
                <Input
                  id="maxPercent"
                  type="number"
                  min={0}
                  max={100}
                  value={form.maxDiscountPercent}
                  onChange={(event) => setForm((prev) => ({ ...prev, maxDiscountPercent: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="maxAmount">Giảm tối đa (VNĐ)</Label>
                <Input
                  id="maxAmount"
                  type="number"
                  min={0}
                  value={form.maxDiscountAmount}
                  onChange={(event) => setForm((prev) => ({ ...prev, maxDiscountAmount: event.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Ngày bắt đầu</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">Ngày kết thúc</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allowLoyalty"
                  checked={form.allowLoyaltyDiscount}
                  onCheckedChange={(checked) => setForm((prev) => ({ ...prev, allowLoyaltyDiscount: Boolean(checked) }))}
                />
                <Label htmlFor="allowLoyalty">Cho phép cộng/trừ ưu đãi loyalty</Label>
              </div>
              <div className="grid gap-2">
                <Label>Trạng thái</Label>
                <Select
                  value={form.isActive ? "true" : "false"}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, isActive: value === "true" }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Đang hoạt động</SelectItem>
                    <SelectItem value="false">Ngừng hoạt động</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleDialogOpenChange(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.serviceId}>
              {submitting && <Loader2 className="size-4 animate-spin" />} Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>
      </div>

      {error && <div className="text-destructive">{error}</div>}

      <Table className="rounded-lg">
        <TableHeader>
          <TableRow className="bg-muted px-8">
            <TableHead className="px-4">Dịch vụ</TableHead>
            <TableHead className="px-4">Chương trình</TableHead>
            <TableHead className="px-4">Trạng thái</TableHead>
            <TableHead className="px-4">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {promotions.map((promotion) => (
            <TableRow key={`${promotion.serviceId}-${promotion.id ?? promotion.name}`} className="px-4">
              <TableCell className="px-4">
                <div className="flex flex-col">
                  <span className="font-medium">{promotion.service?.name ?? "—"}</span>
                  <span className="text-xs text-muted-foreground">{promotion.service?.serviceCode ?? promotion.serviceId}</span>
                </div>
              </TableCell>
              <TableCell className="px-4">
                <div className="flex flex-col">
                  <span className="font-medium">{promotion.name}</span>
                  {promotion.description && (
                    <span className="text-sm text-muted-foreground line-clamp-1">{promotion.description}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="px-4">
                <span className={`text-sm font-medium ${promotion.isActive ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {promotion.isActive ? "Đang hoạt động" : "Ngừng"}
                </span>
              </TableCell>
              <TableCell className="flex gap-2 px-4">
                <Button variant="outline" size="sm" onClick={() => openDetailDialog(promotion)} title="Xem chi tiết">
                  <Eye className="size-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(promotion)} title="Chỉnh sửa">
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                  size="sm"
                  onClick={() => void handleDelete(promotion)}
                  disabled={deletingId === promotion.serviceId}
                  title="Xóa"
                >
                  {deletingId === promotion.serviceId ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" color="red" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {!loading && promotions.length === 0 && (
            <TableRow>
              <TableCell colSpan={4}>
                <div className="py-6 text-center text-muted-foreground">Chưa có chương trình khuyến mãi nào</div>
              </TableCell>
            </TableRow>
          )}
          {loading && (
            <TableRow>
              <TableCell colSpan={4}>
                <div className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Đang tải...</div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPrev={() => setPage(Math.max(1, page - 1))}
        onNext={() => setPage(Math.min(totalPages, page + 1))}
      />

      {/* Dialog xem chi tiết khuyến mãi */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết chương trình khuyến mãi</DialogTitle>
          </DialogHeader>
          {viewingPromotion && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Dịch vụ áp dụng</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium">{viewingPromotion.service?.name ?? "—"}</div>
                  <div className="text-sm text-muted-foreground">
                    Mã dịch vụ: {viewingPromotion.service?.serviceCode ?? viewingPromotion.serviceId}
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Tên chương trình</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="font-medium">{viewingPromotion.name}</div>
                </div>
              </div>

              {viewingPromotion.description && (
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">Mô tả</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="text-sm whitespace-pre-wrap">{viewingPromotion.description}</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">Giảm tối đa (%)</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    {viewingPromotion.maxDiscountPercent !== null && viewingPromotion.maxDiscountPercent !== undefined
                      ? `${viewingPromotion.maxDiscountPercent}%`
                      : "—"}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">Giảm tối đa (VNĐ)</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    {formatCurrency(viewingPromotion.maxDiscountAmount)}
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-sm font-semibold">Thời gian áp dụng</Label>
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm">{formatDateRange(viewingPromotion.startDate, viewingPromotion.endDate)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">Cho phép tích điểm Loyalty</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <span className={viewingPromotion.allowLoyaltyDiscount ? "text-emerald-600 font-medium" : "text-muted-foreground"}>
                      {viewingPromotion.allowLoyaltyDiscount ? "Cho phép" : "Không"}
                    </span>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-sm font-semibold">Trạng thái</Label>
                  <div className="p-3 bg-muted rounded-lg">
                    <span className={`text-sm font-medium ${viewingPromotion.isActive ? "text-emerald-600" : "text-muted-foreground"}`}>
                      {viewingPromotion.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                    </span>
                  </div>
                </div>
              </div>

              {(viewingPromotion.createdAt || viewingPromotion.updatedAt) && (
                <div className="grid gap-2 border-t pt-4">
                  <Label className="text-sm font-semibold">Thông tin hệ thống</Label>
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    {viewingPromotion.createdAt && (
                      <div>
                        <span className="font-medium">Ngày tạo: </span>
                        {new Date(viewingPromotion.createdAt).toLocaleString("vi-VN")}
                      </div>
                    )}
                    {viewingPromotion.updatedAt && (
                      <div>
                        <span className="font-medium">Cập nhật lần cuối: </span>
                        {new Date(viewingPromotion.updatedAt).toLocaleString("vi-VN")}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Đóng
            </Button>
            {viewingPromotion && (
              <Button onClick={() => {
                setDetailDialogOpen(false)
                openEdit(viewingPromotion)
              }}>
                <Pencil className="size-4 mr-2" /> Chỉnh sửa
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Template mẫu có sẵn
const TEMPLATE_SAMPLES = [
  {
    templateCode: 'NOI_KHOA',
    name: 'Nội khoa',
    specialtyName: 'Nội tổng quát',
    fields: {
      fields: [
        { name: 'chief_complaint', label: 'Triệu chứng chính', type: 'string', required: true },
        { name: 'hpi', label: 'Diễn tiến bệnh', type: 'text' },
        { name: 'pmh', label: 'Tiền sử bệnh', type: 'text' },
        { name: 'psh', label: 'Tiền sử phẫu thuật', type: 'text' },
        { name: 'social_history', label: 'Tiền sử xã hội', type: 'text' },
        { name: 'family_history', label: 'Tiền sử gia đình', type: 'text' },
        { name: 'medications', label: 'Thuốc dùng', type: 'text' },
        { name: 'allergies', label: 'Dị ứng', type: 'text' },
        { name: 'ros', label: 'Review of Systems', type: 'text' },
        { name: 'vital_signs', label: 'Dấu hiệu sinh tồn', type: 'object', properties: { temp: { type: 'number' }, bp: { type: 'string' }, hr: { type: 'number' }, rr: { type: 'number' }, o2_sat: { type: 'number' }, pain_score: { type: 'number' } } },
        { name: 'physical_exam', label: 'Khám thực thể', type: 'text' },
        { name: 'lab_results', label: 'Xét nghiệm / CLS', type: 'text' },
        { name: 'diagnosis', label: 'Chẩn đoán', type: 'string', required: true },
        { name: 'treatment_plan', label: 'Kế hoạch điều trị', type: 'text', required: true },
        { name: 'notes', label: 'Ghi chú', type: 'text' },
      ],
    },
  },
  {
    templateCode: 'RANG_HAM_MAT',
    name: 'Răng hàm mặt',
    specialtyName: 'Răng hàm mặt',
    fields: {
      fields: [
        { name: 'chief_complaint', label: 'Lý do khám', type: 'string', required: true },
        { name: 'medical_history', label: 'Tiền sử bệnh', type: 'text' },
        { name: 'dental_history', label: 'Tiền sử nha khoa', type: 'text' },
        { name: 'tooth_number', label: 'Số hiệu răng', type: 'string' },
        { name: 'tooth_condition', label: 'Tình trạng răng', type: 'string' },
        { name: 'gum_condition', label: 'Tình trạng nướu', type: 'string' },
        { name: 'occlusion', label: 'Khớp cắn', type: 'string' },
        { name: 'medications', label: 'Thuốc dùng', type: 'text' },
        { name: 'xray_results', label: 'X‑quang', type: 'text' },
        { name: 'diagnosis', label: 'Chẩn đoán', type: 'string', required: true },
        { name: 'treatment_plan', label: 'Kế hoạch điều trị', type: 'text', required: true },
        { name: 'procedures', label: 'Thủ thuật thực hiện', type: 'text' },
        { name: 'consent', label: 'Consent', type: 'text' },
        { name: 'procedure_date', label: 'Ngày thực hiện thủ thuật / điều trị', type: 'date' },
        { name: 'attachments', label: 'Tệp đính kèm (chẩn đoán hình ảnh, kết quả xét nghiệm...)', type: 'array', items: { type: 'object', properties: { filename: { type: 'string' }, filetype: { type: 'string' }, url: { type: 'string' } } } },
        { name: 'notes', label: 'Ghi chú', type: 'text' },
      ],
    },
  },
  {
    templateCode: 'MAT',
    name: 'Mắt',
    specialtyName: 'Mắt',
    fields: {
      fields: [
        { name: 'chief_complaint', label: 'Lý do khám', type: 'string', required: true },
        { name: 'medical_history', label: 'Tiền sử bệnh', type: 'text' },
        { name: 'ocular_history', label: 'Tiền sử mắt', type: 'text' },
        { name: 'visual_acuity', label: 'Thị lực (OD/OS)', type: 'string' },
        { name: 'refraction', label: 'Khúc xạ', type: 'string' },
        { name: 'intraocular_pressure', label: 'IOP', type: 'number' },
        { name: 'anterior_segment', label: 'Mắt trước', type: 'text' },
        { name: 'medications', label: 'Thuốc dùng', type: 'text' },
        { name: 'posterior_segment', label: 'Mắt sau', type: 'text' },
        { name: 'imaging_results', label: 'Hình ảnh học', type: 'text' },
        { name: 'diagnosis', label: 'Chẩn đoán', type: 'string', required: true },
        { name: 'treatment_plan', label: 'Kế hoạch điều trị', type: 'text', required: true },
        { name: 'follow_up', label: 'Tái khám', type: 'text' },
        { name: 'notes', label: 'Ghi chú', type: 'text' },
        { name: 'attachments', label: 'Tệp đính kèm (chẩn đoán hình ảnh, kết quả xét nghiệm...)', type: 'array', items: { type: 'object', properties: { filename: { type: 'string' }, filetype: { type: 'string' }, url: { type: 'string' } } } },
      ],
    },
  },
  {
    templateCode: 'NGOAI_KHOA',
    name: 'Ngoại khoa',
    specialtyName: 'Ngoại khoa',
    fields: {
      fields: [
        { name: 'chief_complaint', label: 'Lý do nhập viện', type: 'string', required: true },
        { name: 'history_of_present_illness', label: 'Diễn tiến bệnh', type: 'text' },
        { name: 'trauma_history', label: 'Tiền sử chấn thương/phẫu thuật', type: 'text' },
        { name: 'medical_history', label: 'Tiền sử bệnh nội khoa', type: 'text' },
        { name: 'vital_signs', label: 'Dấu hiệu sinh tồn', type: 'object', properties: { temp: { type: 'number' }, bp: { type: 'string' }, hr: { type: 'number' }, rr: { type: 'number' } } },
        { name: 'medications', label: 'Thuốc dùng', type: 'text' },
        { name: 'procedure_date', label: 'Ngày thực hiện thủ thuật / điều trị', type: 'date' },
        { name: 'physical_exam', label: 'Khám lâm sàng', type: 'text' },
        { name: 'surgical_assessment', label: 'Đánh giá phẫu thuật', type: 'text' },
        { name: 'lab_results', label: 'Xét nghiệm cận lâm sàng', type: 'text' },
        { name: 'imaging', label: 'Chẩn đoán hình ảnh', type: 'text' },
        { name: 'diagnosis', label: 'Chẩn đoán', type: 'string', required: true },
        { name: 'surgery_plan', label: 'Kế hoạch mổ', type: 'text' },
        { name: 'treatment_plan', label: 'Điều trị nội khoa kèm theo', type: 'text' },
        { name: 'post_op_care', label: 'Chăm sóc hậu phẫu', type: 'text' },
        { name: 'notes', label: 'Ghi chú', type: 'text' },
      ],
    },
  },
  {
    templateCode: 'UNG_BUOU',
    name: 'Ung bướu',
    specialtyName: 'Ung bướu',
    fields: {
      fields: [
        { name: 'chief_complaint', label: 'Triệu chứng chính', type: 'string', required: true },
        { name: 'tumor_location', label: 'Vị trí khối u', type: 'string' },
        { name: 'tumor_size', label: 'Kích thước u', type: 'string' },
        { name: 'clinical_stage', label: 'Giai đoạn lâm sàng', type: 'string' },
        { name: 'histopathology', label: 'Giải phẫu bệnh', type: 'text' },
        { name: 'medications', label: 'Thuốc dùng', type: 'text' },
        { name: 'immuno_results', label: 'Miễn dịch mô học', type: 'text' },
        { name: 'lab_results', label: 'Xét nghiệm (máu, marker)', type: 'text' },
        { name: 'imaging', label: 'Chẩn đoán hình ảnh (CT, MRI)', type: 'text' },
        { name: 'diagnosis', label: 'Chẩn đoán ung thư', type: 'string', required: true },
        { name: 'tnm_classification', label: 'Phân loại TNM', type: 'string' },
        { name: 'treatment_plan', label: 'Kế hoạch điều trị', type: 'text' },
        { name: 'treatment_type', label: 'Loại điều trị (phẫu thuật, hóa xạ)', type: 'string' },
        { name: 'follow_up', label: 'Theo dõi tái khám', type: 'text' },
        { name: 'notes', label: 'Ghi chú', type: 'text' },
        { name: 'attachments', label: 'Tệp đính kèm (chẩn đoán hình ảnh, kết quả xét nghiệm...)', type: 'array', items: { type: 'object', properties: { filename: { type: 'string' }, filetype: { type: 'string' }, url: { type: 'string' } } } },
      ],
    },
  },
  {
    templateCode: 'TRUYEN_NHIEM',
    name: 'Truyền nhiễm',
    specialtyName: 'Truyền nhiễm',
    fields: {
      fields: [
        { name: 'chief_complaint', label: 'Lý do vào viện', type: 'string', required: true },
        { name: 'onset_date', label: 'Ngày khởi phát', type: 'date' },
        { name: 'epidemiological_history', label: 'Tiền sử dịch tễ', type: 'text' },
        { name: 'medical_history', label: 'Tiền sử bệnh lý', type: 'text' },
        { name: 'medications', label: 'Thuốc dùng', type: 'text' },
        { name: 'contact_history', label: 'Tiếp xúc với người bệnh', type: 'text' },
        { name: 'vital_signs', label: 'Dấu hiệu sinh tồn', type: 'object', properties: { temp: { type: 'number' }, bp: { type: 'string' }, hr: { type: 'number' }, rr: { type: 'number' } } },
        { name: 'physical_exam', label: 'Khám thực thể', type: 'text' },
        { name: 'lab_results', label: 'Cận lâm sàng (HIV, vi sinh,...)', type: 'text' },
        { name: 'infectious_diagnosis', label: 'Chẩn đoán truyền nhiễm', type: 'string', required: true },
        { name: 'isolation_required', label: 'Yêu cầu cách ly', type: 'boolean' },
        { name: 'treatment_plan', label: 'Điều trị (kháng sinh, theo phác đồ)', type: 'text' },
        { name: 'notification_status', label: 'Khai báo dịch tễ', type: 'string' },
        { name: 'follow_up', label: 'Tái khám theo dõi', type: 'text' },
        { name: 'notes', label: 'Ghi chú', type: 'text' },
        { name: 'attachments', label: 'Tệp đính kèm (chẩn đoán hình ảnh, kết quả xét nghiệm...)', type: 'array', items: { type: 'object', properties: { filename: { type: 'string' }, filetype: { type: 'string' }, url: { type: 'string' } } } },
      ],
    },
  },
  {
    templateCode: 'NHI_KHOA',
    name: 'Nhi khoa',
    specialtyName: 'Nhi khoa',
    fields: {
      fields: [
        { name: 'chief_complaint', label: 'Lý do nhập viện', type: 'string', required: true },
        { name: 'onset_date', label: 'Ngày khởi phát triệu chứng', type: 'date' },
        { name: 'birth_history', label: 'Tiền sử sinh (đủ/tháng, mổ/thường, cân nặng sinh)', type: 'text' },
        { name: 'allergies', label: 'Dị ứng', type: 'text' },
        { name: 'immunization_history', label: 'Tiêm chủng', type: 'text' },
        { name: 'nutrition_history', label: 'Dinh dưỡng', type: 'text' },
        { name: 'growth_chart', label: 'Biểu đồ tăng trưởng', type: 'text' },
        { name: 'family_history', label: 'Tiền sử gia đình', type: 'text' },
        { name: 'vital_signs', label: 'Dấu hiệu sinh tồn', type: 'object', properties: { temp: { type: 'number' }, bp: { type: 'string' }, hr: { type: 'number' }, rr: { type: 'number' }, weight: { type: 'number' }, height: { type: 'number' } } },
        { name: 'physical_exam', label: 'Khám lâm sàng', type: 'text' },
        { name: 'diagnosis', label: 'Chẩn đoán', type: 'string', required: true },
        { name: 'treatment_plan', label: 'Kế hoạch điều trị', type: 'text', required: true },
        { name: 'follow_up', label: 'Tái khám', type: 'text' },
        { name: 'notes', label: 'Ghi chú thêm', type: 'text' },
      ],
    },
  },
  {
    templateCode: 'PHU_KHOA',
    name: 'Phụ khoa',
    specialtyName: 'Phụ khoa',
    fields: {
      fields: [
        { name: 'chief_complaint', label: 'Lý do khám', type: 'string', required: true },
        { name: 'menstrual_history', label: 'Kinh nguyệt', type: 'text' },
        { name: 'allergies', label: 'Dị ứng', type: 'text' },
        { name: 'obstetric_history', label: 'Tiền sử sản khoa (para, gravida, sảy thai,...)', type: 'text' },
        { name: 'sexual_history', label: 'Tiền sử tình dục', type: 'text' },
        { name: 'vaginal_discharge', label: 'Khí hư', type: 'text' },
        { name: 'pelvic_exam', label: 'Khám phụ khoa', type: 'text' },
        { name: 'ultrasound', label: 'Siêu âm phụ khoa', type: 'text' },
        { name: 'lab_results', label: 'Xét nghiệm (Pap, nội tiết...)', type: 'text' },
        { name: 'diagnosis', label: 'Chẩn đoán', type: 'string', required: true },
        { name: 'treatment_plan', label: 'Kế hoạch điều trị', type: 'text', required: true },
        { name: 'contraceptive_advice', label: 'Tư vấn tránh thai', type: 'text' },
        { name: 'follow_up', label: 'Tái khám', type: 'text' },
        { name: 'notes', label: 'Ghi chú', type: 'text' },
        { name: 'attachments', label: 'Tệp đính kèm (chẩn đoán hình ảnh, kết quả xét nghiệm...)', type: 'array', items: { type: 'object', properties: { filename: { type: 'string' }, filetype: { type: 'string' }, url: { type: 'string' } } } },
      ],
    },
  },
  {
    templateCode: 'DA_LIEU',
    name: 'Da liễu',
    specialtyName: 'Da liễu',
    fields: {
      fields: [
        { name: 'chief_complaint', label: 'Lý do khám', type: 'string', required: true },
        { name: 'onset_date', label: 'Thời gian xuất hiện triệu chứng', type: 'date' },
        { name: 'rash_location', label: 'Vị trí tổn thương da', type: 'text' },
        { name: 'rash_characteristics', label: 'Đặc điểm tổn thương (màu sắc, vảy, dạng,...)', type: 'text' },
        { name: 'medications', label: 'Thuốc dùng', type: 'text' },
        { name: 'itching', label: 'Ngứa', type: 'boolean' },
        { name: 'exposure_history', label: 'Tiền sử tiếp xúc (dị nguyên, môi trường)', type: 'text' },
        { name: 'medical_history', label: 'Tiền sử bệnh lý (dị ứng, cơ địa,...)', type: 'text' },
        { name: 'lab_results', label: 'Xét nghiệm (HIV, nấm, test dị ứng)', type: 'text' },
        { name: 'diagnosis', label: 'Chẩn đoán da liễu', type: 'string', required: true },
        { name: 'treatment_plan', label: 'Điều trị (thuốc bôi, uống, kháng sinh)', type: 'text', required: true },
        { name: 'follow_up', label: 'Tái khám', type: 'text' },
        { name: 'notes', label: 'Ghi chú', type: 'text' },
      ],
    },
  },
  {
    templateCode: 'SAN_KHOA',
    name: 'Sản khoa',
    specialtyName: 'Sản khoa',
    fields: {
      fields: [
        { name: 'chief_complaint', label: 'Lý do nhập viện', type: 'string', required: true },
        { name: 'gestational_age', label: 'Tuổi thai (tuần)', type: 'number' },
        { name: 'obstetric_history', label: 'Tiền sử sản khoa (para, gravida, sảy thai)', type: 'text' },
        { name: 'prenatal_care', label: 'Theo dõi thai kỳ', type: 'text' },
        { name: 'fetal_heart_rate', label: 'Nhịp tim thai', type: 'number' },
        { name: 'membranes_status', label: 'Tình trạng ối (vỡ ối, còn ối...)', type: 'string' },
        { name: 'contractions', label: 'Cơn gò tử cung', type: 'string' },
        { name: 'vaginal_exam', label: 'Khám âm đạo (cổ tử cung, ngôi, lọt)', type: 'text' },
        { name: 'ultrasound', label: 'Siêu âm sản khoa', type: 'text' },
        { name: 'diagnosis', label: 'Chẩn đoán', type: 'string', required: true },
        { name: 'delivery_plan', label: 'Kế hoạch sinh (đẻ thường, mổ lấy thai)', type: 'string' },
        { name: 'treatment_plan', label: 'Điều trị kèm theo', type: 'text' },
        { name: 'follow_up', label: 'Theo dõi', type: 'text' },
        { name: 'attachments', label: 'Tệp đính kèm (chẩn đoán hình ảnh, kết quả xét nghiệm...)', type: 'array', items: { type: 'object', properties: { filename: { type: 'string' }, filetype: { type: 'string' }, url: { type: 'string' } } } },
        { name: 'notes', label: 'Ghi chú', type: 'text' },
        { name: 'procedure_date', label: 'Ngày thực hiện thủ thuật / điều trị', type: 'date' },
      ],
    },
  },
  {
    templateCode: 'TAI_MUI_HONG',
    name: 'Tai mũi họng',
    specialtyName: 'Tai mũi họng',
    fields: {
      fields: [
        { name: 'chief_complaint', label: 'Lý do khám', type: 'string', required: true },
        { name: 'onset_date', label: 'Ngày khởi phát', type: 'date' },
        { name: 'symptom_description', label: 'Mô tả triệu chứng (đau tai, nghẹt mũi,...)', type: 'text' },
        { name: 'hearing_loss', label: 'Mức độ nghe giảm', type: 'string' },
        { name: 'nasal_discharge', label: 'Dịch mũi', type: 'string' },
        { name: 'throat_exam', label: 'Khám họng (amidan, họng đỏ...)', type: 'text' },
        { name: 'otoscopy', label: 'Soi tai', type: 'text' },
        { name: 'medications', label: 'Thuốc dùng', type: 'text' },
        { name: 'audiometry', label: 'Đo thính lực', type: 'text' },
        { name: 'diagnosis', label: 'Chẩn đoán', type: 'string', required: true },
        { name: 'treatment_plan', label: 'Điều trị (thuốc, phẫu thuật, hút mủ...)', type: 'text', required: true },
        { name: 'follow_up', label: 'Tái khám', type: 'text' },
        { name: 'notes', label: 'Ghi chú', type: 'text' },
        { name: 'attachments', label: 'Tệp đính kèm (chẩn đoán hình ảnh, kết quả xét nghiệm...)', type: 'array', items: { type: 'object', properties: { filename: { type: 'string' }, filetype: { type: 'string' }, url: { type: 'string' } } } },
      ],
    },
  },
  {
    templateCode: 'PHUC_HOI_CHUC_NANG',
    name: 'Phục hồi chức năng',
    specialtyName: 'Phục hồi chức năng',
    fields: {
      fields: [
        { name: 'chief_complaint', label: 'Lý do đến khám', type: 'string', required: true },
        { name: 'onset_date', label: 'Ngày khởi phát', type: 'date' },
        { name: 'medical_history', label: 'Tiền sử bệnh lý (tai biến, chấn thương)', type: 'text' },
        { name: 'functional_status', label: 'Tình trạng chức năng hiện tại', type: 'text' },
        { name: 'muscle_strength', label: 'Sức cơ', type: 'string' },
        { name: 'range_of_motion', label: 'Tầm vận động', type: 'string' },
        { name: 'neurological_exam', label: 'Thăm khám thần kinh', type: 'text' },
        { name: 'rehabilitation_diagnosis', label: 'Chẩn đoán PHCN', type: 'string', required: true },
        { name: 'rehab_goals', label: 'Mục tiêu phục hồi', type: 'text' },
        { name: 'treatment_plan', label: 'Kế hoạch điều trị (VLTL, hoạt động trị liệu...)', type: 'text', required: true },
        { name: 'therapy_schedule', label: 'Lịch trị liệu', type: 'text' },
        { name: 'follow_up', label: 'Theo dõi tiến triển', type: 'text' },
        { name: 'notes', label: 'Ghi chú', type: 'text' },
      ],
    },
  },
  {
    templateCode: 'BONG',
    name: 'Bỏng',
    specialtyName: 'Bỏng',
    fields: {
      fields: [
        { name: 'chief_complaint', label: 'Lý do nhập viện', type: 'string', required: true },
        { name: 'burn_cause', label: 'Nguyên nhân bỏng (nhiệt, hóa chất...)', type: 'string' },
        { name: 'burn_date', label: 'Thời điểm bị bỏng', type: 'date' },
        { name: 'burn_depth', label: 'Độ sâu bỏng', type: 'string' },
        { name: 'burn_area_percent', label: 'Diện tích bỏng (%)', type: 'number' },
        { name: 'burn_location', label: 'Vị trí vùng bỏng', type: 'text' },
        { name: 'vital_signs', label: 'Dấu hiệu sinh tồn', type: 'object', properties: { temp: { type: 'number' }, bp: { type: 'string' }, hr: { type: 'number' }, rr: { type: 'number' } } },
        { name: 'infection_signs', label: 'Dấu hiệu nhiễm trùng', type: 'text' },
        { name: 'diagnosis', label: 'Chẩn đoán', type: 'string', required: true },
        { name: 'treatment_plan', label: 'Điều trị (dịch truyền, kháng sinh...)', type: 'text', required: true },
        { name: 'medications', label: 'Thuốc dùng', type: 'text' },
        { name: 'wound_care', label: 'Chăm sóc vết bỏng', type: 'text' },
        { name: 'follow_up', label: 'Tái khám', type: 'text' },
        { name: 'notes', label: 'Ghi chú', type: 'text' },
      ],
    },
  },
  {
    templateCode: 'HUYET_HOC_TRUYEN_MAU',
    name: 'Huyết học/truyền máu',
    specialtyName: 'Huyết học/truyền máu',
    fields: {
      fields: [
        { name: 'chief_complaint', label: 'Lý do khám', type: 'string', required: true },
        { name: 'anemia_history', label: 'Tiền sử thiếu máu', type: 'text' },
        { name: 'bleeding_symptoms', label: 'Triệu chứng xuất huyết', type: 'text' },
        { name: 'transfusion_history', label: 'Lịch sử truyền máu', type: 'text' },
        { name: 'family_history', label: 'Tiền sử gia đình', type: 'text' },
        { name: 'lab_results', label: 'Kết quả xét nghiệm máu', type: 'text' },
        { name: 'bone_marrow_exam', label: 'Xét nghiệm tủy xương', type: 'text' },
        { name: 'diagnosis', label: 'Chẩn đoán huyết học', type: 'string', required: true },
        { name: 'treatment_plan', label: 'Kế hoạch điều trị (truyền, hóa trị...)', type: 'text', required: true },
        { name: 'monitoring', label: 'Theo dõi', type: 'text' },
        { name: 'notes', label: 'Ghi chú', type: 'text' },
      ],
    },
  },
  {
    templateCode: 'TAM_THAN',
    name: 'Tâm thần',
    specialtyName: 'Tâm thần',
    fields: {
      fields: [
        { name: 'chief_complaint', label: 'Lý do khám', type: 'string', required: true },
        { name: 'psychiatric_history', label: 'Tiền sử tâm thần', type: 'text' },
        { name: 'substance_use', label: 'Lạm dụng chất', type: 'text' },
        { name: 'behavioral_observation', label: 'Quan sát hành vi', type: 'text' },
        { name: 'mood_affect', label: 'Khí sắc / cảm xúc', type: 'string' },
        { name: 'thought_content', label: 'Nội dung tư duy (hoang tưởng...)', type: 'text' },
        { name: 'cognition_status', label: 'Tình trạng nhận thức', type: 'text' },
        { name: 'mental_exam', label: 'Khám tâm thần', type: 'text' },
        { name: 'diagnosis', label: 'Chẩn đoán rối loạn', type: 'string', required: true },
        { name: 'treatment_plan', label: 'Điều trị (thuốc an thần, tâm lý...)', type: 'text', required: true },
        { name: 'risk_assessment', label: 'Đánh giá nguy cơ', type: 'text' },
        { name: 'follow_up', label: 'Tái khám / giám sát', type: 'text' },
        { name: 'notes', label: 'Ghi chú', type: 'text' },
      ],
    },
  },
  {
    templateCode: 'NGOAI_TRU_CHUNG',
    name: 'Ngoại trú chung',
    specialtyName: 'Ngoại trú chung',
    fields: {
      fields: [
        { name: 'chief_complaint', label: 'Lý do khám', type: 'string', required: true },
        { name: 'history_of_present_illness', label: 'Diễn tiến bệnh', type: 'text' },
        { name: 'medical_history', label: 'Tiền sử bệnh', type: 'text' },
        { name: 'medications', label: 'Thuốc dùng', type: 'text' },
        { name: 'vital_signs', label: 'Dấu hiệu sinh tồn', type: 'object', properties: { temp: { type: 'number' }, bp: { type: 'string' }, hr: { type: 'number' }, rr: { type: 'number' } } },
        { name: 'physical_exam', label: 'Khám lâm sàng', type: 'text' },
        { name: 'diagnosis', label: 'Chẩn đoán sơ bộ', type: 'string', required: true },
        { name: 'treatment_plan', label: 'Kê toa / hướng dẫn điều trị', type: 'text', required: true },
        { name: 'follow_up', label: 'Dặn dò / tái khám', type: 'text' },
        { name: 'notes', label: 'Ghi chú', type: 'text' },
      ],
    },
  },
] as const

function TemplatesTab() {
  const [templates, setTemplates] = React.useState<Template[]>([])
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Template | null>(null)
  const [form, setForm] = React.useState<{
    templateCode: string
    name: string
    specialtyId: string
    isActive: boolean
    fields: (TemplateField & {
      properties?: Record<string, { type: string }>
      items?: { type: string; properties?: Record<string, { type: string }> }
    })[]
  }>({
    templateCode: "",
    name: "",
    specialtyId: "",
    isActive: true,
    fields: []
  })
  const [submitting, setSubmitting] = React.useState(false)
  const [specialties, setSpecialties] = React.useState<Specialty[]>([])

  React.useEffect(() => {
    void (async () => {
      try {
        const res = await specialtiesService.listSpecialties(1, 100)
        setSpecialties(Array.isArray(res.data) ? res.data : [])
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Không tải được danh sách khoa")
        setSpecialties([]) // Reset to empty array on error
      }
    })()
  }, [])

  const loadTemplates = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await templatesService.listTemplates()
      setTemplates(data)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void loadTemplates()
  }, [loadTemplates])

  const loadTemplateFromSample = (sample: typeof TEMPLATE_SAMPLES[number]) => {
    // Tìm specialtyId từ specialtyName
    const specialty = specialties.find(s => s.name === sample.specialtyName || s.specialtyCode === sample.specialtyName)
    setForm({
      templateCode: sample.templateCode,
      name: sample.name,
      specialtyId: specialty?.id || "",
      isActive: true,
      fields: sample.fields.fields.map(f => {
        const field: TemplateField = {
          name: f.name,
          label: f.label,
          type: f.type as TemplateField['type'],
          required: ('required' in f && f.required) || false,
        }
        // Chỉ thêm properties/items nếu type là object hoặc array
        if (f.type === 'object' && 'properties' in f) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (field as any).properties = f.properties
        }
        if (f.type === 'array' && 'items' in f) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (field as any).items = f.items
        }
        return field
      })
    })
  }

  const openCreate = () => {
    setEditing(null)
    setForm({
      templateCode: "",
      name: "",
      specialtyId: "",
      isActive: true,
      fields: []
    })
    setOpen(true)
  }

  const openEdit = async (t: Template) => {
    setEditing(t)
    try {
      const templateDetail = await templatesService.getTemplate(t.id)
      setForm({
        templateCode: templateDetail.templateCode,
        name: templateDetail.name,
        specialtyId: templateDetail.specialtyId || "",
        isActive: templateDetail.isActive ?? true,
        fields: templateDetail.fields?.fields || []
      })
      setOpen(true)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được thông tin template")
    }
  }

  const addField = () => {
    setForm(f => ({
      ...f,
      fields: [...f.fields, {
        name: "",
        label: "",
        type: "string" as const,
        required: false
      }]
    }))
  }

  const removeField = (index: number) => {
    setForm(f => ({
      ...f,
      fields: f.fields.filter((_, i) => i !== index)
    }))
  }

  const updateField = (index: number, updates: Partial<TemplateField & { properties?: Record<string, { type: string }>; items?: { type: string; properties?: Record<string, { type: string }> } }>) => {
    setForm(f => ({
      ...f,
      fields: f.fields.map((field, i) => i === index ? { ...field, ...updates } : field)
    }))
  }

  const onSubmit = async () => {
    if (!form.templateCode || !form.name || !form.specialtyId) {
      toast.error("Vui lòng nhập đầy đủ thông tin")
      return
    }
    if (form.fields.length === 0) {
      toast.error("Vui lòng thêm ít nhất một trường")
      return
    }
    
    // Validate field names are unique and valid
    const fieldNames = form.fields.map(f => f.name.trim()).filter(Boolean)
    if (new Set(fieldNames).size !== fieldNames.length) {
      toast.error("Tên các trường phải là duy nhất")
      return
    }

    // Validate field name format (should be valid identifier: letters, numbers, underscore)
    const namePattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/
    for (const field of form.fields) {
      if (!field.name.trim() || !field.label.trim()) {
        toast.error("Tất cả các trường phải có tên và nhãn")
        return
      }
      if (!namePattern.test(field.name.trim())) {
        toast.error(`Tên trường "${field.name}" không hợp lệ. Chỉ được chứa chữ cái, số và dấu gạch dưới, bắt đầu bằng chữ cái hoặc dấu gạch dưới.`)
        return
      }
    }

    // Validate select/multiselect fields have options
    for (const field of form.fields) {
      if ((field.type === 'select' || field.type === 'multiselect') && (!field.options || field.options.length === 0)) {
        toast.error(`Trường "${field.label}" (loại ${field.type === 'select' ? 'chọn một' : 'chọn nhiều'}) phải có ít nhất một tùy chọn`)
        return
      }
    }

    setSubmitting(true)
    try {
      if (editing) {
        const updatePayload: UpdateTemplateDto = {
          name: form.name,
          isActive: form.isActive,
          fields: {
            fields: form.fields.map(f => ({
              name: f.name.trim(),
              label: f.label.trim(),
              type: f.type,
              required: f.required || false,
              ...(f.type === 'select' || f.type === 'multiselect' ? { options: f.options || [] } : {}),
              ...(f.placeholder ? { placeholder: f.placeholder } : {}),
              ...(f.defaultValue !== undefined ? { defaultValue: f.defaultValue } : {}),
              ...(f.validation ? { validation: f.validation } : {}),
              ...((f.type as string) === 'object' && f.properties ? { properties: f.properties } : {}),
              ...((f.type as string) === 'array' && f.items ? { items: f.items } : {})
            }))
          }
        }
        await templatesService.updateTemplate(editing.id, updatePayload)
        toast.success("Cập nhật template thành công")
      } else {
        const createPayload: CreateTemplateDto = {
          templateCode: form.templateCode.trim(),
          name: form.name.trim(),
          specialtyId: form.specialtyId,
          isActive: form.isActive,
          fields: {
            fields: form.fields.map(f => ({
              name: f.name.trim(),
              label: f.label.trim(),
              type: f.type,
              required: f.required || false,
              ...(f.type === 'select' || f.type === 'multiselect' ? { options: f.options || [] } : {}),
              ...(f.placeholder ? { placeholder: f.placeholder } : {}),
              ...(f.defaultValue !== undefined ? { defaultValue: f.defaultValue } : {}),
              ...(f.validation ? { validation: f.validation } : {}),
              ...((f.type as string) === 'object' && f.properties ? { properties: f.properties } : {}),
              ...((f.type as string) === 'array' && f.items ? { items: f.items } : {})
            })) as TemplateField[]
          }
        }
        await templatesService.createTemplate(createPayload)
        toast.success("Tạo template thành công")
      }
      setOpen(false)
      await loadTemplates()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    } finally {
      setSubmitting(false)
    }
  }

  const onDelete = async (t: Template) => {
    toast.promise(
      templatesService.deleteTemplate(t.id).then(() => {
        loadTemplates()
      }),
      {
        loading: `Đang xóa template "${t.name}"...`,
        success: `Đã xóa template "${t.name}" thành công`,
        error: (err) => err instanceof Error ? err.message : "Lỗi không xác định",
      }
    )
  }

  const fieldTypeOptions = [
    { value: "string", label: "Văn bản ngắn" },
    { value: "text", label: "Văn bản dài" },
    { value: "number", label: "Số" },
    { value: "boolean", label: "Có/Không" },
    { value: "date", label: "Ngày" },
    { value: "datetime", label: "Ngày giờ" },
    { value: "select", label: "Chọn một" },
    { value: "multiselect", label: "Chọn nhiều" },
    { value: "object", label: "Đối tượng (Object)" },
    { value: "array", label: "Mảng (Array)" },
  ]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => loadTemplates()} disabled={loading}>
            <RefreshCw className="size-4" /> Làm mới
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Select onValueChange={(value) => {
            const sample = TEMPLATE_SAMPLES.find(s => s.templateCode === value)
            if (sample) {
              openCreate()
              setTimeout(() => loadTemplateFromSample(sample), 100)
            }
          }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Tạo từ mẫu..." />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_SAMPLES.map((sample) => (
                <SelectItem key={sample.templateCode} value={sample.templateCode}>
                  {sample.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>
                <Plus className="size-4" /> Thêm template
              </Button>
            </DialogTrigger>
          <DialogContent className="w-[90vw] max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Cập nhật template" : "Thêm template"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-6">
              {/* Cột trái: Thông tin cơ bản */}
              <div className="flex flex-col gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="templateCode">Mã template *</Label>
                  <Input
                    id="templateCode"
                    value={form.templateCode}
                    onChange={(e) => setForm((f) => ({ ...f, templateCode: e.target.value }))}
                    disabled={!!editing}
                    placeholder="VD: NOI_KHOA_V2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="templateName">Tên template *</Label>
                  <Input
                    id="templateName"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="VD: Nội khoa (Phiên bản 2)"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Khoa *</Label>
                  <Select value={form.specialtyId} onValueChange={(v) => setForm((f) => ({ ...f, specialtyId: v }))}>
                    <SelectTrigger className="w-full"><SelectValue placeholder="Chọn khoa" /></SelectTrigger>
                    <SelectContent>
                      {specialties && specialties.length > 0 ? (
                        specialties.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{`${s.name} (${s.specialtyCode})`}</SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">Không có khoa nào</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Trạng thái</Label>
                  <Select value={String(form.isActive)} onValueChange={(v) => setForm((f) => ({ ...f, isActive: v === "true" }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Đang hoạt động</SelectItem>
                      <SelectItem value="false">Ngừng hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Cột phải: Quản lý fields */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <Label>Danh sách trường dữ liệu</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addField}>
                    <Plus className="size-4" /> Thêm trường
                  </Button>
                </div>
                {form.fields.length > 0 ? (
                  <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
                    {form.fields.map((field, fieldIndex) => (
                      <div key={fieldIndex} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Trường {fieldIndex + 1}</Label>
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeField(fieldIndex)}>
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </div>
                        <div className="grid gap-2">
                          <Label>Tên trường (name) *</Label>
                          <Input
                            value={field.name}
                            onChange={(e) => updateField(fieldIndex, { name: e.target.value })}
                            placeholder="VD: chief_complaint"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Nhãn hiển thị (label) *</Label>
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(fieldIndex, { label: e.target.value })}
                            placeholder="VD: Triệu chứng chính"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Loại dữ liệu *</Label>
                          <Select
                            value={field.type}
                            onValueChange={(v) => updateField(fieldIndex, { type: v as TemplateField['type'] })}
                          >
                            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {fieldTypeOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={field.required || false}
                            onCheckedChange={(checked) => updateField(fieldIndex, { required: checked === true })}
                          />
                          <Label className="text-sm">Bắt buộc</Label>
                        </div>
                        {(field.type === 'select' || field.type === 'multiselect') && (
                          <div className="grid gap-2">
                            <Label>Tùy chọn (mỗi dòng một giá trị)</Label>
                            <Textarea
                              value={field.options?.join('\n') || ''}
                              onChange={(e) => {
                                const options = e.target.value.split('\n').filter(Boolean).map(s => s.trim())
                                updateField(fieldIndex, { options })
                              }}
                              placeholder="Giá trị 1&#10;Giá trị 2&#10;Giá trị 3"
                              rows={3}
                            />
                          </div>
                        )}
                        <div className="grid gap-2">
                          <Label>Placeholder (gợi ý)</Label>
                          <Input
                            value={field.placeholder || ''}
                            onChange={(e) => updateField(fieldIndex, { placeholder: e.target.value })}
                            placeholder="VD: Nhập triệu chứng..."
                          />
                        </div>
                        {(field.type === 'number') && (
                          <div className="grid grid-cols-2 gap-2">
                            <div className="grid gap-2">
                              <Label>Giá trị tối thiểu</Label>
                              <Input
                                type="number"
                                value={field.validation?.min ?? ''}
                                onChange={(e) => updateField(fieldIndex, {
                                  validation: {
                                    ...field.validation,
                                    min: e.target.value ? Number(e.target.value) : undefined
                                  }
                                })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Giá trị tối đa</Label>
                              <Input
                                type="number"
                                value={field.validation?.max ?? ''}
                                onChange={(e) => updateField(fieldIndex, {
                                  validation: {
                                    ...field.validation,
                                    max: e.target.value ? Number(e.target.value) : undefined
                                  }
                                })}
                              />
                            </div>
                          </div>
                        )}
                        {(field.type as string) === 'object' && (
                          <div className="grid gap-2 border-t pt-3">
                            <div className="flex items-center justify-between">
                              <Label>Thuộc tính (Properties)</Label>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const newPropName = `property_${Object.keys(field.properties || {}).length + 1}`
                                  updateField(fieldIndex, {
                                    properties: {
                                      ...(field.properties || {}),
                                      [newPropName]: { type: 'string' }
                                    }
                                  })
                                }}
                              >
                                <Plus className="size-3" /> Thêm thuộc tính
                              </Button>
                            </div>
                            {field.properties && Object.keys(field.properties).length > 0 ? (
                              <div className="space-y-2">
                                {Object.entries(field.properties).map(([propName, propValue], propIndex) => (
                                  <div key={propIndex} className="flex items-center gap-2 p-2 border rounded">
                                    <Input
                                      placeholder="Tên thuộc tính"
                                      value={propName}
                                      onChange={(e) => {
                                        const newProps = { ...field.properties }
                                        delete newProps[propName]
                                        newProps[e.target.value] = propValue
                                        updateField(fieldIndex, { properties: newProps })
                                      }}
                                      className="flex-1"
                                    />
                                    <Select
                                      value={propValue.type}
                                      onValueChange={(v) => {
                                        updateField(fieldIndex, {
                                          properties: {
                                            ...field.properties,
                                            [propName]: { type: v }
                                          }
                                        })
                                      }}
                                    >
                                      <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="string">string</SelectItem>
                                        <SelectItem value="number">number</SelectItem>
                                        <SelectItem value="boolean">boolean</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const newProps = { ...field.properties }
                                        delete newProps[propName]
                                        updateField(fieldIndex, { properties: newProps })
                                      }}
                                    >
                                      <Trash2 className="size-4 text-destructive" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground text-center py-2 border rounded">
                                Chưa có thuộc tính nào
                              </div>
                            )}
                          </div>
                        )}
                        {(field.type as string) === 'array' && (
                          <div className="grid gap-2 border-t pt-3">
                            <Label>Kiểu phần tử (Items)</Label>
                            <Select
                              value={field.items?.type || 'string'}
                              onValueChange={(v) => {
                                if (v === 'object') {
                                  updateField(fieldIndex, {
                                    items: {
                                      type: 'object',
                                      properties: {}
                                    }
                                  })
                                } else {
                                  updateField(fieldIndex, {
                                    items: { type: v }
                                  })
                                }
                              }}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="string">string</SelectItem>
                                <SelectItem value="number">number</SelectItem>
                                <SelectItem value="boolean">boolean</SelectItem>
                                <SelectItem value="object">object</SelectItem>
                              </SelectContent>
                            </Select>
                            {field.items?.type === 'object' && field.items.properties && (
                              <div className="grid gap-2 mt-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm">Thuộc tính của object</Label>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const newPropName = `property_${Object.keys(field.items?.properties || {}).length + 1}`
                                      updateField(fieldIndex, {
                                        items: {
                                          type: 'object',
                                          properties: {
                                            ...(field.items?.properties || {}),
                                            [newPropName]: { type: 'string' }
                                          }
                                        }
                                      })
                                    }}
                                  >
                                    <Plus className="size-3" /> Thêm thuộc tính
                                  </Button>
                                </div>
                                {Object.keys(field.items.properties).length > 0 ? (
                                  <div className="space-y-2">
                                    {Object.entries(field.items.properties).map(([propName, propValue], propIndex) => (
                                      <div key={propIndex} className="flex items-center gap-2 p-2 border rounded">
                                        <Input
                                          placeholder="Tên thuộc tính"
                                          value={propName}
                                          onChange={(e) => {
                                            const newProps = { ...field.items?.properties }
                                            delete newProps[propName]
                                            newProps[e.target.value] = propValue
                                            updateField(fieldIndex, {
                                              items: {
                                                type: 'object',
                                                properties: newProps
                                              }
                                            })
                                          }}
                                          className="flex-1"
                                        />
                                        <Select
                                          value={propValue.type}
                                          onValueChange={(v) => {
                                            updateField(fieldIndex, {
                                              items: {
                                                type: 'object',
                                                properties: {
                                                  ...field.items?.properties,
                                                  [propName]: { type: v }
                                                }
                                              }
                                            })
                                          }}
                                        >
                                          <SelectTrigger className="w-[120px]">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="string">string</SelectItem>
                                            <SelectItem value="number">number</SelectItem>
                                            <SelectItem value="boolean">boolean</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            const newProps = { ...field.items?.properties }
                                            delete newProps[propName]
                                            updateField(fieldIndex, {
                                              items: {
                                                type: 'object',
                                                properties: newProps
                                              }
                                            })
                                          }}
                                        >
                                          <Trash2 className="size-4 text-destructive" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-sm text-muted-foreground text-center py-2 border rounded">
                                    Chưa có thuộc tính nào
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground text-center py-4 border rounded-lg">
                    Chưa có trường nào. Nhấn &quot;Thêm trường&quot; để thêm trường dữ liệu.
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Hủy</Button>
              <Button onClick={onSubmit} disabled={submitting}>{submitting && <Loader2 className="size-4 animate-spin" />} Lưu</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {error && <div className="text-destructive">{error}</div>}

      <Table className="rounded-lg">
        <TableHeader>
          <TableRow className="bg-muted px-8">
            <TableHead className="px-4">Mã template</TableHead>
            <TableHead className="px-4">Tên template</TableHead>
            <TableHead className="px-4">Khoa</TableHead>
            <TableHead className="px-4">Số trường</TableHead>
            <TableHead className="px-4">Trạng thái</TableHead>
            <TableHead className="px-4">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {templates.map((t) => (
            <TableRow key={t.id} className="px-4">
              <TableCell className="px-4">{t.templateCode}</TableCell>
              <TableCell className="px-4">{t.name}</TableCell>
              <TableCell className="px-4">{t.specialty ? `${t.specialty.name} (${t.specialty.specialtyCode})` : "—"}</TableCell>
              <TableCell className="px-4">{t.fields?.fields?.length || 0}</TableCell>
              <TableCell className="px-4">
                <span className={`text-sm font-medium ${t.isActive ? "text-emerald-600" : "text-muted-foreground"}`}>
                  {t.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                </span>
              </TableCell>
              <TableCell className="flex gap-2 px-4">
                <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                  <Pencil className="size-4" /> 
                </Button>
                <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300" size="sm" onClick={() => onDelete(t)}>
                  <Trash2 className="size-4" color="red" /> 
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {loading && (
            <TableRow>
              <TableCell colSpan={6}>
                <div className="flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Đang tải...</div>
              </TableCell>
            </TableRow>
          )}
          {!loading && templates.length === 0 && (
            <TableRow>
              <TableCell colSpan={6}>
                <div className="py-6 text-center text-muted-foreground">Chưa có template nào</div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}