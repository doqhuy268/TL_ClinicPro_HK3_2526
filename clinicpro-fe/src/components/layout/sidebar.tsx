"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import {
	CalendarDays,
	CreditCard,
	FileTextIcon,
	Home,
	Hospital,
	IdCardLanyardIcon,
	Library,
	Stethoscope,
	Users,
	ClipboardList,
	HandHelping,
	ConciergeBell,
	Contact,
	Settings,
	Backpack,
} from "lucide-react";

import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarHeader,
	SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/hooks/useAuth";

// Menu items with role requirements and primary color styling
const getMenuItems = () => {
	const baseItems = [
		{
			title: "Dashboard",
			url: "/dashboard",
			icon: Home,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: undefined,
		},
		{
			title: "Lịch",
			url: "/calendar",
			icon: CalendarDays,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: ["ADMIN", "DOCTOR","TECHNICIAN"],
		},
		// {
		// 	title: "Báo cáo",
		// 	url: "/reports",
		// 	icon: ChartColumn,
		// 	color: "text-primary",
		// 	bgColor: "bg-primary/10",
		// 	roles: ["ADMIN", "DOCTOR"],
		// },
		// Receptionist: dedicated create-prescription screen replaces Reports
		{
			title: "Tạo phiếu chỉ định",
			url: "/reception/prescription",
			icon: ClipboardList,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: ["RECEPTIONIST", "DOCTOR"],
		},
		{
			title: "Bệnh án & Đơn thuốc",
			url: "/medical-records",
			icon: Library,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: [ "DOCTOR" ],
		},
		{
			title: "Hồ sơ bệnh nhân",
			url: "/reception/patients",
			icon: Contact,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: ["RECEPTIONIST"],
		},
		{
			title: "Thanh toán dịch vụ",
			url: "/invoices",
			icon: CreditCard,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: ["CASHIER"],
		},
		{
			title: "Xử lý dịch vụ",
			url: "/service-processing",
			icon: FileTextIcon,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: ["DOCTOR", "TECHNICIAN"],
		},
		{
			title: "Quản lý lịch hẹn",
			url: "/appointment-booking",
			icon: Backpack,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: [ "DOCTOR"],
		},
		{
			title: "Màn hình tiếp nhận",
			url: "/reception",
			icon: ConciergeBell,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: ["RECEPTIONIST"],
		},
		{
			title: "Quản lý người dùng",
			url: "/users",
			icon: Users,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: ["ADMIN", "RECEPTIONIST"],
		},
		{
			title: "Quản lý dịch vụ",
			url: "/services",
			icon: Stethoscope,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: ["ADMIN"],
		},
		{
			title: "Quản lý nhân sự",
			url: "/staffs",
			icon: IdCardLanyardIcon,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: ["ADMIN"],
		},
		{
			title: "Quản lý cơ sở",
			url: "/facilities",
			icon: Hospital,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: ["ADMIN"],
		},
		{
			title: "Bài viết",
			url: "/posts-management",
			icon: FileTextIcon,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: ["ADMIN"],
		},
		{
			title: "Chekin dịch vụ",
			url: "/support-serving",
			icon: HandHelping,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: ["RECEPTIONIST"],
		},
		{
			title: "Cấu hình hệ thống",
			url: "/system-settings",
			icon: Settings,
			color: "text-primary",
			bgColor: "bg-primary/10",
			roles: ["ADMIN"],
		},
		
	];


	return baseItems;
};

export function AppSidebar() {
	const pathname = usePathname();
	const { user, isAuthenticated } = useAuth();
	const currentRole = user?.role;

	const items = getMenuItems().filter((item) => {
		if (!item.roles) return true;
		if (!isAuthenticated) return false;
		return currentRole ? item.roles.includes(currentRole) : false;
	});

	const getRoleBadge = () => {
		switch (currentRole) {
			case 'ADMIN': return { label: 'Quản trị', color: 'bg-amber-100 text-amber-700' };
			case 'DOCTOR': return { label: 'Bác sĩ', color: 'bg-emerald-100 text-emerald-700' };
			case 'RECEPTIONIST': return { label: 'Lễ tân', color: 'bg-sky-100 text-sky-700' };
			case 'CASHIER': return { label: 'Thu ngân', color: 'bg-violet-100 text-violet-700' };
			case 'TECHNICIAN': return { label: 'Kỹ thuật', color: 'bg-rose-100 text-rose-700' };
			default: return { label: 'Người dùng', color: 'bg-gray-100 text-gray-700' };
		}
	};

	const roleBadge = getRoleBadge();

	return (
		<Sidebar className="w-[220px] h-full bg-white border-r border-slate-100">
			{/* Premium Logo Section */}
			<SidebarHeader className="px-5 py-6 border-b border-slate-100">
				<Link href="/dashboard" className="flex items-center gap-3 group">
					<div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-shadow">
						<Image 
							src="/logos/LogoClinicPro-v1-noneBG.png" 
							alt="Logo" 
							width={28} 
							height={28}
							className="brightness-0 invert"
						/>
					</div>
					<div className="flex flex-col">
						<span className="text-base font-bold text-slate-800 tracking-tight">ClinicPro</span>
						<span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Healthcare</span>
					</div>
				</Link>
			</SidebarHeader>

			{/* User Badge */}
			{isAuthenticated && user && (
				<div className="px-4 py-3">
					<div className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-2.5">
						<div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
							{user.name?.charAt(0)?.toUpperCase() || 'U'}
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-xs font-semibold text-slate-700 truncate">{user.name}</p>
							<span className={cn("inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold mt-0.5", roleBadge.color)}>
								{roleBadge.label}
							</span>
						</div>
					</div>
				</div>
			)}

			{/* Navigation */}
			<SidebarContent className="px-3 py-2">
				<SidebarGroup>
					<p className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
						Điều hướng
					</p>
					<SidebarGroupContent>
						<SidebarMenu className="w-full space-y-0.5">
							{items.map((item) => {
								const isActive =
									item.url === "/"
										? pathname === "/"
										: item.url.startsWith("/admin")
										? pathname.startsWith(item.url)
										: pathname === item.url;

								return (
									<SidebarMenuItem key={`${item.title}-${item.url}`}>
										<SidebarMenuButton
											asChild
											className={cn(
												"h-10 rounded-xl transition-all duration-200",
												isActive 
													? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md shadow-teal-500/20 hover:shadow-teal-500/30" 
													: "hover:bg-slate-50 text-slate-600 hover:text-slate-900"
											)}
											isActive={isActive}
										>
											<Link
												href={item.url}
												className="flex flex-row items-center gap-3 w-full px-3"
											>
												<item.icon className={cn(
													"w-4 h-4 shrink-0",
													isActive ? "text-white" : "text-slate-400"
												)} />
												<span
													className={cn(
														"text-[13px] font-medium truncate",
														isActive ? "text-white font-semibold" : "text-slate-600",
													)}
												>
													{item.title}
												</span>
												{isActive && (
													<div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
												)}
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			{/* Footer */}
			<SidebarFooter className="border-t border-slate-100 px-4 py-3">
				<div className="flex items-center gap-2 text-[10px] text-slate-400">
					<div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
					<span>ClinicPro v2.0 · Online</span>
				</div>
			</SidebarFooter>
		</Sidebar>
	);
}

