import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import ChatSidebar, { ChatFolder, ChatHistoryItem } from './ChatSidebar';
import KnowledgeCompanion from './KnowledgeCompanion';

interface KnowledgeAssistantLayoutProps {
  initialMessage?: string;
}

const KnowledgeAssistantLayout: React.FC<KnowledgeAssistantLayoutProps> = ({
  initialMessage = "Welcome to the Knowledge Management interface. You can add content to the knowledge base by sharing information with me, or paste a website URL to automatically extract and add its content. What would you like to add today?"
}) => {
  const [folders, setFolders] = useState<ChatFolder[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { toast } = useToast();

  // Fetch folders when component mounts
  useEffect(() => {
    fetchFolders();
  }, []);

  // Function to fetch folders from the API
  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/chat/folders');
      
      if (response.ok) {
        const foldersData = await response.json();
        
        // Mark selected folder if any
        const formattedFolders = foldersData.map((folder: any) => ({
          ...folder,
          selected: folder.id === selectedFolderId
        }));
        
        setFolders(formattedFolders);
      } else {
        console.error('Failed to fetch chat folders');
        toast({
          title: 'Error',
          description: 'Failed to load folders. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching chat folders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load folders. Please check your connection.',
        variant: 'destructive',
      });
    }
  };

  // Handle folder selection
  const handleFolderSelect = (folderId: number) => {
    setSelectedFolderId(folderId);
    
    // Update folder UI to highlight the selected folder
    setFolders(prev => 
      prev.map(folder => ({
        ...folder,
        selected: folder.id === folderId
      }))
    );
    
    // You would typically load chat messages for this folder here
  };

  // Handle creating a new chat
  const handleNewChat = () => {
    // Reset the selection
    setSelectedFolderId(null);
    
    // Update folder UI to remove highlight
    setFolders(prev => 
      prev.map(folder => ({
        ...folder,
        selected: false
      }))
    );
    
    // You would typically reset the chat history here
  };

  // Handle creating a new folder
  const handleNewFolder = async () => {
    try {
      // This would typically open a dialog to enter folder details
      // and then make an API call to create the folder
      toast({
        title: 'Creating Folder',
        description: 'This functionality will be implemented soon.',
      });
      
      // After creating folder, refresh the folder list
      await fetchFolders();
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: 'Error',
        description: 'Failed to create folder. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] overflow-hidden bg-gray-950 rounded-lg border border-gray-800">
      {/* Sidebar - hidden on mobile unless open */}
      <div className={`
        ${isMobileSidebarOpen ? 'fixed inset-0 z-50 block w-full sm:hidden' : 'hidden sm:block'}
        sm:relative sm:w-64 sm:flex-shrink-0
      `}>
        <ChatSidebar
          folders={folders}
          chatHistory={chatHistory}
          onFolderSelect={handleFolderSelect}
          onNewChat={handleNewChat}
          onNewFolder={handleNewFolder}
          className="h-full"
        />
      </div>

      {/* Mobile sidebar backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 sm:hidden" 
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header with menu button */}
        <div className="sm:hidden flex items-center justify-between p-2 border-b border-gray-800">
          <button 
            onClick={() => setIsMobileSidebarOpen(true)}
            className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="font-semibold text-white">Knowledge Assistant</h1>
          <div className="w-10"></div> {/* Spacer for centering title */}
        </div>

        {/* Knowledge Companion Component */}
        <div className="flex-1 overflow-hidden">
          <KnowledgeCompanion 
            initialMessage={initialMessage}
            // We would pass the selected folder ID to the KnowledgeCompanion component
            // selectedFolderId={selectedFolderId}
          />
        </div>
      </div>
    </div>
  );
};

export default KnowledgeAssistantLayout;