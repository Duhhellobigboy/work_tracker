import React from 'react';
import dynamic from 'next/dynamic';
import Head from 'next/head';

// We need to import the Layout component. 
// Based on the plan it should be at ../components/layout/Layout
// Let me verify its existence first.
import DashboardLayout from '../components/layout/DashboardLayout';

const CopilotPanel = dynamic(
  () => import('../components/copilot/CopilotPanel'),
  { ssr: false }
);

export default function CopilotToolsPage({ session }) {
  return (
    <>
      <Head>
        <title>Copilot Assistant | Work Tracker</title>
        <meta name="description" content="Deterministic prompt orchestration for Microsoft Copilot contract analysis." />
        <meta name="referrer" content="no-referrer" />
      </Head>
      
      <DashboardLayout session={session} mainClassName="max-w-7xl mx-auto px-4 py-8">
        <CopilotPanel />
      </DashboardLayout>
    </>
  );
}
