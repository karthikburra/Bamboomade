import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  PlusCircle,
  Folder,
  FileText,
  MessageCircle,
  Link as LinkIcon,
  Search,
  Calendar,
  Book,
  Hash,
  Trash,
  ArrowLeftRight,
  Sparkles,
  Image
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Define types for folders and chat history
export interface ChatFolder {
  id: number;
  name: string;
  description: string | null;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  selected: boolean;
  sourceUrl?: string | null;
  contentType?: string;
}

export interface ChatHistoryItem {
  id: string;
  title?: string;
  date: Date;
  folderId?: number | null;
  selected: boolean;
}

interface ChatSidebarProps {
  folders: ChatFolder[];
  chatHistory: ChatHistoryItem[];
  onFolderSelect: (folderId: number) => void;
  onNewChat: () => void;
  onNewFolder: () => void;
  className?: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  folders,
  chatHistory,
  onFolderSelect,
  onNewChat,
  onNewFolder,
  className = ''
}) => {
  const [searchText, setSearchText] = useState('');
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Filter folders based on search
  const filteredFolders = folders.filter(folder => 
    folder.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // Get content type icon
  const getContentTypeIcon = (contentType?: string) => {
    switch (contentType) {
      case 'webpage':
        return <LinkIcon className="h-4 w-4 mr-2" />;
      case 'event':
        return <Calendar className="h-4 w-4 mr-2" />;
      case 'document':
        return <FileText className="h-4 w-4 mr-2" />;
      case 'book':
        return <Book className="h-4 w-4 mr-2" />;
      case 'image':
        return <Image className="h-4 w-4 mr-2" />;
      case 'social_media':
        return <Hash className="h-4 w-4 mr-2" />;
      default:
        return <Folder className="h-4 w-4 mr-2" />;
    }
  };

  // Handle creating a new folder
  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      // Call the provided callback with the new folder name
      onNewFolder();
      setShowNewFolderDialog(false);
      setNewFolderName('');
    }
  };

  return (
    <div className={`flex flex-col h-full bg-gray-900 border-r border-gray-800 ${className}`}>
      {/* Header with New Chat button */}
      <div className="p-4 border-b border-gray-800">
        <Button 
          variant="secondary" 
          className="w-full bg-gray-800 hover:bg-gray-700 text-white"
          onClick={onNewChat}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Search bar */}
      <div className="p-2">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search folders..."
            className="pl-8 bg-gray-800 border-gray-700 text-sm"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
      </div>

      {/* Folder list */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-1">
          {filteredFolders.length > 0 ? (
            filteredFolders.map((folder) => (
              <Button
                key={folder.id}
                variant="ghost"
                className={`w-full justify-start text-left ${
                  folder.selected ? 'bg-amber-900/30 text-amber-400' : 'text-gray-300 hover:bg-gray-800'
                }`}
                onClick={() => onFolderSelect(folder.id)}
              >
                {getContentTypeIcon(folder.contentType)}
                <span className="truncate">{folder.name}</span>
              </Button>
            ))
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              {searchText ? 'No matching folders' : 'No folders available'}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer with Create Folder button */}
      <div className="p-4 border-t border-gray-800">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
                onClick={() => setShowNewFolderDialog(true)}
              >
                <Folder className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Create a new folder to organize your knowledge</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* New Folder Dialog */}
      <Dialog open={showNewFolderDialog} onOpenChange={setShowNewFolderDialog}>
        <DialogContent className="bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-amber-400">Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              placeholder="Folder name"
              className="bg-gray-800 border-gray-700"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              className="border-gray-700 text-gray-300"
              onClick={() => setShowNewFolderDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatSidebar;