"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, RefreshCw, Settings, ChartBarStacked, FileTextIcon, Package as PackageIcon } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import {
  servicesService,
  packagesService,
  serviceCategoriesService,
  specialtiesService,
  type Service,
  type Package,
  type ServiceCategory,
  type ServiceCategoryDetail,
  type Specialty,
  type PackageItem,
} from "@/lib/services/services.service"

export default function ServicesPage() {
  const [tab, setTab] = React.useState("categories")
  return (
    <div className="min-h-screen bg-white px-8 py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Quản lý dịch vụ & gói khám</h2>
        </div>  
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="flex items-center gap-2  bg-muted p-1 rounded-lg">
            <TabsTrigger className="flex items-center min-w-40 gap-2 rounded-md transition
            data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground
            data-[state=inactive]:text-muted-foreground" value="categories"> <ChartBarStacked className="h-4 w-4" /> Danh mục dịch vụ</TabsTrigger>
            <TabsTrigger className="flex items-center min-w-40 gap-2 rounded-md transition
            data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground
            data-[state=inactive]:text-muted-foreground" value="services"> <FileTextIcon className="h-4 w-4" /> Dịch vụ</TabsTrigger>
            <TabsTrigger className="flex items-center min-w-40 gap-2 rounded-md transition
            data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-foreground
            data-[state=inactive]:text-muted-foreground" value="packages"> <PackageIcon className="h-4 w-4" /> Gói dịch vụ</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="mt-4">
            <CategoriesTab />
          </TabsContent>
          <TabsContent value="services" className="mt-4">
            <ServicesTab />
          </TabsContent>
          <TabsContent value="packages" className="mt-4">
            <PackagesTab />
          </TabsContent>
        </Tabs>
        <Toaster richColors position="top-right" />
      </div>
    </div>
  )
}

