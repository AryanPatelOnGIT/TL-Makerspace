import React from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import AppLayout from '@/components/layout/AppLayout'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { lazyWithRetry } from '@/lib/lazy'

const LoginPage = lazyWithRetry(() => import('@/features/auth/LoginPage'))
const OnboardingPage = lazyWithRetry(() => import('@/features/auth/OnboardingPage'))
const ProfilePage = lazyWithRetry(() => import('@/features/profile/ProfilePage'))
const DashboardPage = lazyWithRetry(() => import('@/features/dashboard/DashboardPage'))
const EquipmentListPage = lazyWithRetry(() => import('@/features/equipment/EquipmentListPage'))
const EquipmentDetailPage = lazyWithRetry(() => import('@/features/equipment/EquipmentDetailPage'))
const EquipmentFormPage = lazyWithRetry(() => import('@/features/equipment/EquipmentFormPage'))
const BookingCalendarPage = lazyWithRetry(() => import('@/features/bookings/BookingCalendarPage'))
const BookingFormPage = lazyWithRetry(() => import('@/features/bookings/BookingFormPage'))
const BookingDetailPage = lazyWithRetry(() => import('@/features/bookings/BookingDetailPage'))
const InventoryListPage = lazyWithRetry(() => import('@/features/inventory/InventoryListPage'))
const InventoryDetailPage = lazyWithRetry(() => import('@/features/inventory/InventoryDetailPage'))
const InventoryFormPage = lazyWithRetry(() => import('@/features/inventory/InventoryFormPage'))
const CheckoutPage = lazyWithRetry(() => import('@/features/inventory/CheckoutPage'))
const ToolCheckoutPage = lazyWithRetry(() => import('@/features/checkout/ToolCheckoutPage'))
const ToolCheckoutListPage = lazyWithRetry(() => import('@/features/checkout/ToolCheckoutListPage'))
const MaintenanceListPage = lazyWithRetry(() => import('@/features/maintenance/MaintenanceListPage'))
const MaintenanceDetailPage = lazyWithRetry(() => import('@/features/maintenance/MaintenanceDetailPage'))
const MaintenanceFormPage = lazyWithRetry(() => import('@/features/maintenance/MaintenanceFormPage'))
const WorkshopListPage = lazyWithRetry(() => import('@/features/workshops/WorkshopListPage'))
const WorkshopDetailPage = lazyWithRetry(() => import('@/features/workshops/WorkshopDetailPage'))
const WorkshopFormPage = lazyWithRetry(() => import('@/features/workshops/WorkshopFormPage'))
const ProjectListPage = lazyWithRetry(() => import('@/features/projects/ProjectListPage'))
const ProjectDetailPage = lazyWithRetry(() => import('@/features/projects/ProjectDetailPage'))
const ProjectFormPage = lazyWithRetry(() => import('@/features/projects/ProjectFormPage'))
const NotificationsPage = lazyWithRetry(() => import('@/features/notifications/NotificationsPage'))
const ReportsPage = lazyWithRetry(() => import('@/features/reports/ReportsPage'))
const IssueFormPage = lazyWithRetry(() => import('@/features/issues/IssueFormPage'))
const AdminDashboard = lazyWithRetry(() => import('@/features/admin/AdminDashboard'))
const AdminUsersPage = lazyWithRetry(() => import('@/features/admin/AdminUsersPage'))
const AdminBookingsPage = lazyWithRetry(() => import('@/features/admin/AdminBookingsPage'))
const AdminProjectsPage = lazyWithRetry(() => import('@/features/admin/AdminProjectsPage'))
const AdminProjectDetailPage = lazyWithRetry(() => import('@/features/admin/AdminProjectDetailPage'))
const AdminInventoryPage = lazyWithRetry(() => import('@/features/admin/AdminInventoryPage'))
const AdminIssuesPage = lazyWithRetry(() => import('@/features/admin/AdminIssuesPage'))
const AdminAnnouncementsPage = lazyWithRetry(() => import('@/features/admin/AdminAnnouncementsPage'))
const AdminEquipmentPage     = lazyWithRetry(() => import('@/features/admin/AdminEquipmentPage'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingSpinner fullScreen />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (!profile || !profile.contact) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingSpinner fullScreen />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (!profile || !profile.contact) return <Navigate to="/onboarding" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return <>{children}</>
}

function OnboardingRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <LoadingSpinner fullScreen />
  if (!user) return <Navigate to="/login" replace />
  if (profile?.contact && window.location.pathname === '/onboarding') return <Navigate to="/profile" replace />
  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, profile, authReady } = useAuth()
  if (!authReady) return <>{children}</>
  if (user) {
    if (!profile || !profile.contact) return <Navigate to="/onboarding" replace />
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}

