import React from 'react';
import { Helmet } from 'react-helmet';

// UI Components
import { TabsContent } from "@/components/ui/tabs";

// Import Admin Components
import AdminTabs from '@/components/AdminTabs';

// Import AI Components
import KnowledgeCompanion from '@/components/KnowledgeCompanion';

const AIKnowledgeManagement: React.FC = () => {
  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 bg-gray-950 min-h-screen">
      <Helmet>
        <title>AI Knowledge Management | Bamboo Made</title>
      </Helmet>

      <AdminTabs value="knowledge">
        <TabsContent value="knowledge" className="mt-3 sm:mt-6">
          <div className="w-full max-w-full sm:max-w-4xl mx-auto">
            <KnowledgeCompanion 
              initialMessage="Welcome to the Knowledge Management interface. You can add content to the knowledge base by sharing information with me, or paste a website URL to automatically extract and add its content. What would you like to add today?"
            />
          </div>
        </TabsContent>
      </AdminTabs>
    </div>
  );
};

export default AIKnowledgeManagement;