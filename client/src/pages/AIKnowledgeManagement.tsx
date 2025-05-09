import React from 'react';
import { Helmet } from 'react-helmet';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";

// Import Admin Components
import AdminTabs from '@/components/AdminTabs';

// Import AI Components
import KnowledgeCompanion from '@/components/KnowledgeCompanion';

const AIKnowledgeManagement: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Helmet>
        <title>AI Knowledge Management | Bamboo Made</title>
      </Helmet>

      <AdminTabs value="knowledge">
        <TabsContent value="knowledge" className="mt-6">
          <KnowledgeCompanion 
            initialMessage="Welcome to the Knowledge Management interface. You can add content to the knowledge base by sharing information with me, or paste a website URL to automatically extract and add its content. What would you like to add today?"
          />
        </TabsContent>
      </AdminTabs>
    </div>
  );
};

export default AIKnowledgeManagement;