export default function AppRoutes() {
  return (
    <React.Suspense fallback={<LoadingSpinner fullScreen />}>
      <Routes>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<Navigate to="/login" replace />} />
        <Route path="/onboarding" element={<OnboardingRoute><OnboardingPage /></OnboardingRoute>} />

        <Route element={<OnboardingRoute><AppLayout /></OnboardingRoute>}>
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/" element={<DashboardPage />} />

          <Route path="/equipment" element={<EquipmentListPage />} />
          <Route path="/equipment/:id" element={<EquipmentDetailPage />} />
          <Route path="/equipment/new" element={<EquipmentFormPage />} />
          <Route path="/equipment/:id/edit" element={<EquipmentFormPage />} />

          <Route path="/bookings" element={<BookingCalendarPage />} />
          <Route path="/bookings/new" element={<BookingFormPage />} />
          <Route path="/bookings/:projectId/:id" element={<BookingDetailPage />} />

          <Route path="/inventory" element={<InventoryListPage />} />
          <Route path="/inventory/:id" element={<InventoryDetailPage />} />
          <Route path="/inventory/new" element={<InventoryFormPage />} />
          <Route path="/inventory/:id/edit" element={<InventoryFormPage />} />
          <Route path="/checkout" element={<ToolCheckoutPage />} />
          <Route path="/checkout/history" element={<ToolCheckoutListPage />} />
          <Route path="/stock/checkout" element={<CheckoutPage />} />

          <Route path="/maintenance" element={<MaintenanceListPage />} />
          <Route path="/maintenance/:id" element={<MaintenanceDetailPage />} />
          <Route path="/maintenance/new" element={<MaintenanceFormPage />} />
          <Route path="/maintenance/:id/edit" element={<MaintenanceFormPage />} />

          <Route path="/workshops" element={<WorkshopListPage />} />
          <Route path="/workshops/:id" element={<WorkshopDetailPage />} />
          <Route path="/workshops/new" element={<WorkshopFormPage />} />
          <Route path="/workshops/:id/edit" element={<WorkshopFormPage />} />

          <Route path="/projects" element={<ProjectListPage />} />
          <Route path="/projects/new" element={<ProjectFormPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/projects/:id/edit" element={<ProjectFormPage />} />

          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/report-issue" element={<IssueFormPage />} />

          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
          <Route path="/admin/bookings" element={<AdminRoute><AdminBookingsPage /></AdminRoute>} />
          <Route path="/admin/projects" element={<AdminRoute><AdminProjectsPage /></AdminRoute>} />
          <Route path="/admin/projects/:id" element={<AdminRoute><AdminProjectDetailPage /></AdminRoute>} />
          <Route path="/admin/inventory" element={<AdminRoute><AdminInventoryPage /></AdminRoute>} />
          <Route path="/admin/issues" element={<AdminRoute><AdminIssuesPage /></AdminRoute>} />
          <Route path="/admin/announcements" element={<AdminRoute><AdminAnnouncementsPage /></AdminRoute>} />
          <Route path="/admin/equipment"     element={<AdminRoute><AdminEquipmentPage     /></AdminRoute>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </React.Suspense>
  )
}
