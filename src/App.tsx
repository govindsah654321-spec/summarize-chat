import { AppProvider, useApp } from '@/context/AppContext';
import { Layout } from '@/components/Layout';
import { Onboarding } from '@/pages/Onboarding';
import { Dashboard } from '@/pages/Dashboard';
import { AIBuddyPage, FloatingBuddyButton } from '@/pages/AIBuddyPage';
import { ConversationsPage } from '@/pages/ConversationsPage';
import { StudentLifePage } from '@/pages/StudentLifePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PrivacyPage } from '@/pages/PrivacyPage';

function AppContent() {
  const { onboarded, currentPage, setCurrentPage } = useApp();

  if (!onboarded) {
    return <Onboarding />;
  }

  return (
    <>
      <Layout>
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'aibuddy' && <AIBuddyPage />}
        {currentPage === 'conversations' && <ConversationsPage />}
        {currentPage === 'studentlife' && <StudentLifePage />}
        {currentPage === 'settings' && <SettingsPage />}
        {currentPage === 'privacy' && <PrivacyPage />}
      </Layout>
      {currentPage !== 'aibuddy' && (
        <FloatingBuddyButton onClick={() => setCurrentPage('aibuddy')} />
      )}
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
