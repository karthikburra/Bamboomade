import React, { useState } from 'react';
import { Helmet } from 'react-helmet';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Import Admin Components
import AdminTabs from '@/components/AdminTabs';

// Import AI Components
import KnowledgeCompanion from '@/components/KnowledgeCompanion';

const AIKnowledgeManagement: React.FC = () => {
  const [companionOpen, setCompanionOpen] = useState(true);

  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>AI Knowledge Management | Bamboo Made</title>
      </Helmet>

      <AdminTabs activeTab="ai-knowledge" />

      <div className="mt-8">
        <Card className="w-full mb-8">
          <CardHeader>
            <CardTitle>Knowledge Companion</CardTitle>
            <CardDescription>
              Add and manage knowledge for the AI through a conversational interface.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4">
              <KnowledgeCompanion />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AIKnowledgeManagement;