function CategoriesTab() {
  const [limit] = React.useState(20)
  const [offset, setOffset] = React.useState(0)
  const [search, setSearch] = React.useState("")

  const [data, setData] = React.useState<ServiceCategory[]>([])
  const [pagination, setPagination] = React.useState({ total: 0, limit: 20, offset: 0, hasMore: false })
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<ServiceCategory | null>(null)
  const [form, setForm] = React.useState<{ code: string; name: string; description?: string }>({ code: "", name: "", description: "" })
  const [submitting, setSubmitting] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [itemToDelete, setItemToDelete] = React.useState<ServiceCategory | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [manageServicesOpen, setManageServicesOpen] = React.useState(false)
  const [categoryToManage, setCategoryToManage] = React.useState<ServiceCategory | null>(null)
  const [categoryDetail, setCategoryDetail] = React.useState<ServiceCategoryDetail | null>(null)
  const [loadingCategoryDetail, setLoadingCategoryDetail] = React.useState(false)
  const [allServices, setAllServices] = React.useState<Service[]>([])
  const [selectedServiceId, setSelectedServiceId] = React.useState<string>("")
  const [addingService, setAddingService] = React.useState(false)
  const [removingServiceId, setRemovingServiceId] = React.useState<string | null>(null)
  const [serviceSearchQuery, setServiceSearchQuery] = React.useState<string>("")
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = React.useState(false)
  const serviceDropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
        setIsServiceDropdownOpen(false)
      }
    }
    if (isServiceDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isServiceDropdownOpen])

  const loadCategories = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await serviceCategoriesService.listCategories(limit, offset, search || undefined)
      setData(res.data.categories || [])
      setPagination(res.data.pagination)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [limit, offset, search])

  React.useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  const openCreate = () => {
    setEditing(null)
    setForm({ code: "", name: "", description: "" })
    setOpen(true)
  }

  const openEdit = (c: ServiceCategory & { description?: string | null }) => {
    setEditing(c)
    setForm({ code: c.code || "", name: c.name, description: c.description || "" })
    setOpen(true)
  }

  const onSubmit = async () => {
    if (!form.code || !form.name) {
      toast.error("Vui lòng nhập mã và tên danh mục")
      return
    }
    setSubmitting(true)
    try {
      if (editing) {
        await serviceCategoriesService.updateCategory(editing.id, form)
        toast.success("Cập nhật danh mục thành công")
      } else {
        await serviceCategoriesService.createCategory(form)
        toast.success("Tạo danh mục thành công")
      }
      setOpen(false)
      await loadCategories()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    } finally {
      setSubmitting(false)
    }
  }

  const openDeleteDialog = (c: ServiceCategory) => {
    setItemToDelete(c)
    setDeleteDialogOpen(true)
  }

  const onDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    try {
      await serviceCategoriesService.deleteCategory(itemToDelete.id)
      toast.success("Xóa danh mục thành công")
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      await loadCategories()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    } finally {
      setDeleting(false)
    }
  }

  const openManageServices = async (c: ServiceCategory) => {
    setCategoryToManage(c)
    setManageServicesOpen(true)
    setLoadingCategoryDetail(true)
    setSelectedServiceId("")
    try {
      const [categoryRes, servicesRes] = await Promise.all([
        serviceCategoriesService.getCategoryDetail(c.id),
        servicesService.listServices()
      ])
      setCategoryDetail(categoryRes.data)
      setAllServices(servicesRes.data.services || [])
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    } finally {
      setLoadingCategoryDetail(false)
    }
  }

  const onAddService = async () => {
    if (!selectedServiceId || !categoryToManage) return
    setAddingService(true)
    try {
      await serviceCategoriesService.addServiceToCategory(categoryToManage.id, selectedServiceId)
      toast.success("Thêm dịch vụ vào danh mục thành công")
      setSelectedServiceId("")
      setServiceSearchQuery("")
      setIsServiceDropdownOpen(false)
      // Reload category detail
      const categoryRes = await serviceCategoriesService.getCategoryDetail(categoryToManage.id)
      setCategoryDetail(categoryRes.data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    } finally {
      setAddingService(false)
    }
  }

  const onRemoveService = async (serviceId: string) => {
    if (!categoryToManage) return
    setRemovingServiceId(serviceId)
    try {
      await serviceCategoriesService.removeServiceFromCategory(categoryToManage.id, serviceId)
      toast.success("Xóa dịch vụ khỏi danh mục thành công")
      // Reload category detail
      const categoryRes = await serviceCategoriesService.getCategoryDetail(categoryToManage.id)
      setCategoryDetail(categoryRes.data)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    } finally {
      setRemovingServiceId(null)
    }
  }

  const availableServices = React.useMemo(() => {
    if (!categoryDetail) return allServices
    const existingServiceIds = new Set(categoryDetail.services.map(s => s.id))
    return allServices.filter(s => !existingServiceIds.has(s.id))
  }, [allServices, categoryDetail])

  const filteredAvailableServices = React.useMemo(() => {
    if (!serviceSearchQuery.trim()) return availableServices
    const query = serviceSearchQuery.toLowerCase()
    return availableServices.filter(s => 
      s.name.toLowerCase().includes(query) ||
      s.serviceCode?.toLowerCase().includes(query) ||
      s.specialty?.name.toLowerCase().includes(query)
    )
  }, [availableServices, serviceSearchQuery])

  const selectedService = React.useMemo(() => {
    return availableServices.find(s => s.id === selectedServiceId)
  }, [availableServices, selectedServiceId])

  const page = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(pagination.total / limit)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tìm kiếm danh mục..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-64"
          />
          <Button variant="outline" onClick={() => loadCategories()} disabled={loading}>
            <RefreshCw className="size-4" /> Làm mới
          </Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="size-4" /> Thêm danh mục
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Cập nhật danh mục" : "Thêm danh mục"}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-3">
              <div className="grid gap-2">
                <Label htmlFor="code">Mã danh mục *</Label>
                <Input id="code" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Tên danh mục *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" value={form.description || ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã danh mục</TableHead>
            <TableHead>Hành động</TableHead>
            <TableHead>Tên danh mục</TableHead>
            <TableHead>Mô tả</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((c) => (
            <TableRow key={c.id}>
              <TableCell>{c.code}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openManageServices(c)}>
                  <Settings className="size-4" /> Quản lý dịch vụ
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(c as ServiceCategory)}>
                  <Pencil className="size-4" /> Sửa
                </Button>
                <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(c)}>
                  <Trash2 className="size-4" /> Xóa
                </Button>
              </TableCell>
              <TableCell>{c.name}</TableCell>
              <TableCell>{(c as { description?: string }).description || "-"}</TableCell>
            </TableRow>
          ))}
          {loading && (
            <TableRow>
              <TableCell colSpan={4}>
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Đang tải...
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Bạn có chắc chắn muốn xóa danh mục <span className="font-semibold text-foreground">&quot;{itemToDelete?.name}&quot;</span>? Hành động này không thể hoàn tác.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting && <Loader2 className="size-4 animate-spin mr-2" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manageServicesOpen} onOpenChange={(open) => {
        setManageServicesOpen(open)
        if (!open) {
          setCategoryToManage(null)
          setCategoryDetail(null)
          setSelectedServiceId("")
          setRemovingServiceId(null)
          setServiceSearchQuery("")
          setIsServiceDropdownOpen(false)
        }
      }}>
        <DialogContent className="w-[40vw] max-w-[40vw] max-h-[90vh] overflow-y-auto" style={{ width: '40vw', maxWidth: '40vw' }}>
          <DialogHeader>
            <DialogTitle>Quản lý dịch vụ trong danh mục: {categoryToManage?.name}</DialogTitle>
          </DialogHeader>
          {loadingCategoryDetail ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Thêm dịch vụ vào danh mục</Label>
                <div className="relative" ref={serviceDropdownRef}>
                  <Input
                    value={serviceSearchQuery}
                    onChange={(e) => {
                      setServiceSearchQuery(e.target.value)
                      setIsServiceDropdownOpen(true)
                    }}
                    onFocus={() => setIsServiceDropdownOpen(true)}
                    placeholder={availableServices.length === 0 ? "Đã thêm tất cả dịch vụ" : "Tìm kiếm dịch vụ..."}
                    disabled={availableServices.length === 0}
                    className="w-full"
                  />
                  {isServiceDropdownOpen && filteredAvailableServices.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Mã</TableHead>
                            <TableHead>Tên dịch vụ</TableHead>
                            <TableHead>Chuyên khoa</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAvailableServices.map((s) => (
                            <TableRow
                              key={s.id}
                              className="cursor-pointer hover:bg-muted"
                              onClick={() => {
                                setSelectedServiceId(s.id)
                                setServiceSearchQuery(s.name)
                                setIsServiceDropdownOpen(false)
                              }}
                            >
                              <TableCell>{s.serviceCode}</TableCell>
                              <TableCell>{s.name}</TableCell>
                              <TableCell>{s.specialty?.name || "-"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                  {isServiceDropdownOpen && serviceSearchQuery && filteredAvailableServices.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg p-4 text-sm text-muted-foreground">
                      Không tìm thấy dịch vụ nào
                    </div>
                  )}
                </div>
                {selectedService && (
                  <div className="text-sm text-muted-foreground">
                    Đã chọn: {selectedService.name} ({selectedService.serviceCode})
                  </div>
                )}
                <Button 
                  onClick={onAddService} 
                  disabled={!selectedServiceId || addingService || availableServices.length === 0}
                  className="w-full"
                >
                  {addingService && <Loader2 className="size-4 animate-spin mr-2" />}
                  <Plus className="size-4" /> Thêm dịch vụ
                </Button>
              </div>

              <div className="border rounded-lg">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Danh sách dịch vụ trong danh mục</h3>
                </div>
                <div className="p-4">
                  {categoryDetail?.services && categoryDetail.services.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã</TableHead>
                          <TableHead>Tên dịch vụ</TableHead>
                          <TableHead>Chuyên khoa</TableHead>
                          <TableHead>Hành động</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {categoryDetail.services.map((s) => (
                          <TableRow key={s.id}>
                            <TableCell>{s.serviceCode}</TableCell>
                            <TableCell>{s.name}</TableCell>
                            <TableCell>{s.specialty?.name || "-"}</TableCell>
                            <TableCell>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => onRemoveService(s.id)}
                                disabled={removingServiceId === s.id}
                              >
                                {removingServiceId === s.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Trash2 className="size-4" />
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Chưa có dịch vụ nào trong danh mục này
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageServicesOpen(false)}>
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPrev={() => setOffset(Math.max(0, offset - limit))}
        onNext={() => setOffset(offset + limit)}
        hasMore={pagination.hasMore}
      />
    </div>
  )
}

function ServicesTab() {
  const [limit] = React.useState(20)
  const [offset, setOffset] = React.useState(0)
  const [filters, setFilters] = React.useState<{
    isActive?: string
    categoryId?: string
    specialtyId?: string
    requiresDoctor?: string
  }>({})

  const [data, setData] = React.useState<Service[]>([])
  const [pagination, setPagination] = React.useState({ total: 0, limit: 20, offset: 0, hasMore: false })
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [categories, setCategories] = React.useState<ServiceCategory[]>([])
  const [specialties, setSpecialties] = React.useState<Specialty[]>([])

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Service | null>(null)
  const [form, setForm] = React.useState<Partial<Service> & { categoryId?: string; specialtyId?: string }>({})
  const [submitting, setSubmitting] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [itemToDelete, setItemToDelete] = React.useState<Service | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const loadServices = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await servicesService.listServices({ limit, offset, ...filters })
      setData(res.data.services || [])
      setPagination(res.data.pagination)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [limit, offset, filters])

  React.useEffect(() => {
    void loadServices()
  }, [loadServices])

  React.useEffect(() => {
    void (async () => {
      try {
        const [catRes, specRes] = await Promise.all([
          serviceCategoriesService.listCategories(100),
          specialtiesService.listSpecialties(1, 100)
        ])
        setCategories(catRes.data.categories || [])
        setSpecialties(specRes.data || [])
      } catch (e) {
        console.error("Failed to load filters", e)
      }
    })()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({
      name: "",
      price: null,
      description: "",
      durationMinutes: null,
      isActive: true,
      unit: "1",
      currency: "VND",
      requiresDoctor: false,
      categoryId: undefined,
      specialtyId: undefined,
    })
    setOpen(true)
  }

  const openEdit = (s: Service) => {
    setEditing(s)
    setForm({
      name: s.name,
      price: s.price,
      description: s.description,
      durationMinutes: s.durationMinutes,
      isActive: s.isActive,
      unit: s.unit,
      currency: s.currency,
      requiresDoctor: s.requiresDoctor,
      categoryId: s.category?.id,
      specialtyId: s.specialty?.id,
    })
    setOpen(true)
  }

  const onSubmit = async () => {
    if (!form.name || !form.price) {
      toast.error("Vui lòng nhập tên và giá dịch vụ")
      return
    }
    setSubmitting(true)
    try {
      if (editing) {
        await servicesService.updateService(editing.id, { ...form, price: form.price ?? undefined, unit: "1", currency: "VND" })
        toast.success("Cập nhật dịch vụ thành công")
      } else {
        await servicesService.createService({ ...form, price: form.price ?? 0, unit: "1", currency: "VND" } as Parameters<typeof servicesService.createService>[0])
        toast.success("Tạo dịch vụ thành công")
      }
      setOpen(false)
      await loadServices()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    } finally {
      setSubmitting(false)
    }
  }

  const openDeleteDialog = (s: Service) => {
    setItemToDelete(s)
    setDeleteDialogOpen(true)
  }

  const onDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    try {
      await servicesService.deleteService(itemToDelete.id)
      toast.success("Xóa dịch vụ thành công")
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      await loadServices()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    } finally {
      setDeleting(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      isActive: undefined,
      categoryId: undefined,
      specialtyId: undefined,
      requiresDoctor: undefined,
    })
    setOffset(0)
  }

  const page = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(pagination.total / limit)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Danh mục</Label>
            <Select value={filters.categoryId} onValueChange={(v) => setFilters((f) => ({ ...f, categoryId: v || undefined }))}>
              <SelectTrigger className="min-w-48">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Khoa chuyên môn</Label>
            <Select value={filters.specialtyId} onValueChange={(v) => setFilters((f) => ({ ...f, specialtyId: v || undefined }))}>
              <SelectTrigger className="min-w-48">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Trạng thái</Label>
            <Select value={filters.isActive} onValueChange={(v) => setFilters((f) => ({ ...f, isActive: v || undefined }))}>
              <SelectTrigger className="min-w-32">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Hoạt động</SelectItem>
                <SelectItem value="false">Ngừng</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Chỉ định của bác sĩ</Label>
            <Select value={filters.requiresDoctor} onValueChange={(v) => setFilters((f) => ({ ...f, requiresDoctor: v || undefined }))}>
              <SelectTrigger className="min-w-32">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Cần</SelectItem>
                <SelectItem value="false">Không cần</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs opacity-0">Action</Label>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters}>Bỏ lọc</Button>
              <Button variant="outline" onClick={() => loadServices()} disabled={loading}>
                <RefreshCw className="size-4" /> Làm mới
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="size-4" /> Thêm dịch vụ
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Cập nhật dịch vụ" : "Thêm dịch vụ"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="name">Tên dịch vụ *</Label>
                <Input id="name" value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Giá *</Label>
                <Input id="price" type="number" value={form.price ?? ""} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="duration">Thời lượng (phút)</Label>
                <Input id="duration" type="number" value={form.durationMinutes ?? ""} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div className="grid gap-2">
                <Label>Danh mục</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Khoa</Label>
                <Select value={form.specialtyId} onValueChange={(v) => setForm((f) => ({ ...f, specialtyId: v }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn khoa" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" value={form.description || ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="isActive" checked={form.isActive ?? true} onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: !!checked }))} />
                <Label htmlFor="isActive">Hoạt động</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="requiresDoctor" checked={form.requiresDoctor ?? false} onCheckedChange={(checked) => setForm((f) => ({ ...f, requiresDoctor: !!checked }))} />
                <Label htmlFor="requiresDoctor">Cần chỉ định của bác sĩ</Label>
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Giá</TableHead>
            <TableHead>Danh mục</TableHead>
            <TableHead>Khoa</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Cần chỉ định của bác sĩ</TableHead>
            <TableHead>Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.serviceCode}</TableCell>
              <TableCell>{s.name}</TableCell>
              <TableCell>{s.price ? `${s.price.toLocaleString()} ${s.currency || "VND"}` : "-"}</TableCell>
              <TableCell>{s.category?.name || "-"}</TableCell>
              <TableCell>{s.specialty?.name || "-"}</TableCell>
              <TableCell>{s.isActive ? "Hoạt động" : "Ngừng"}</TableCell>
              <TableCell>{s.requiresDoctor ? "Cần" : "Không cần"}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                  <Pencil className="size-4" /> Sửa
                </Button>
                <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(s)}>
                  <Trash2 className="size-4" /> Xóa
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {loading && (
            <TableRow>
              <TableCell colSpan={8}>
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Đang tải...
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Bạn có chắc chắn muốn xóa dịch vụ <span className="font-semibold text-foreground">&quot;{itemToDelete?.name}&quot;</span>? Hành động này không thể hoàn tác.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting && <Loader2 className="size-4 animate-spin mr-2" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPrev={() => setOffset(Math.max(0, offset - limit))}
        onNext={() => setOffset(offset + limit)}
        hasMore={pagination.hasMore}
      />
    </div>
  )
}

function PackagesTab() {
  const [limit] = React.useState(20)
  const [offset, setOffset] = React.useState(0)
  const [filters, setFilters] = React.useState<{
    isActive?: string
    categoryId?: string
    specialtyId?: string
    requiresDoctor?: string
  }>({})

  const [data, setData] = React.useState<Package[]>([])
  const [pagination, setPagination] = React.useState({ total: 0, limit: 20, offset: 0, hasMore: false })
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [categories, setCategories] = React.useState<ServiceCategory[]>([])
  const [specialties, setSpecialties] = React.useState<Specialty[]>([])
  const [services, setServices] = React.useState<Service[]>([])

  const [open, setOpen] = React.useState(false)
  const [editing, setEditing] = React.useState<Package | null>(null)
  const [form, setForm] = React.useState<Partial<Package> & { categoryId?: string; specialtyId?: string }>({})
  const [submitting, setSubmitting] = React.useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [itemToDelete, setItemToDelete] = React.useState<Package | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  const loadPackages = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await packagesService.listPackages({ limit, offset, ...filters })
      setData(res.data.packages || [])
      setPagination(res.data.pagination)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }, [limit, offset, filters])

  React.useEffect(() => {
    void loadPackages()
  }, [loadPackages])

  React.useEffect(() => {
    void (async () => {
      try {
        const [catRes, specRes, svcRes] = await Promise.all([
          serviceCategoriesService.listCategories(100),
          specialtiesService.listSpecialties(1, 100),
          servicesService.listServices({ limit: 100 })
        ])
        setCategories(catRes.data.categories || [])
        setSpecialties(specRes.data || [])
        setServices(svcRes.data.services || [])
      } catch (e) {
        console.error("Failed to load filters", e)
      }
    })()
  }, [])

  const openCreate = () => {
    setEditing(null)
    setForm({
      name: "",
      description: "",
      price: null,
      isActive: true,
      requiresDoctor: false,
      categoryId: undefined,
      specialtyId: undefined,
      items: [],
    })
    setOpen(true)
  }

  const openEdit = (p: Package) => {
    setEditing(p)
    setForm({
      name: p.name,
      description: p.description,
      price: p.price,
      isActive: p.isActive,
      requiresDoctor: p.requiresDoctor,
      categoryId: p.category?.id,
      specialtyId: p.specialty?.id,
      items: p.items.map(item => ({
        serviceId: item.serviceId,
        quantity: item.quantity,
        priceOverride: item.priceOverride,
        required: item.required,
        sortOrder: item.sortOrder,
        notes: item.notes,
      })),
    })
    setOpen(true)
  }

  const addItem = () => {
    setForm((f) => ({
      ...f,
      items: [
        ...(f.items || []),
        {
          serviceId: "",
          quantity: 1,
          priceOverride: null,
          required: true,
          sortOrder: (f.items?.length || 0) + 1,
          notes: null,
        },
      ],
    }))
  }

  const removeItem = (index: number) => {
    setForm((f) => ({
      ...f,
      items: f.items?.filter((_, i) => i !== index) || [],
    }))
  }

  const updateItem = (index: number, updates: Partial<PackageItem>) => {
    setForm((f) => ({
      ...f,
      items: f.items?.map((item, i) => (i === index ? { ...item, ...updates } : item)) || [],
    }))
  }

  const onSubmit = async () => {
    if (!form.name || !form.price) {
      toast.error("Vui lòng nhập tên và giá gói")
      return
    }
    if (!form.items || form.items.length === 0) {
      toast.error("Vui lòng thêm ít nhất một dịch vụ vào gói")
      return
    }
    setSubmitting(true)
    try {
      if (editing) {
        await packagesService.updatePackage(editing.id, form as Parameters<typeof packagesService.updatePackage>[1])
        toast.success("Cập nhật gói thành công")
      } else {
        await packagesService.createPackage(form as Parameters<typeof packagesService.createPackage>[0])
        toast.success("Tạo gói thành công")
      }
      setOpen(false)
      await loadPackages()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    } finally {
      setSubmitting(false)
    }
  }

  const openDeleteDialog = (p: Package) => {
    setItemToDelete(p)
    setDeleteDialogOpen(true)
  }

  const onDelete = async () => {
    if (!itemToDelete) return
    setDeleting(true)
    try {
      await packagesService.deletePackage(itemToDelete.id)
      toast.success("Xóa gói thành công")
      setDeleteDialogOpen(false)
      setItemToDelete(null)
      await loadPackages()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi không xác định")
    } finally {
      setDeleting(false)
    }
  }

  const clearFilters = () => {
    setFilters({
      isActive: undefined,
      categoryId: undefined,
      specialtyId: undefined,
      requiresDoctor: undefined,
    })
    setOffset(0)
  }

  const page = Math.floor(offset / limit) + 1
  const totalPages = Math.ceil(pagination.total / limit)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Danh mục</Label>
            <Select value={filters.categoryId} onValueChange={(v) => setFilters((f) => ({ ...f, categoryId: v || undefined }))}>
              <SelectTrigger className="min-w-48">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Khoa chuyên môn</Label>
            <Select value={filters.specialtyId} onValueChange={(v) => setFilters((f) => ({ ...f, specialtyId: v || undefined }))}>
              <SelectTrigger className="min-w-48">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                {specialties.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Trạng thái</Label>
            <Select value={filters.isActive} onValueChange={(v) => setFilters((f) => ({ ...f, isActive: v || undefined }))}>
              <SelectTrigger className="min-w-32">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Hoạt động</SelectItem>
                <SelectItem value="false">Ngừng</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Chỉ định của bác sĩ</Label>
            <Select value={filters.requiresDoctor} onValueChange={(v) => setFilters((f) => ({ ...f, requiresDoctor: v || undefined }))}>
              <SelectTrigger className="min-w-32">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Cần</SelectItem>
                <SelectItem value="false">Không cần</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs opacity-0">Action</Label>
            <div className="flex gap-2">
              <Button variant="outline" onClick={clearFilters}>Bỏ lọc</Button>
              <Button variant="outline" onClick={() => loadPackages()} disabled={loading}>
                <RefreshCw className="size-4" /> Làm mới
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}>
              <Plus className="size-4" /> Thêm gói
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Cập nhật gói" : "Thêm gói"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="name">Tên gói *</Label>
                <Input id="name" value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="price">Giá *</Label>
                <Input id="price" type="number" value={form.price ?? ""} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value ? Number(e.target.value) : null }))} />
              </div>
              <div className="grid gap-2">
                <Label>Danh mục</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Khoa</Label>
                <Select value={form.specialtyId} onValueChange={(v) => setForm((f) => ({ ...f, specialtyId: v }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn khoa" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 grid gap-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea id="description" value={form.description || ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="isActive" checked={form.isActive ?? true} onCheckedChange={(checked) => setForm((f) => ({ ...f, isActive: !!checked }))} />
                <Label htmlFor="isActive">Hoạt động</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="requiresDoctor" checked={form.requiresDoctor ?? false} onCheckedChange={(checked) => setForm((f) => ({ ...f, requiresDoctor: !!checked }))} />
                <Label htmlFor="requiresDoctor">Cần chỉ định của bác sĩ</Label>
              </div>

              <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <Label>Dịch vụ trong gói *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addItem}>
                    <Plus className="size-4" /> Thêm dịch vụ
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  {(form.items || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                      <Select value={item.serviceId} onValueChange={(v) => updateItem(idx, { serviceId: v })}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Chọn dịch vụ" />
                        </SelectTrigger>
                        <SelectContent>
                          {services.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name} ({s.serviceCode})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="SL"
                        className="w-20"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, { quantity: Number(e.target.value) || 1 })}
                      />
                      <Input
                        type="number"
                        placeholder="Giá ghi đè"
                        className="w-32"
                        value={item.priceOverride ?? ""}
                        onChange={(e) => updateItem(idx, { priceOverride: e.target.value ? Number(e.target.value) : null })}
                      />
                      <div className="flex items-center gap-1">
                        <Checkbox
                          checked={item.required}
                          onCheckedChange={(checked) => updateItem(idx, { required: !!checked })}
                        />
                        <span className="text-xs">Bắt buộc</span>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
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

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã</TableHead>
            <TableHead>Tên</TableHead>
            <TableHead>Giá</TableHead>
            <TableHead>Số dịch vụ</TableHead>
            <TableHead>Danh mục</TableHead>
            <TableHead>Khoa</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Chỉ định của bác sĩ</TableHead>
            <TableHead>Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.code}</TableCell>
              <TableCell>{p.name}</TableCell>
              <TableCell>{p.price ? `${p.price.toLocaleString()} VND` : "Tính từ DV"}</TableCell>
              <TableCell>{p.items.length}</TableCell>
              <TableCell>{p.category?.name || "-"}</TableCell>
              <TableCell>{p.specialty?.name || "-"}</TableCell>
              <TableCell>{p.isActive ? "Hoạt động" : "Ngừng"}</TableCell>
              <TableCell>{p.requiresDoctor ? "Có" : "Không"}</TableCell>
              <TableCell className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                  <Pencil className="size-4" /> Sửa
                </Button>
                <Button variant="destructive" size="sm" onClick={() => openDeleteDialog(p)}>
                  <Trash2 className="size-4" /> Xóa
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {loading && (
            <TableRow>
              <TableCell colSpan={9}>
                <div className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Đang tải...
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Bạn có chắc chắn muốn xóa gói <span className="font-semibold text-foreground">&quot;{itemToDelete?.name}&quot;</span>? Hành động này không thể hoàn tác.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting && <Loader2 className="size-4 animate-spin mr-2" />}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPrev={() => setOffset(Math.max(0, offset - limit))}
        onNext={() => setOffset(offset + limit)}
        hasMore={pagination.hasMore}
      />
    </div>
  )
}

function PaginationControls({
  page,
  totalPages,
  onPrev,
  onNext,
  hasMore,
}: {
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
  hasMore: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="text-sm text-muted-foreground">
        Trang {page}/{totalPages || 1}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onPrev} disabled={page <= 1}>
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="outline" size="sm" onClick={onNext} disabled={!hasMore}>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}

