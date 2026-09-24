import { lazy, Suspense, useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui';
import { ErrorBoundary, Loading } from '@/components/PageBoundary';
import Launcher from '@/pages/Launcher';
import NotFound from '@/pages/NotFound';
import PortalLogin from '@/pages/portal/Login';
import PortalLayout from '@/layouts/PortalLayout';

const Dashboard = lazy(() => import('@/pages/portal/Dashboard'));
const LiveView = lazy(() => import('@/pages/portal/LiveView'));
const Incidents = lazy(() => import('@/pages/portal/Incidents'));
const Unregistered = lazy(() => import('@/pages/portal/Unregistered'));
const Search = lazy(() => import('@/pages/portal/Search'));
const Visitors = lazy(() => import('@/pages/portal/Visitors'));
const Vehicles = lazy(() => import('@/pages/portal/Vehicles'));
const Permits = lazy(() => import('@/pages/portal/Permits'));
const Residents = lazy(() => import('@/pages/portal/Residents'));
const Watchlist = lazy(() => import('@/pages/portal/Watchlist'));
const Guards = lazy(() => import('@/pages/portal/Guards'));
const Community = lazy(() => import('@/pages/portal/Community'));
const Reports = lazy(() => import('@/pages/portal/Reports'));
const Rules = lazy(() => import('@/pages/portal/Rules'));
const Privacy = lazy(() => import('@/pages/portal/Privacy'));

const GuardLayout = lazy(() => import('@/layouts/GuardLayout'));
const GuardLogin = lazy(() => import('@/pages/guard/GuardLogin'));
const GuardHome = lazy(() => import('@/pages/guard/Home'));
const GuardAlerts = lazy(() => import('@/pages/guard/Alerts'));
const GuardWalkIn = lazy(() => import('@/pages/guard/WalkIn'));
const GuardVerify = lazy(() => import('@/pages/guard/Verify'));
const GuardParcels = lazy(() => import('@/pages/guard/Parcels'));
const GuardPatrol = lazy(() => import('@/pages/guard/Patrol'));
const GuardReport = lazy(() => import('@/pages/guard/Report'));

const ResidentLayout = lazy(() => import('@/layouts/ResidentLayout'));
const ResLogin = lazy(() => import('@/pages/resident/Login'));
const ResHome = lazy(() => import('@/pages/resident/Home'));
const ResInvite = lazy(() => import('@/pages/resident/Invite'));
const ResPass = lazy(() => import('@/pages/resident/Pass'));
const ResApproval = lazy(() => import('@/pages/resident/Approval'));
const ResVisitors = lazy(() => import('@/pages/resident/Visitors'));
const ResParcels = lazy(() => import('@/pages/resident/Parcels'));
const ResBook = lazy(() => import('@/pages/resident/Book'));
const ResSOS = lazy(() => import('@/pages/resident/SOS'));
const ResActivity = lazy(() => import('@/pages/resident/Activity'));
const ResUnit = lazy(() => import('@/pages/resident/Unit'));
const ResFace = lazy(() => import('@/pages/resident/Face'));
const ResRenovation = lazy(() => import('@/pages/resident/Renovation'));
const ResBilling = lazy(() => import('@/pages/resident/Billing'));

const VisitorPass = lazy(() => import('@/pages/visitor/VisitorPass'));
const VisitorSelfie = lazy(() => import('@/pages/visitor/VisitorSelfie'));
const CourierPass = lazy(() => import('@/pages/visitor/CourierPass'));

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Launcher />} />
            <Route path="/login" element={<PortalLogin />} />
            <Route path="/portal" element={<PortalLayout />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="live" element={<LiveView />} />
              <Route path="incidents" element={<Incidents />} />
              <Route path="incidents/:id" element={<Incidents />} />
              <Route path="unregistered" element={<Unregistered />} />
              <Route path="search" element={<Search />} />
              <Route path="visitors" element={<Visitors />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="permits" element={<Permits />} />
              <Route path="residents" element={<Residents />} />
              <Route path="residents/:unit" element={<Residents />} />
              <Route path="watchlist" element={<Watchlist />} />
              <Route path="guards" element={<Guards />} />
              <Route path="community" element={<Community />} />
              <Route path="reports" element={<Reports />} />
              <Route path="rules" element={<Rules />} />
              <Route path="privacy" element={<Privacy />} />
              <Route path="*" element={<Navigate to="dashboard" replace />} />
            </Route>

            <Route path="/guard/login" element={<GuardLogin />} />
            <Route path="/guard" element={<GuardLayout />}>
              <Route index element={<GuardHome />} />
              <Route path="alerts" element={<GuardAlerts />} />
              <Route path="alerts/:id" element={<GuardAlerts />} />
              <Route path="walk-in" element={<GuardWalkIn />} />
              <Route path="verify" element={<GuardVerify />} />
              <Route path="parcels" element={<GuardParcels />} />
              <Route path="patrol" element={<GuardPatrol />} />
              <Route path="report" element={<GuardReport />} />
              <Route path="*" element={<Navigate to="/guard" replace />} />
            </Route>

            <Route path="/app/login" element={<ResLogin />} />
            <Route path="/app/sos" element={<ResSOS />} />
            <Route path="/app/approval/:id" element={<ResApproval />} />
            <Route path="/app" element={<ResidentLayout />}>
              <Route index element={<ResHome />} />
              <Route path="invite" element={<ResInvite />} />
              <Route path="pass/:id" element={<ResPass />} />
              <Route path="visitors" element={<ResVisitors />} />
              <Route path="parcels" element={<ResParcels />} />
              <Route path="book" element={<ResBook />} />
              <Route path="activity" element={<ResActivity />} />
              <Route path="unit" element={<ResUnit />} />
              <Route path="face" element={<ResFace />} />
              <Route path="renovation" element={<ResRenovation />} />
              <Route path="billing" element={<ResBilling />} />
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Route>

            <Route path="/v/:id" element={<VisitorPass />} />
            <Route path="/v/:id/selfie" element={<VisitorSelfie />} />
            <Route path="/d/:code" element={<CourierPass />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      <Toaster />
    </>
  );
}
